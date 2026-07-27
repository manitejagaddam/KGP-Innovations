import React, { useState } from 'react'
import { AlertTriangle, Info, Lock, Eye, EyeOff } from 'lucide-react'

export default function ControlModal({ isOpen, onClose, deviceName, targetPowerState, onConfirm }) {
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [reason, setReason] = useState('Check out')
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleVerify = (e) => {
    e.preventDefault()
    setErrorMsg('')
    
    if (!password) {
      setErrorMsg('Password is required')
      return
    }
    if (!reason.trim()) {
      setErrorMsg('Reason for change is required')
      return
    }

    const result = onConfirm(password, reason)
    if (result && !result.success) {
      setErrorMsg(result.error || 'Invalid token')
    } else {
      // Clear fields and close
      setPassword('admin123')
      setReason('Check out')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden p-6 text-slate-800 dark:text-slate-100">
        
        {/* Warning Title Block */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-full shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-outfit font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            Confirm Control Mode Change
          </h3>
        </div>

        {/* Informative Blue Bar */}
        <div className="flex gap-3.5 p-3.5 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold leading-relaxed mb-4">
          <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <p>
            You are about to change device <span className="font-bold text-blue-700 dark:text-blue-300">{deviceName}</span> to <span className="font-bold text-blue-700 dark:text-blue-300">Manual {targetPowerState}</span>
          </p>
        </div>

        {/* Error message block (matching "Invalid token" error panel in Screenshot 2) */}
        {errorMsg && (
          <div className="flex gap-3.5 p-3.5 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold leading-relaxed mb-4">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          {/* Password field */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Enter Your Password *
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500/80 text-slate-900 dark:text-slate-100 rounded-xl outline-none transition-all font-medium"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Password verification required for security
            </p>
          </div>

          {/* Reason text box */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Reason for Change *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="3"
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500/80 text-slate-900 dark:text-slate-100 rounded-xl outline-none transition-all font-medium resize-none"
              placeholder="e.g. Scheduled Maintenance, Incident investigation"
            />
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              This reason will be logged for audit purposes
            </p>
          </div>

          {/* Buttons */}
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
              Verify & Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
