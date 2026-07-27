import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { mqttService } from '../services/mqttService'
import { devicesApi, alertsApi, usersApi, vendorsApi } from '../services/api'

const AppContext = createContext()

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [activeTab, setActiveTab] = useState('fleet-overview')
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [devices, setDevices] = useState([])
  const [users, setUsers] = useState([])
  const [vendors, setVendors] = useState([])
  const [alerts, setAlerts] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [mqttStatus, setMqttStatus] = useState('disconnected')
  const [mqttErr, setMqttErr] = useState('')

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  // Load devices and alerts from backend
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [devRes, alertRes] = await Promise.allSettled([
        devicesApi.list(),
        alertsApi.list()
      ])
      if (devRes.status === 'fulfilled') {
        const d = devRes.value
        setDevices(Array.isArray(d) ? d : (d.data || []))
      }
      if (alertRes.status === 'fulfilled') {
        const a = alertRes.value
        setAlerts(Array.isArray(a) ? a : (a.data || []))
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load users and vendors (admin/vendor only — will fail gracefully for viewers)
  const loadUsersAndVendors = useCallback(async () => {
    try {
      const [userRes, vendorRes] = await Promise.allSettled([
        usersApi.list(),
        vendorsApi.list()
      ])
      if (userRes.status === 'fulfilled') {
        const u = userRes.value
        setUsers(Array.isArray(u) ? u : (u.data || []))
      }
      if (vendorRes.status === 'fulfilled') {
        const v = vendorRes.value
        setVendors(Array.isArray(v) ? v : (v.data || []))
      }
    } catch (err) {
      console.warn('Could not load users/vendors (may be permission issue):', err)
    }
  }, [])

  useEffect(() => {
    loadData()
    loadUsersAndVendors()
  }, [loadData, loadUsersAndVendors])

  // MQTT setup for real-time telemetry
  useEffect(() => {
    mqttService.connect((status, isMock, errMessage) => {
      setMqttStatus(status)
      if (errMessage) setMqttErr(errMessage)
      else setMqttErr('')
    })

    mqttService.subscribe('devices/+/telemetry', (payload, topic) => {
      const devId = topic.split('/')[1]
      setDevices(prev => prev.map(d => {
        if (d.id !== devId && d.mqtt_topic !== devId) return d
        const updatedTelemetry = {
          voltage: Number(payload.v ?? d.latest_telemetry?.voltage ?? 0),
          current_a: Number(payload.a ?? d.latest_telemetry?.current_a ?? 0),
          energy_kwh: Number(payload.kwh ?? d.latest_telemetry?.energy_kwh ?? 0),
          power_factor: Number(payload.pf ?? d.latest_telemetry?.power_factor ?? 0),
          power_load_w: Number(payload.w ?? d.latest_telemetry?.power_load_w ?? 0),
          temperature_c: Number(payload.t ?? d.latest_telemetry?.temperature_c ?? 0),
          frequency: Number(payload.hz ?? d.latest_telemetry?.frequency ?? 0),
          door_status: payload.door !== undefined
            ? (payload.door ? 'OPEN' : 'CLOSED')
            : (d.latest_telemetry?.door_status || 'CLOSED')
        }
        return {
          ...d,
          status: updatedTelemetry.current_a > 0.05 ? 'ACTIVE' : 'INACTIVE',
          power: updatedTelemetry.current_a > 0.05 ? 'ON' : 'OFF',
          connection_status: 'Connected',
          last_seen: new Date().toISOString(),
          latest_telemetry: updatedTelemetry
        }
      }))
    })

    return () => mqttService.disconnect()
  }, [])

  const addLog = (type, triggeredBy, details, deviceId = null) => {
    const newLog = {
      timestamp: new Date().toLocaleTimeString(),
      type, triggeredBy, details, deviceId
    }
    setLogs(prev => [newLog, ...prev].slice(0, 100))
  }

  const triggerAlert = (deviceId, type, severity) => {
    const exists = alerts.some(a => a.device_id === deviceId && a.type === type && a.status === 'New')
    if (exists) return
    const newAlert = {
      id: `A-${Date.now()}`,
      device_id: deviceId,
      type,
      severity,
      status: 'New',
      created_at: new Date().toISOString()
    }
    setAlerts(prev => [newAlert, ...prev])
  }

  const updateAlertStatus = (alertId, newStatus) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus } : a))
    alertsApi.update(alertId, { status: newStatus }).catch(console.error)
  }

  const executePowerControl = async (deviceId, targetPowerState, reason) => {
    try {
      await devicesApi.sendCommand(deviceId, { power: targetPowerState, reason })
      setDevices(prev => prev.map(d =>
        d.id === deviceId
          ? { ...d, power: targetPowerState, status: targetPowerState === 'ON' ? 'ACTIVE' : 'INACTIVE' }
          : d
      ))
      addLog('Control Command', 'user', `Power set to ${targetPowerState}`, deviceId)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const updateDeviceSchedule = (deviceId, newOnTime, newOffTime) => {
    setDevices(prev => prev.map(d =>
      d.id === deviceId
        ? { ...d, schedule: { ...d.schedule, turnOn: newOnTime, turnOff: newOffTime } }
        : d
    ))
    addLog('Schedule Edit', 'admin', `Updated schedule for device ${deviceId}`, deviceId)
  }

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || devices[0] || null

  return (
    <AppContext.Provider value={{
      theme, setTheme,
      activeTab, setActiveTab,
      devices, setDevices,
      selectedDeviceId, setSelectedDeviceId,
      selectedDevice,
      users, setUsers,
      vendors, setVendors,
      alerts, setAlerts,
      updateAlertStatus, triggerAlert,
      logs, addLog,
      loading,
      mqttStatus, mqttErr,
      executePowerControl,
      updateDeviceSchedule,
      sidebarCollapsed, setSidebarCollapsed,
      refreshDevices: loadData
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
