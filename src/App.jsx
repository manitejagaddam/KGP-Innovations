import React, { useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import { connectWs, disconnectWs } from './services/wsClient'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Simulator from './components/Simulator'

// Import Pages
import FleetOverview from './pages/FleetOverview'
import DeviceDetails from './pages/DeviceDetails'
import DeviceMap from './pages/DeviceMap'
import Analytics from './pages/Analytics'
import Alerts from './pages/Alerts'
import Automations from './pages/Automations'
import Reports from './pages/Reports'
import AuditLogs from './pages/AuditLogs'
import Users from './pages/Users'
import Vendors from './pages/Vendors'
import Settings from './pages/Settings'
import Firmware from './pages/Firmware'

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h2 className="text-2xl font-bold text-slate-200 mb-2">Access Denied</h2>
      <p className="text-slate-400">You don't have permission to view this page.</p>
    </div>
  )
}

function DashboardShell() {
  const { activeTab, setDevices, setAlerts, sidebarCollapsed } = useApp()
  const { isAuthenticated, user } = useAuth()

  // Connect WebSocket on auth success
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken')
      if (token) {
        connectWs(token, (type, data) => {
          if (type === 'telemetry') {
            setDevices(prev => prev.map(d => 
              d.id === data.deviceId ? { ...d, telemetry: { ...d.telemetry, ...data.telemetry }, power: data.telemetry.current > 0.05 ? 'ON' : 'OFF', status: data.telemetry.current > 0.05 ? 'ACTIVE' : 'INACTIVE', lastSeen: 'Just now' } : d
            ))
          } else if (type === 'alert') {
            setAlerts(prev => [data, ...prev])
          } else if (type === 'device_update') {
            setDevices(prev => prev.map(d => d.id === data.id ? { ...d, ...data } : d))
          }
        })
      }
    } else {
      disconnectWs()
    }
    return () => disconnectWs()
  }, [isAuthenticated, setDevices, setAlerts])

  // Dynamic Page routing switch
  const renderPage = () => {
    switch (activeTab) {
      case 'fleet-overview':
      case '':
        return <FleetOverview />
      case 'device-details':
        return <DeviceDetails />
      case 'device-map':
        return <DeviceMap />
      case 'analytics':
        return <Analytics />
      case 'alerts':
        return <Alerts />
      case 'reports':
        return <Reports />
      case 'audit-logs':
        return <AuditLogs />
      case 'ota-updates':
      case 'firmware':
        return user?.role?.toLowerCase() === 'admin' ? <Firmware /> : <AccessDenied />
      case 'users':
        return user?.role?.toLowerCase() === 'admin' ? <Users /> : <AccessDenied />
      case 'vendors':
        return user?.role?.toLowerCase() === 'admin' ? <Vendors /> : <AccessDenied />
      case 'settings':
        return <Settings />
      default:
        return <FleetOverview />
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-kgp-blue-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
        
        {/* Sidebar - Collapsible & Responsive */}
        <Sidebar />

        {/* Main Panel Wrapper */}
        <div className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'md:pl-16' : 'md:pl-60'}`}>
          
          {/* Header navigation controls */}
          <Topbar />

          {/* Dashboard Content Container */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            {renderPage()}
          </main>

        </div>

        {/* Collapsible hardware simulator panel (visible globally) */}
        <Simulator />
        
      </div>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <DashboardShell />
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
