import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { Bell, Search, Sun, Moon, Check, X, ShieldAlert } from 'lucide-react'

export default function Topbar() {
  const { theme, setTheme, alerts, updateAlertStatus, activeTab, setActiveTab } = useApp()
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)

  const dropdownRef = useRef(null)

  const unreadAlerts = alerts.filter(a => a.status === 'New')

  // Close notifications dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="sticky top-0 right-0 w-full h-16 z-20 flex items-center justify-between px-6 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      {/* Left: Breadcrumbs or Title & Mobile Menu Indicator */}
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          onClick={() => {
            const sidebar = document.querySelector('aside')
            if (sidebar) sidebar.classList.toggle('-translate-x-full')
          }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Global Search Bar */}
        <div className="relative hidden sm:flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search devices, alerts, or users..." 
            className="w-64 pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500/50 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200 rounded-xl outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Search Icon for Mobile */}
        <button className="sm:hidden p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
          <Search size={18} />
        </button>

        {/* Dark/Light Mode Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notification Bell with Badge */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all relative
              ${showNotifications ? 'bg-slate-100 dark:bg-slate-800 text-blue-500' : ''}`}
            title="Notification Center"
          >
            <Bell size={18} />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white font-outfit text-[9px] font-extrabold flex items-center justify-center rounded-full animate-bounce">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 glass-card bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-outfit font-bold text-sm text-slate-800 dark:text-slate-200">Alert Center</span>
                <span className="text-[10px] font-semibold bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-full uppercase">
                  {unreadAlerts.length} new incidents
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    No active system alerts. All systems operational.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40
                        ${alert.status === 'New' ? 'bg-blue-500/5 dark:bg-blue-500/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5
                          ${alert.severity === 'Critical' ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'}`}
                        >
                          <ShieldAlert size={14} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{alert.deviceId}</span>
                            <span className="text-[9px] text-slate-400 font-medium">{alert.timestamp.split(' ')[1]}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">{alert.type}</p>
                          
                          {/* Alert Actions */}
                          {alert.status === 'New' && (
                            <div className="flex gap-2 mt-3">
                              <button 
                                onClick={() => updateAlertStatus(alert.id, 'Acknowledged')}
                                className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-[10px] text-slate-600 dark:text-slate-300 font-semibold rounded-md transition-colors"
                              >
                                <Check size={10} /> Ack
                              </button>
                              <button 
                                onClick={() => updateAlertStatus(alert.id, 'Resolved')}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold rounded-md transition-colors"
                              >
                                <Check size={10} /> Resolve
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {alerts.length > 0 && (
                <button 
                  onClick={() => {
                    setActiveTab('alerts')
                    setShowNotifications(false)
                  }}
                  className="w-full py-2.5 border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-[11px] font-bold text-blue-500 text-center uppercase tracking-wider transition-colors"
                >
                  View All Incidents
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Initial Circle */}
        <div 
          className="w-9 h-9 rounded-full bg-blue-600 text-white font-outfit font-extrabold text-sm flex items-center justify-center shadow-lg shadow-blue-600/20 border-2 border-white dark:border-slate-900 cursor-pointer hover:scale-105 transition-transform"
          title={user?.displayName || 'User'}
        >
          {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  )
}
