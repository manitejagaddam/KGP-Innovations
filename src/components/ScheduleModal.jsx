import React, { useState } from 'react'
import { Calendar, Clock, X } from 'lucide-react'

export default function ScheduleModal({ isOpen, onClose, schedule, onSave }) {
  const [onTime, setOnTime] = useState(schedule?.turnOn || '06:00 PM')
  const [offTime, setOffTime] = useState(schedule?.turnOff || '06:02 AM')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(onTime, offTime)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-outfit font-bold text-lg text-slate-900 dark:text-white">
              Edit Operational Schedule
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Turn ON timing */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Turn ON Time
            </label>
            <div className="relative flex items-center">
              <Clock className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={onTime}
                onChange={(e) => setOnTime(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-slate-100 rounded-xl outline-none font-medium"
                placeholder="e.g. 06:00 PM"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Standard local time format (e.g. 06:00 PM)
            </p>
          </div>

          {/* Turn OFF timing */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Turn OFF Time
            </label>
            <div className="relative flex items-center">
              <Clock className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={offTime}
                onChange={(e) => setOffTime(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-slate-100 rounded-xl outline-none font-medium"
                placeholder="e.g. 06:02 AM"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Standard local time format (e.g. 06:02 AM)
            </p>
          </div>

          <div className="p-3 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-600 dark:text-blue-400 rounded-xl font-medium leading-relaxed">
            Note: Changing this schedule applies immediately and recalculates the total operational active hours configuration.
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 transition-all uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all uppercase tracking-wider shadow-lg shadow-blue-600/20"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
