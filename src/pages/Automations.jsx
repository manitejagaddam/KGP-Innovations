import React, { useState } from 'react'
import { Zap, Play, ToggleLeft, ToggleRight, Plus, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Automations() {
  const { addLog } = useApp()
  const [automations, setAutomations] = useState([
    { id: 'A-10', name: 'Auto Dusk ON', trigger: 'Ambient Light < 150 Lux', action: 'Turn ON Lights', enabled: true },
    { id: 'A-11', name: 'Auto Dawn OFF', trigger: 'Ambient Light > 300 Lux', action: 'Turn OFF Lights', enabled: true },
    { id: 'A-12', name: 'High Temperature Safety Cutoff', trigger: 'Internal Temp > 70°C', action: 'Turn OFF Relay & Alert Admin', enabled: false }
  ])

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [trigger, setTrigger] = useState('')
  const [action, setAction] = useState('')

  const handleToggle = (id) => {
    setAutomations(prev => prev.map(a => {
      if (a.id === id) {
        const nextState = !a.enabled
        addLog('Automation Toggle', 'admin', `Automation rule '${a.name}' marked as ${nextState ? 'ENABLED' : 'DISABLED'}`)
        return { ...a, enabled: nextState }
      }
      return a
    }))
  }

  const handleAddSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !trigger.trim() || !action.trim()) return

    const newRule = {
      id: `A-${Math.floor(10 + Math.random() * 90)}`,
      name,
      trigger,
      action,
      enabled: true
    }

    setAutomations(prev => [...prev, newRule])
    addLog('Automation Creation', 'admin', `Registered automation rule: ${name}`)
    setName('')
    setTrigger('')
    setAction('')
    setIsAddModalOpen(false)
  }

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-outfit font-black text-2xl tracking-tight text-slate-900 dark:text-white uppercase">
            Automation Rules
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            Rule-based device execution scheduler
          </p>
        </div>

        {/* Add Rule Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
        >
          <Plus size={16} />
          <span>New Rule</span>
        </button>
      </div>

      {/* Rules list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {automations.map((rule) => (
          <div 
            key={rule.id} 
            className={`glass-card bg-white dark:bg-slate-900 p-5 border transition-all flex flex-col justify-between h-52
              ${rule.enabled ? 'border-blue-500/30' : 'border-slate-200 dark:border-slate-800/80'}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className={`p-2 rounded-xl
                  ${rule.enabled ? 'bg-blue-600/10 text-blue-500' : 'bg-slate-100 dark:bg-slate-850 text-slate-400'}`}
                >
                  <Zap size={16} className={rule.enabled ? 'fill-current' : ''} />
                </div>

                {/* Status Badge */}
                <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase
                  ${rule.enabled 
                    ? 'bg-blue-500/10 text-blue-500' 
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-400 border border-slate-200 dark:border-slate-850'}`}
                >
                  {rule.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>

              <h3 className="font-outfit font-bold text-base text-slate-900 dark:text-white leading-snug">{rule.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                <span className="font-bold text-slate-400">Trigger:</span> {rule.trigger}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                <span className="font-bold text-slate-400">Action:</span> {rule.action}
              </p>
            </div>

            {/* Bottom row: Toggle */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rule Status</span>
              <button 
                onClick={() => handleToggle(rule.id)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                {rule.enabled ? <ToggleRight size={28} className="text-blue-500" /> : <ToggleLeft size={28} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Rule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 text-slate-800 dark:text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 mb-4">
              <h3 className="font-outfit font-bold text-lg text-slate-900 dark:text-white">
                Create Automation Rule
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-slate-100 rounded-xl outline-none font-semibold"
                  placeholder="e.g. Sunset Timer ON"
                />
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Trigger Condition
                </label>
                <input
                  type="text"
                  required
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-slate-100 rounded-xl outline-none font-semibold"
                  placeholder="e.g. Ambient Light < 100 Lux"
                />
              </div>

              {/* Action */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Target Action
                </label>
                <input
                  type="text"
                  required
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-slate-100 rounded-xl outline-none font-semibold"
                  placeholder="e.g. Turn ON Group Lights"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 transition-all uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all uppercase tracking-wider shadow-lg shadow-blue-600/20"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
