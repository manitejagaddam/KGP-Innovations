import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { 
  ArrowLeft, 
  RotateCw, 
  Power, 
  Download, 
  Edit3, 
  Trash2, 
  Info,
  Clock,
  Compass,
  MapPin,
  HelpCircle,
  Activity,
  Sliders,
  Thermometer,
  ShieldAlert,
  Zap,
  Cable,
  Waves,
  Lightbulb
} from 'lucide-react'
import ControlModal from '../components/ControlModal'
import ScheduleModal from '../components/ScheduleModal'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Multimeter / Voltage Icon Component
const VoltmeterIcon = () => (
  <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="12" cy="13" r="5" />
    <line x1="12" y1="13" x2="15" y2="10" />
    <path d="M7 7h2M15 7h2" />
  </svg>
)

// Wave/Frequency Icon Component
const WaveIcon = () => (
  <svg className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12h3l3-9 4 18 3-12h5" />
  </svg>
)

// Energy Plug Meter Icon Component
const EnergyPlugIcon = () => (
  <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v6M9 8h6M10 12h4M10 16h4" />
    <rect x="7" y="8" width="10" height="14" rx="2" />
  </svg>
)

// Power Factor Vector Icon Component
const VectorIcon = () => (
  <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21h18M3 21V3M3 21l15-15M18 6h-5M18 6v5" />
  </svg>
)

// Power Load Circular Arrows Icon Component
const PowerLoadIcon = () => (
  <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.72" />
    <path d="M12 8v4l3 3" />
  </svg>
)

// Door Status Icon Component
const DoorIcon = () => (
  <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18M9 12h4" />
  </svg>
)

export default function DeviceDetails() {
  const { 
    selectedDevice, 
    setActiveTab, 
    executePowerControl, 
    updateDeviceSchedule, 
    logs 
  } = useApp()

  const [activeSubTab, setActiveSubTab] = useState('details') // 'details', 'charts', 'logs'
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString())
  const [isPowerModalOpen, setIsPowerModalOpen] = useState(false)
  const [isScheduleModalOpen, isSetScheduleModalOpen] = useState(false)
  const [refreshSpin, setRefreshSpin] = useState(false)

  // Live ticking clock matching top-right page timestamp
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!selectedDevice) {
    return (
      <div className="p-8 text-center text-slate-500">
        No device selected. Please return to the <button className="text-blue-500 underline" onClick={() => setActiveTab('fleet-overview')}>Fleet Overview</button>.
      </div>
    )
  }

  const handleRefresh = () => {
    setRefreshSpin(true)
    setTimeout(() => setRefreshSpin(false), 1000)
  }

  const handlePowerToggle = (password, reason) => {
    const targetState = selectedDevice.power === 'ON' ? 'OFF' : 'ON'
    return executePowerControl(selectedDevice.id, targetState, password, reason)
  }

  const [chartData, setChartData] = useState([])

  useEffect(() => {
    if (selectedDevice) {
      const data = Array.from({ length: 12 }).map((_, idx) => {
        const time = `${5 + idx}:00 PM`
        const baseVolt = selectedDevice.power === 'ON' ? 242 : 268
        const vOffset = (Math.random() - 0.5) * 3
        const tempBase = selectedDevice.power === 'ON' ? 44 : 29
        const tOffset = (Math.random() - 0.5) * 1.5
        
        return {
          name: time,
          Voltage: Number((baseVolt + vOffset).toFixed(1)),
          Temperature: Number((tempBase + tOffset).toFixed(1)),
          Load: selectedDevice.power === 'ON' ? 980 + Math.random() * 40 : 0
        }
      })
      setChartData(data)
    }
  }, [selectedDevice?.id])

  const isConnected = selectedDevice.connectionStatus === 'Connected'

  return (
    <div className="space-y-6">
      
      {/* Page Title & Remote Buttons Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('fleet-overview')}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-outfit font-black text-2xl tracking-tight text-slate-900 dark:text-white uppercase">
              {selectedDevice.name}
            </h2>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
              {selectedDevice.location}
            </p>
          </div>
        </div>

        {/* Action button bar */}
        <div className="flex items-center gap-1.5 self-end md:self-auto">
          {/* Refresh Action */}
          <button 
            onClick={handleRefresh}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer shadow-sm transition-transform"
          >
            <RotateCw size={16} className={refreshSpin ? 'animate-spin' : ''} />
          </button>
          
          {/* Power Command Action (Screen 2 confirmation triggers here) */}
          <button 
            onClick={() => setIsPowerModalOpen(true)}
            className={`p-2.5 border rounded-xl shadow-sm cursor-pointer transition-colors
              ${selectedDevice.power === 'ON'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
            title="Remote Power Command"
          >
            <Power size={16} />
          </button>

          {/* Export Action */}
          <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer shadow-sm">
            <Download size={16} />
          </button>

          {/* Edit Action */}
          <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer shadow-sm">
            <Edit3 size={16} />
          </button>

          {/* Delete Action */}
          <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 rounded-xl cursor-pointer shadow-sm transition-colors">
            <Trash2 size={16} />
          </button>

          {/* Info Action */}
          <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer shadow-sm">
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Tabs navigation & Clock Header row */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-px">
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveSubTab('details')}
            className={`pb-3 text-sm font-bold tracking-wide uppercase transition-colors relative cursor-pointer
              ${activeSubTab === 'details' 
                ? 'text-blue-500' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            Device Details
            {activeSubTab === 'details' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 rounded-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveSubTab('charts')}
            className={`pb-3 text-sm font-bold tracking-wide uppercase transition-colors relative cursor-pointer
              ${activeSubTab === 'charts' 
                ? 'text-blue-500' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            Visual Data
            {activeSubTab === 'charts' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 rounded-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveSubTab('logs')}
            className={`pb-3 text-sm font-bold tracking-wide uppercase transition-colors relative cursor-pointer
              ${activeSubTab === 'logs' 
                ? 'text-blue-500' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            Logs
            {activeSubTab === 'logs' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Live Clock Display (Visible on screens 1 and 4) */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-3">
          <Clock size={13} className="text-blue-500" />
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT PANEL: Bulb status indicator & Schedule details */}
          <div className="space-y-6">
            <div className="glass-card bg-white dark:bg-slate-900 p-6 flex flex-col items-center relative overflow-hidden">
              
              {/* Map pin shortcut */}
              <button 
                onClick={() => setActiveTab('device-map')}
                className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors"
                title="View on Map"
              >
                <MapPin size={16} />
              </button>

              {/* Big Bulb Status Graphic */}
              <div className={`w-36 h-36 rounded-full flex items-center justify-center mb-6 relative border-4
                ${!isConnected
                  ? 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-850'
                  : selectedDevice.power === 'ON'
                    ? 'bg-blue-600/10 border-blue-500 animate-glow-blue'
                    : 'bg-amber-500/10 border-amber-500/80 animate-glow-orange'}`}
              >
                <Lightbulb className={`w-16 h-16 
                  ${!isConnected
                    ? 'text-slate-400'
                    : selectedDevice.power === 'ON'
                      ? 'text-blue-500'
                      : 'text-amber-500'}`} 
                />
              </div>

              {/* Status title & Toggle label */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`font-outfit font-black text-3xl uppercase tracking-tight
                  ${!isConnected
                    ? 'text-slate-500'
                    : selectedDevice.power === 'ON'
                      ? 'text-emerald-500'
                      : 'text-amber-500'}`}
                >
                  {selectedDevice.status}
                </span>
                
                {/* Pill Badge */}
                <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase
                  ${selectedDevice.power === 'ON'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                >
                  {selectedDevice.power}
                </span>
              </div>

              {/* Detail fields below Bulb */}
              <div className="w-full space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                
                {/* Connection Status Indicator */}
                <div className="flex items-center justify-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full
                    ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} 
                  />
                  <span>{selectedDevice.connectionStatus} • {selectedDevice.lastSeen}</span>
                </div>

                {/* Hardware Spec Badges (Normal / Excellent) */}
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <span>Street Light</span>
                  <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase
                    ${isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-950 text-slate-500 border border-slate-200 dark:border-slate-850'}`}
                  >
                    {isConnected ? 'Normal' : 'Offline'}
                  </span>
                </div>

                {/* Signal Strength */}
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <span>Signal: {selectedDevice.signalStrength}</span>
                  {isConnected && (
                    <span className="px-2 py-px bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-extrabold uppercase">
                      {selectedDevice.signalLevel}
                    </span>
                  )}
                </div>

                {/* Device Time */}
                <div className="flex items-center justify-center gap-1.5 pt-1 text-slate-400">
                  <Clock size={11} />
                  <span>Device Time: {selectedDevice.deviceTime}</span>
                </div>
              </div>

              {/* Operational Schedule widget block */}
              <div className="w-full border-t border-slate-100 dark:border-slate-800/80 mt-5 pt-4 text-left">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <Clock size={14} className="text-blue-500" />
                    <span>Schedule</span>
                  </div>
                  <button 
                    onClick={() => isSetScheduleModalOpen(true)}
                    className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-850 rounded-lg text-blue-500 transition-colors"
                  >
                    <Edit3 size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850 p-3 rounded-2xl">
                  {/* ON */}
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Turn ON</p>
                    <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 mt-1">{selectedDevice.schedule?.turnOn || '--:--'}</p>
                  </div>
                  {/* Active Hours Duration */}
                  <div className="text-center flex flex-col items-center justify-center border-x border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-extrabold text-blue-500 leading-none">{selectedDevice.schedule?.duration || '0h'}</p>
                    <span className={`px-1.5 py-px mt-1.5 text-[8px] font-extrabold uppercase rounded
                      ${selectedDevice.schedule?.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
                    >
                      {selectedDevice.schedule?.status || 'Inactive'}
                    </span>
                  </div>
                  {/* OFF */}
                  <div className="text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Turn OFF</p>
                    <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 mt-1">{selectedDevice.schedule?.turnOff || '--:--'}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT PANEL: Live Telemetry telemetry grids (8 cards) */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Card 1: Voltage */}
            <div className="glass-card bg-white dark:bg-slate-900 p-5 flex flex-col justify-between h-36">
              <VoltmeterIcon />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Voltage</p>
                <h4 className="font-outfit font-extrabold text-xl text-blue-500 mt-1">
                  {isConnected ? `${selectedDevice.telemetry?.voltage ?? 0}V` : 'N/A'}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Volts</p>
              </div>
            </div>

            {/* Card 2: Frequency */}
            <div className="glass-card bg-white dark:bg-slate-900 p-5 flex flex-col justify-between h-36">
              <WaveIcon />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Frequency</p>
                <h4 className="font-outfit font-extrabold text-xl text-amber-500 mt-1">
                  {isConnected ? `${selectedDevice.telemetry?.frequency?.toFixed(1) ?? 50.0}` : 'N/A'}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hz</p>
              </div>
            </div>

            {/* Card 3: Current */}
            <div className="glass-card bg-white dark:bg-slate-900 p-5 flex flex-col justify-between h-36">
              <Zap className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current</p>
                <h4 className="font-outfit font-extrabold text-xl text-blue-500 mt-1">
                  {isConnected ? `${selectedDevice.telemetry?.current?.toFixed(2) ?? 0.00}` : 'N/A'}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Amps</p>
              </div>
            </div>

            {/* Card 4: Energy */}
            <div className="glass-card bg-white dark:bg-slate-900 p-5 flex flex-col justify-between h-36">
              <EnergyPlugIcon />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Energy</p>
                <h4 className="font-outfit font-extrabold text-xl text-emerald-500 mt-1">
                  {selectedDevice.telemetry?.energy?.toFixed(2) ?? 0.00}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">kWh</p>
              </div>
            </div>

            {/* Card 5: Power Factor */}
            <div className="glass-card bg-white dark:bg-slate-900 p-5 flex flex-col justify-between h-36">
              <VectorIcon />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Power Factor</p>
                <h4 className="font-outfit font-extrabold text-xl text-blue-500 mt-1">
                  {isConnected ? `${selectedDevice.telemetry?.powerFactor?.toFixed(2) ?? 0.95}` : 'N/A'}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">PF</p>
              </div>
            </div>

            {/* Card 6: Power Load */}
            <div className="glass-card bg-white dark:bg-slate-900 p-5 flex flex-col justify-between h-36">
              <PowerLoadIcon />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Power Load</p>
                <h4 className="font-outfit font-extrabold text-xl text-emerald-500 mt-1">
                  {isConnected ? `${selectedDevice.telemetry?.powerLoad ?? 0}` : 'N/A'}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Watts</p>
              </div>
            </div>

            {/* Card 7: Temperature */}
            <div className={`glass-card p-5 flex flex-col justify-between h-36 border transition-colors
              ${selectedDevice.telemetry?.temperature > 60.0 
                ? 'bg-red-500/5 border-red-500/30' 
                : 'bg-white dark:bg-slate-900'}`}
            >
              <Thermometer className={`w-8 h-8 
                ${selectedDevice.telemetry?.temperature > 60.0 ? 'text-red-500' : 'text-amber-500'}`} 
              />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Temperature</p>
                <h4 className={`font-outfit font-extrabold text-xl mt-1
                  ${selectedDevice.telemetry?.temperature > 60.0 ? 'text-red-500' : 'text-orange-500'}`}
                >
                  {selectedDevice.telemetry?.temperature?.toFixed(1) ?? 35.0}°C
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Celsius</p>
              </div>
            </div>

            {/* Card 8: Door Status */}
            <div className={`glass-card p-5 flex flex-col justify-between h-36 border transition-colors
              ${selectedDevice.telemetry?.doorStatus === 'OPEN' 
                ? 'bg-red-500/5 border-red-500/30' 
                : 'bg-white dark:bg-slate-900'}`}
            >
              <DoorIcon />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Door Status</p>
                <h4 className={`font-outfit font-extrabold text-lg mt-1 uppercase
                  ${selectedDevice.telemetry?.doorStatus === 'OPEN' ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}
                >
                  {selectedDevice.telemetry?.doorStatus ?? 'CLOSED'}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {selectedDevice.telemetry?.doorStatus === 'OPEN' ? 'Tampered' : 'Secure'}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Visual charts (Recharts) */}
      {activeSubTab === 'charts' && (
        <div className="glass-card bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-outfit font-bold text-base text-slate-800 dark:text-slate-200">Historical Trends</h3>
            <span className="text-xs text-slate-400 font-medium">Last 12 Hours Data</span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVolt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '12px',
                    color: '#f1f5f9'
                  }} 
                />
                <Area type="monotone" dataKey="Voltage" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVolt)" />
                <Area type="monotone" dataKey="Temperature" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Local device activity logs */}
      {activeSubTab === 'logs' && (
        <div className="glass-card bg-white dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">Triggered By</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
              {logs
                .filter(log => !log.deviceId || log.deviceId === selectedDevice.id)
                .map((log, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <td className="p-4 font-mono text-xs">{log.timestamp}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                        ${log.type.includes('Alert') || log.type.includes('Alarm')
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : log.type.includes('Control')
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-semibold">{log.triggeredBy}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">{log.details}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Control Change Authorization Modal */}
      <ControlModal
        isOpen={isPowerModalOpen}
        onClose={() => setIsPowerModalOpen(false)}
        deviceName={selectedDevice.name}
        targetPowerState={selectedDevice.power === 'ON' ? 'OFF' : 'ON'}
        onConfirm={handlePowerToggle}
      />

      {/* Schedule timing Modal */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => isSetScheduleModalOpen(false)}
        schedule={selectedDevice.schedule}
        onSave={(onTime, offTime) => updateDeviceSchedule(selectedDevice.id, onTime, offTime)}
      />
      
    </div>
  )
}
