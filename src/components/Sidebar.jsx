import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { 
  Activity, 
  Map, 
  BarChart3, 
  AlertTriangle, 
  Zap, 
  Briefcase, 
  Users, 
  Settings, 
  Power, 
  ChevronLeft, 
  ChevronRight,
  Lightbulb,
  Calculator,
  Menu,
  Cpu,
  ChevronDown,
  Droplet,
  Trash2,
  Car,
  Clock,
  Shield
} from 'lucide-react'

export default function Sidebar() {
  const { activeTab, setActiveTab, sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useApp()
  const { user, logout } = useAuth()
  const [smartFeaturesOpen, setSmartFeaturesOpen] = useState(false)

  const menuItems = [
    { id: 'fleet-overview', label: 'Fleet Overview', icon: Activity, badge: 'Live', badgeColor: 'bg-emerald-500 text-white' },
    { id: 'device-map', label: 'Device Map', icon: Map },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'automations', label: 'Automations', icon: Zap, badge: 'New', badgeColor: 'bg-blue-600 text-white' },
  ]

  const adminItems = [
    { id: 'vendors', label: 'Vendors', icon: Briefcase },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'firmware', label: 'Firmware', icon: Cpu },
    { id: 'pending-devices', label: 'Pending Approval', icon: Clock },
    { id: 'menu-config', label: 'Menu Configuration', icon: Menu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const smartFeatures = [
    { id: 'sf-tank', label: 'Tank Indicator', icon: Droplet },
    { id: 'sf-dustbin', label: 'Dustbin', icon: Trash2 },
    { id: 'sf-water', label: 'Water Quality', icon: Droplet },
    { id: 'sf-parking', label: 'Car Parking', icon: Car },
  ]

  // Filter items based on role
  const isAdmin = user?.role === 'Admin'
  const isVendor = user?.role === 'Vendor'
  
  const filteredMenuItems = menuItems.filter(item => {
    if (['fleet-overview', 'device-map', 'device-details'].includes(item.id)) return true;
    if (isAdmin || isVendor) return true;
    return false;
  })

  const filteredAdminItems = adminItems.filter(item => {
    if (['users', 'vendors', 'firmware', 'pending-devices'].includes(item.id)) return isAdmin;
    return true;
  })

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
  }

  return (
    <aside 
      className={`glass-panel fixed top-0 left-0 h-screen z-30 transition-all duration-300 flex flex-col justify-between select-none
        ${collapsed ? 'w-20' : 'w-64'} 
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800`}
    >
      {/* Brand Logo Header */}
      <div>
        <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 fill-current animate-pulse-glow" />
            </div>
            {!collapsed && (
              <span className="font-outfit font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap">
                KGP Inovation
              </span>
            )}
          </div>
          
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="px-3 py-4 space-y-6 overflow-y-auto">
          {/* IoT Management Section */}
          <div className="space-y-1">
            {!collapsed && (
              <h3 className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                IoT Management
              </h3>
            )}
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id || (item.id === 'fleet-overview' && activeTab === 'device-details')
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'}`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  
                  {/* Badge */}
                  {item.badge && !collapsed && (
                    <span className={`ml-auto px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.badge && collapsed && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Administration Section */}
          <div className="space-y-1">
            {!collapsed && (
              <h3 className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Administration
              </h3>
            )}
            {filteredAdminItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'}`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              )
            })}

            {/* Smart Features Dropdown */}
            <div className="pt-2">
              <button
                onClick={() => {
                  if (collapsed) setCollapsed(false)
                  setSmartFeaturesOpen(!smartFeaturesOpen)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200`}
              >
                <Cpu className="w-5 h-5 shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                {!collapsed && (
                  <>
                    <span className="truncate">Smart Features</span>
                    <ChevronDown className={`ml-auto w-4 h-4 transition-transform ${smartFeaturesOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
              
              {!collapsed && smartFeaturesOpen && (
                <div className="mt-1 ml-4 border-l-2 border-slate-200 dark:border-slate-800 pl-2 space-y-1">
                  {smartFeatures.map(sf => {
                    const SfIcon = sf.icon
                    const isSfActive = activeTab === sf.id
                    return (
                      <button
                        key={sf.id}
                        onClick={() => handleTabClick(sf.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group
                          ${isSfActive 
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        <SfIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{sf.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Profile Section */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Avatar image */}
            <img 
              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user?.displayName || 'admin'}`} 
              alt="avatar" 
              className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
            />
            {!collapsed && (
              <div className="text-left overflow-hidden">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.displayName || 'User'}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{user?.role || 'Guest'}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button 
              onClick={() => logout()}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
            >
              <Power size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
