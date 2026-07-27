import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { 
  Activity, 
  Lightbulb, 
  AlertTriangle, 
  BatteryCharging, 
  Compass, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Signal,
  Plus,
  Power
} from 'lucide-react'
import { useToast } from '../components/Toast'

export default function FleetOverview() {
  const { devices, setDevices, alerts, setActiveTab, setSelectedDeviceId, isLoadingDevices, deviceError, executePowerControl } = useApp()
  const toast = useToast()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newDevice, setNewDevice] = useState({ name: '', location: '' })

  const totalCount = devices.length
  const activeCount = devices.filter(d => d.power === 'ON' && d.connectionStatus === 'Connected').length
  const offlineCount = devices.filter(d => d.connectionStatus === 'Disconnected').length
  const warningCount = alerts.filter(a => a.status === 'New').length

  const handleDeviceClick = (devId) => {
    setSelectedDeviceId(devId)
    setActiveTab('device-details')
  }

  const handleTogglePower = (device) => {
    const targetState = device.power === 'ON' ? 'OFF' : 'ON'
    const res = executePowerControl(device.id, targetState, 'admin123', 'Dashboard quick toggle')
    if (res.success) {
      toast.success(`${device.name} turned ${targetState}`)
    } else {
      toast.error('Failed to control device')
    }
  }

  const handleAddDevice = (e) => {
    e.preventDefault()
    const newId = `${newDevice.name.toUpperCase().replace(/\s+/g, '-')}-${Math.floor(1000 + Math.random() * 9000)}`
    
    const deviceObj = {
      id: newId,
      name: newDevice.name,
      location: newDevice.location,
      coordinates: [17.3850, 78.4867],
      status: 'INACTIVE',
      power: 'OFF',
      connectionStatus: 'Disconnected',
      lastSeen: 'Never',
      signalStrength: '0/31',
      signalLevel: 'None',
      deviceTime: 'N/A',
      type: 'Bulb',
      schedule: { turnOn: '18:00', turnOff: '06:00', duration: '12h', status: 'Active' },
      telemetry: { voltage: 0, frequency: 0, current: 0, energy: 0, powerFactor: 0, powerLoad: 0, temperature: 25, doorStatus: 'CLOSED' }
    }
    
    setDevices(prev => [deviceObj, ...prev])
    toast.success('Device added successfully')
    setIsAddModalOpen(false)
    setNewDevice({ name: '', location: '' })
  }

  // Compute total energy consumption
  const totalEnergy = devices.reduce((sum, d) => sum + (d.telemetry?.energy || 0), 0).toFixed(1)

  if (isLoadingDevices) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"></div>
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"></div>
      </div>
    );
  }

  if (deviceError) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Devices</h2>
        <p>{deviceError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 4 Summary Dashboard Widget Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Widget 1: Total Devices */}
        <div className="glass-card bg-white dark:bg-slate-900 p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Fleet</span>
            <h3 className="font-outfit font-black text-3xl text-slate-850 dark:text-white">{totalCount}</h3>
            <p className="text-[10px] font-semibold text-slate-400">Registered devices</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
            <Lightbulb size={24} className="fill-current" />
          </div>
        </div>

        {/* Widget 2: Active Devices */}
        <div className="glass-card bg-white dark:bg-slate-900 p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active ON</span>
            <h3 className="font-outfit font-black text-3xl text-emerald-500">{activeCount}</h3>
            <p className="text-[10px] font-semibold text-emerald-500/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Operational now
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <Activity size={24} />
          </div>
        </div>

        {/* Widget 3: Offline Devices */}
        <div className="glass-card bg-white dark:bg-slate-900 p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Offline</span>
            <h3 className="font-outfit font-black text-3xl text-slate-400 dark:text-slate-400">{offlineCount}</h3>
            <p className="text-[10px] font-semibold text-slate-400">Connection lost</p>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl">
            <Compass size={24} />
          </div>
        </div>

        {/* Widget 4: Alerts */}
        <div className="glass-card bg-white dark:bg-slate-900 p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Alarms</span>
            <h3 className="font-outfit font-black text-3xl text-red-500">{warningCount}</h3>
            <p className="text-[10px] font-semibold text-red-500/80">Require attention</p>
          </div>
          <div className={`p-3 rounded-2xl
            ${warningCount > 0 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
          >
            <AlertTriangle size={24} />
          </div>
        </div>

      </div>

      {/* Main Row: Devices Status List */}
      <div className="glass-card bg-white dark:bg-slate-900 overflow-hidden border-slate-200 dark:border-slate-800 shadow-md">
        <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
          <div>
            <h3 className="font-outfit font-bold text-base text-slate-900 dark:text-white">Device Fleet Registry</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time listing of active smart street lights</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-extrabold rounded-full uppercase tracking-wider hidden sm:inline-block">
              Telemetry Live
            </span>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/10"
            >
              <Plus size={14} strokeWidth={3} />
              <span>Add Device</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Device Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Operational Mode</th>
                <th className="p-4">Voltage</th>
                <th className="p-4">Temperature</th>
                <th className="p-4">Network</th>
                <th className="p-4 pr-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
              {devices.map((device) => {
                const isOnline = device.connectionStatus === 'Connected'
                return (
                  <tr key={device.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 font-medium">
                    
                    {/* Device Identifier */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 border
                          ${!isOnline 
                            ? 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-400' 
                            : device.power === 'ON' 
                              ? 'bg-blue-600/10 border-blue-500/30 text-blue-500' 
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}
                        >
                          <Lightbulb size={16} />
                        </div>
                        <div className="flex flex-col">
                          <button 
                            onClick={() => handleDeviceClick(device.id)}
                            className="font-bold text-slate-900 dark:text-white leading-tight text-left hover:text-blue-500 transition-colors"
                          >
                            {device.name}
                          </button>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold mt-0.5 tracking-wider">
                            ID: {device.id.substring(0, 15)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin size={12} className="text-slate-400" />
                        <span>{device.location}</span>
                      </div>
                    </td>

                    {/* Operational Power State */}
                    <td className="p-4">
                      <button 
                        onClick={() => handleTogglePower(device)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase transition-all shadow-sm
                        ${device.power === 'ON' 
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                        title="Toggle Power"
                      >
                        <Power size={12} />
                        {device.power}
                      </button>
                    </td>

                    {/* Voltage Telemetry */}
                    <td className="p-4 font-mono text-xs">
                      {isOnline ? `${device.telemetry.voltage.toFixed(1)} V` : '—'}
                    </td>

                    {/* Temperature Telemetry */}
                    <td className="p-4 font-mono text-xs">
                      <span className={device.telemetry.temperature > 60.0 ? 'text-red-500 font-bold' : ''}>
                        {device.telemetry.temperature.toFixed(1)} °C
                      </span>
                    </td>

                    {/* Network connectivity */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {isOnline ? `Online (${device.signalLevel})` : 'Offline'}
                        </span>
                      </div>
                    </td>

                    {/* Navigation Link to Details */}
                    <td className="p-4 pr-6 text-center">
                      <button
                        onClick={() => handleDeviceClick(device.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-850 rounded-xl text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                      >
                        <span>Details</span>
                        <ArrowRight size={12} />
                      </button>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Device Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Register New Device</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            <form onSubmit={handleAddDevice} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Device Name</label>
                <input required type="text" value={newDevice.name} onChange={e => setNewDevice({...newDevice, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800 dark:text-slate-200" placeholder="e.g. HYD-MAIN-STREET-5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
                <input required type="text" value={newDevice.location} onChange={e => setNewDevice({...newDevice, location: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-800 dark:text-slate-200" placeholder="e.g. Hyderabad" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-500/20">Add Device</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
