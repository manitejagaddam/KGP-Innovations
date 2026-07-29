import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { 
  Activity, 
  BarChart3, 
  FileText,
  Upload,
  ClipboardList,
  Users, 
  Settings, 
  Power, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Cpu,
  Layers
} from 'lucide-react'

export default function Sidebar() {
  const { activeTab, setActiveTab, sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed, alerts } = useApp()
  const { user, logout } = useAuth()

  const newAlertCount = alerts?.filter(a => a.status === 'New').length || 0

  // Main IoT Console items — matches reference structure
  const mainItems = [
    { id: 'fleet-overview', label: 'Fleet Overview', icon: '📡', badge: 'Live', badgeGreen: true },
    { id: 'device-details', label: 'All Devices', icon: '🧩' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'reports', label: 'Reports & Billing', icon: '🧾' },
    { id: 'ota-updates', label: 'OTA Updates', icon: '⬆️' },
    { id: 'audit-logs', label: 'Audit Logs', icon: '🗒️' },
  ]

  // Administration items — Admin only
  const adminItems = [
    { id: 'users', label: 'Users & Roles', icon: '👥' },
    { id: 'vendors', label: 'Vendors', icon: '🏢' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  const isAdmin = (user?.role || '').toLowerCase() === 'admin'
  const isVendor = (user?.role || '').toLowerCase() === 'vendor'

  // Vendor sees main items but not admin section
  // Viewer sees main items (read-only enforced per page)
  const visibleMainItems = mainItems.filter(item => {
    if (['reports', 'ota-updates'].includes(item.id)) return isAdmin || isVendor
    return true
  })

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
  }

  const NavItem = ({ item, isActive }) => (
    <button
      onClick={() => handleTabClick(item.id)}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all relative
        ${isActive
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      <span className="text-base shrink-0 w-5 text-center">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
      {item.badge && !collapsed && (
        <span className={`ml-auto px-2 py-0.5 text-[10px] font-bold uppercase rounded-full
          ${item.badgeGreen ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {item.badge}
        </span>
      )}
      {item.badge && collapsed && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full" />
      )}
    </button>
  )

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 select-none
        ${collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Brand */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm shrink-0">⚡</div>
          {!collapsed && (
            <span className="font-extrabold text-base tracking-tight text-slate-800 whitespace-nowrap">
              KGP Inovation
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 hover:bg-gray-100 text-gray-400 rounded-lg"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        {/* Unified IoT Console */}
        <div className="space-y-0.5">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Unified IoT Console
            </p>
          )}
          {visibleMainItems.map(item => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id || (item.id === 'fleet-overview' && activeTab === '' )}
            />
          ))}
        </div>

        {/* Administration — Admin only */}
        {isAdmin && (
          <div className="space-y-0.5">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Administration
              </p>
            )}
            {adminItems.map(item => (
              <NavItem key={item.id} item={item} isActive={activeTab === item.id} />
            ))}
          </div>
        )}
      </div>

      {/* Profile Footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-gray-400">{user?.role || 'Guest'}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => logout()}
              className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
              title="Logout"
            >
              <Power size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
