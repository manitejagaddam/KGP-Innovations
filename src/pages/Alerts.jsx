import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { AlertTriangle, Check, ShieldAlert, Sliders, Play, Trash2 } from 'lucide-react'

export default function Alerts() {
  const { alerts, updateAlertStatus } = useApp()
  const [filter, setFilter] = useState('All')
  
  // Alert rules config mock state
  const [rules, setRules] = useState([
    { id: 'R-1', metric: 'Voltage', condition: '>', threshold: '280V', enabled: true },
    { id: 'R-2', metric: 'Temperature', condition: '>', threshold: '60°C', enabled: true },
    { id: 'R-3', metric: 'Door Status', condition: '==', threshold: 'OPEN', enabled: true }
  ])

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'All') return true
    return a.status === filter
  })

  const toggleRule = (ruleId) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
  }

  return (
    <div className="space-y-6">
      
      {/* Page Title & Filter Tab Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-outfit font-black text-2xl tracking-tight text-slate-900 dark:text-white uppercase">
            Incidents & Alerts
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            Real-time safety threshold alarms
          </p>
        </div>

        {/* Filter controls */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl outline-none shadow-sm font-semibold cursor-pointer"
        >
          <option value="All">Filter: All Alerts</option>
          <option value="New">Filter: New</option>
          <option value="Acknowledged">Filter: Acknowledged</option>
          <option value="Resolved">Filter: Resolved</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Table List of Alert events (Left columns) */}
        <div className="lg:col-span-2 glass-card bg-white dark:bg-slate-900 overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-100 dark:border-slate-850">
            <h3 className="font-outfit font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Active Incident Log</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Alert ID</th>
                  <th className="p-4">Device</th>
                  <th className="p-4">Condition Breach</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No alerts triggered in this category. All systems normal.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 font-medium">
                      
                      {/* Alert ID */}
                      <td className="p-4 pl-6 font-mono text-xs">{alert.id}</td>

                      {/* Device */}
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{alert.deviceId}</td>

                      {/* Breach message */}
                      <td className="p-4 text-xs text-slate-500 dark:text-slate-400">{alert.type}</td>

                      {/* Severity */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase
                          ${alert.severity === 'Critical' 
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                            : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}
                        >
                          {alert.severity}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-xs">
                        <span className={`font-bold uppercase
                          ${alert.status === 'New' 
                            ? 'text-red-500 animate-pulse' 
                            : alert.status === 'Acknowledged' 
                              ? 'text-amber-500' 
                              : 'text-emerald-500'}`}
                        >
                          {alert.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {alert.status === 'New' && (
                            <button
                              onClick={() => updateAlertStatus(alert.id, 'Acknowledged')}
                              className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                            >
                              Ack
                            </button>
                          )}
                          {alert.status !== 'Resolved' && (
                            <button
                              onClick={() => updateAlertStatus(alert.id, 'Resolved')}
                              className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-bold rounded-lg text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer"
                            >
                              Resolve
                            </button>
                          )}
                          {alert.status === 'Resolved' && (
                            <span className="text-[10px] font-extrabold text-emerald-500 flex items-center gap-1">
                              <Check size={10} /> Handled
                            </span>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alarm Thresholds Configuration Rules (Right sidebar) */}
        <div className="glass-card bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <Sliders className="w-5 h-5 text-blue-500" />
            <h3 className="font-outfit font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider">Threshold Rules</h3>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div 
                key={rule.id} 
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between
                  ${rule.enabled 
                    ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-850' 
                    : 'bg-slate-100/40 dark:bg-slate-950/5 border-transparent opacity-50'}`}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{rule.metric}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Triggers alarm if value <span className="text-blue-500">{rule.condition} {rule.threshold}</span>
                  </p>
                </div>

                {/* Enable toggle switch */}
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200
                    ${rule.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-800'}`}
                >
                  <span className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200
                    ${rule.enabled ? 'translate-x-4' : 'translate-x-0'}`} 
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}
