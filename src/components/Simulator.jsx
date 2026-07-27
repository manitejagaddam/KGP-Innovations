import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Sliders, Wrench, Wifi, WifiOff, ShieldAlert, DoorOpen } from 'lucide-react'

export default function Simulator() {
  const { devices, setDevices, triggerAlert, addLog } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSimDevId, setSelectedSimDevId] = useState('GUNUPUDI-STREET-LIGHT')

  const activeDevice = devices.find(d => d.id === selectedSimDevId) || devices[0]

  const updateSimState = (field, value) => {
    setDevices(prev => prev.map(d => {
      if (d.id === selectedSimDevId) {
        if (field === 'connectionStatus') {
          const isConnected = value === 'Connected'
          return {
            ...d,
            connectionStatus: value,
            lastSeen: isConnected ? 'Just now' : '7m ago',
            signalStrength: isConnected ? '31/31' : '0/31',
            signalLevel: isConnected ? 'Excellent' : 'Weak',
            deviceTime: isConnected ? new Date().toLocaleTimeString() : 'N/A'
          }
        }
        if (field === 'doorStatus') {
          return {
            ...d,
            telemetry: { ...d.telemetry, doorStatus: value }
          }
        }
        return {
          ...d,
          telemetry: { ...d.telemetry, [field]: Number(value) }
        }
      }
      return d
    }))
  }

  const triggerCustomAlert = (type, severity) => {
    triggerAlert(selectedSimDevId, type, severity)
  }

  return (
    <div className={`fixed right-0 top-1/4 z-40 flex items-start transition-transform duration-350
      ${isOpen ? 'translate-x-0' : 'translate-x-[280px]'}`}
    >
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-l-2xl shadow-xl border border-r-0 border-blue-500/30 flex items-center justify-center cursor-pointer transition-colors"
      >
        <Sliders className="w-5 h-5 animate-pulse" />
      </button>

      {/* Control Drawer Content */}
      <div className="w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 text-slate-800 dark:text-slate-100 rounded-bl-2xl">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
          <Wrench className="w-5 h-5 text-blue-500" />
          <span className="font-outfit font-bold text-sm tracking-wide uppercase">Hardware Simulator</span>
        </div>

        {/* Device Select */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Active Device</label>
          <select 
            value={selectedSimDevId} 
            onChange={(e) => setSelectedSimDevId(e.target.value)}
            className="w-full text-xs font-semibold px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
          >
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.location} — {d.name.substring(0, 10)}...</option>
            ))}
          </select>
        </div>

        {activeDevice && (
          <div className="space-y-4">
            {/* Connection Toggle */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Network Connection</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateSimState('connectionStatus', 'Connected')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-lg border transition-colors
                    ${activeDevice.connectionStatus === 'Connected' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                      : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}
                >
                  <Wifi size={12} /> Live
                </button>
                <button
                  onClick={() => updateSimState('connectionStatus', 'Disconnected')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-lg border transition-colors
                    ${activeDevice.connectionStatus === 'Disconnected' 
                      ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' 
                      : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}
                >
                  <WifiOff size={12} /> Offline
                </button>
              </div>
            </div>

            {/* Slider Voltage */}
            {activeDevice.connectionStatus === 'Connected' && (
              <>
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    <span>Line Voltage</span>
                    <span className="text-blue-500">{activeDevice.telemetry.voltage} V</span>
                  </div>
                  <input
                    type="range"
                    min="180"
                    max="310"
                    value={activeDevice.telemetry.voltage}
                    onChange={(e) => updateSimState('voltage', e.target.value)}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Slider Temperature */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    <span>Internal Temp</span>
                    <span className="text-orange-500">{activeDevice.telemetry.temperature} °C</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="75"
                    value={activeDevice.telemetry.temperature}
                    onChange={(e) => updateSimState('temperature', e.target.value)}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>

                {/* Door Status Switch */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Enclosure Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateSimState('doorStatus', 'CLOSED')}
                      className={`py-1.5 text-[11px] font-bold rounded-lg border transition-colors
                        ${activeDevice.telemetry.doorStatus === 'CLOSED' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}
                    >
                      Secure
                    </button>
                    <button
                      onClick={() => {
                        updateSimState('doorStatus', 'OPEN')
                        triggerCustomAlert('Cabinet Enclosure Door OPEN', 'Warning')
                      }}
                      className={`py-1.5 text-[11px] font-bold rounded-lg border transition-colors
                        ${activeDevice.telemetry.doorStatus === 'OPEN' 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}
                    >
                      Tampered
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Instant Alarms */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Simulate Fault Trigger</label>
              <div className="space-y-1.5">
                <button
                  onClick={() => triggerCustomAlert('Critical Power Surge Threshold Breach', 'Critical')}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 transition-colors uppercase tracking-wider"
                >
                  <ShieldAlert size={12} /> Power Surge Alarm
                </button>
                <button
                  onClick={() => {
                    updateSimState('connectionStatus', 'Disconnected')
                    triggerCustomAlert('Device Network Offline Timeout', 'Critical')
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-lg bg-slate-600/10 hover:bg-slate-600/20 text-slate-600 dark:text-slate-400 transition-colors uppercase tracking-wider"
                >
                  <WifiOff size={12} /> Network Outage
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
