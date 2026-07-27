import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../services/supabaseClient'
import { mqttService, isMqttConfigured } from '../services/mqttService'

const AppContext = createContext()

const INITIAL_DEVICES = [
  {
    id: 'GUNUPUDI-STREET-LIGHT',
    name: 'GUNUPUDI-STREET-LIGHT',
    location: 'BHIMAVARAM',
    coordinates: [16.5449, 81.5224],
    status: 'INACTIVE',
    power: 'OFF',
    connectionStatus: 'Connected',
    lastSeen: 'Just now',
    signalStrength: '31/31',
    signalLevel: 'Excellent',
    deviceTime: new Date().toLocaleTimeString(),
    type: 'Bulb',
    schedule: {
      turnOn: '06:00 PM',
      turnOff: '06:02 AM',
      duration: '12.0h',
      status: 'Active'
    },
    telemetry: {
      voltage: 269.0,
      frequency: 50.0,
      current: 0.00,
      energy: 79.04,
      powerFactor: 0.00,
      powerLoad: 0.0,
      temperature: 39.1,
      doorStatus: 'CLOSED'
    }
  },
  {
    id: 'HYDERABAD-STREET-LIGHT-1',
    name: 'HYDERABAD-STREET-LIGHT-1',
    location: 'HYDERABAD',
    coordinates: [17.3850, 78.4867],
    status: 'ACTIVE',
    power: 'ON',
    connectionStatus: 'Connected',
    lastSeen: '1m ago',
    signalStrength: '28/31',
    signalLevel: 'Good',
    deviceTime: new Date().toLocaleTimeString(),
    type: 'Bulb',
    schedule: {
      turnOn: '06:30 PM',
      turnOff: '06:00 AM',
      duration: '11.5h',
      status: 'Active'
    },
    telemetry: {
      voltage: 242.4,
      frequency: 50.1,
      current: 4.25,
      energy: 142.12,
      powerFactor: 0.98,
      powerLoad: 1016.4,
      temperature: 44.5,
      doorStatus: 'CLOSED'
    }
  },
  {
    id: 'BHIMAVARAM-MAIN-LIGHT-2',
    name: 'BHIMAVARAM-MAIN-LIGHT-2',
    location: 'BHIMAVARAM',
    coordinates: [16.5410, 81.5290],
    status: 'ACTIVE',
    power: 'ON',
    connectionStatus: 'Connected',
    lastSeen: 'Just now',
    signalStrength: '30/31',
    signalLevel: 'Excellent',
    deviceTime: new Date().toLocaleTimeString(),
    type: 'Bulb',
    schedule: {
      turnOn: '06:00 PM',
      turnOff: '06:00 AM',
      duration: '12.0h',
      status: 'Active'
    },
    telemetry: {
      voltage: 244.1,
      frequency: 50.0,
      current: 4.15,
      energy: 98.45,
      powerFactor: 0.97,
      powerLoad: 982.5,
      temperature: 48.2,
      doorStatus: 'CLOSED'
    }
  },
  {
    id: 'VIJAYAWADA-LIGHT-3',
    name: 'VIJAYAWADA-LIGHT-3',
    location: 'VIJAYAWADA',
    coordinates: [16.5062, 80.6480],
    status: 'INACTIVE',
    power: 'OFF',
    connectionStatus: 'Disconnected',
    lastSeen: '7m ago',
    signalStrength: '0/31',
    signalLevel: 'Weak',
    deviceTime: 'N/A',
    type: 'Bulb',
    schedule: {
      turnOn: '07:00 PM',
      turnOff: '05:30 AM',
      duration: '10.5h',
      status: 'Active'
    },
    telemetry: {
      voltage: 0.0,
      frequency: 0.0,
      current: 0.00,
      energy: 312.42,
      powerFactor: 0.00,
      powerLoad: 0.0,
      temperature: 28.5,
      doorStatus: 'CLOSED'
    }
  }
]

const INITIAL_USERS = [
  { id: 'KGPE00003', name: 'Anil Kumar', email: 'worker1@hyderabad.gov', role: 'Worker', status: 'Active', created: '3/8/2026' },
  { id: 'KGPE00002', name: 'Suresh Naidu', email: 'worker2@bhimavaram.gov', role: 'Worker', status: 'Active', created: '3/8/2026' },
  { id: 'KGPE00001', name: 'Ramesh Reddy', email: 'worker1@bhimavaram.gov', role: 'Worker', status: 'Active', created: '3/8/2026' },
  { id: 'KGPV00002', name: 'Priya Sharma', email: 'vendor2@hyderabad.gov', role: 'Vendor', status: 'Active', created: '3/8/2026' },
  { id: 'KGPV00001', name: 'Rajesh Kumar', email: 'vendor1@bhimavaram.gov', role: 'Vendor', status: 'Active', created: '3/8/2026' },
  { id: 'KGPA00001', name: 'System Administrator', email: 'admin@iot.com', role: 'Admin', status: 'Active', created: '3/8/2026' }
]

const INITIAL_VENDORS = [
  { id: 'V-101', name: 'KGP Smart Lighting Systems', contact: 'sales@kgpsmart.com', phone: '+91 98765 43210', devices: 3, region: 'Andhra Pradesh', created: '2026-01-10' },
  { id: 'V-102', name: 'Telangana IoT Solutions', contact: 'support@tgiot.gov.in', phone: '+91 87654 32109', devices: 1, region: 'Hyderabad Region', created: '2026-02-15' },
]

const INITIAL_ALERTS = [
  { id: 'A-101', deviceId: 'VIJAYAWADA-LIGHT-3', type: 'Offline Alert', severity: 'Critical', status: 'New', timestamp: '2026-07-24 17:35:10' },
  { id: 'A-102', deviceId: 'GUNUPUDI-STREET-LIGHT', type: 'Over Voltage Alarm (269V)', severity: 'Warning', status: 'New', timestamp: '2026-07-24 17:38:00' }
]

const INITIAL_LOGS = [
  { timestamp: new Date().toLocaleTimeString(), type: 'Device Init', triggeredBy: 'System', details: 'Device compiled successfully' },
  { timestamp: new Date().toLocaleTimeString(), type: 'Connection established', triggeredBy: 'System', details: 'Device authenticated with broker' }
]

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [activeTab, setActiveTab] = useState('fleet-overview')
  const [selectedDeviceId, setSelectedDeviceId] = useState('GUNUPUDI-STREET-LIGHT')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  const [devices, setDevices] = useState(() => {
    const saved = localStorage.getItem('kgp_devices')
    return saved ? JSON.parse(saved) : INITIAL_DEVICES
  })
  
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('kgp_users')
    return saved ? JSON.parse(saved) : INITIAL_USERS
  })

  const [vendors, setVendors] = useState(() => {
    const saved = localStorage.getItem('kgp_vendors')
    return saved ? JSON.parse(saved) : INITIAL_VENDORS
  })

  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('kgp_alerts')
    return saved ? JSON.parse(saved) : INITIAL_ALERTS
  })

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('kgp_logs')
    return saved ? JSON.parse(saved) : INITIAL_LOGS
  })

  const [mqttStatus, setMqttStatus] = useState('disconnected')
  const [mqttErr, setMqttErr] = useState('')

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('kgp_devices', JSON.stringify(devices))
  }, [devices])

  useEffect(() => {
    localStorage.setItem('kgp_users', JSON.stringify(users))
  }, [users])

  useEffect(() => {
    localStorage.setItem('kgp_vendors', JSON.stringify(vendors))
  }, [vendors])

  useEffect(() => {
    localStorage.setItem('kgp_alerts', JSON.stringify(alerts))
  }, [alerts])

  useEffect(() => {
    localStorage.setItem('kgp_logs', JSON.stringify(logs))
  }, [logs])

  // Theme support
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  // Real-time Supabase Fetch & Subscriptions (If configured)
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const loadData = async () => {
      try {
        // Load active devices
        const { data: dbDevices, error: devErr } = await supabase.from('devices').select('*')
        if (!devErr && dbDevices && dbDevices.length > 0) {
          setDevices(dbDevices)
        }

        // Load alerts
        const { data: dbAlerts, error: alertErr } = await supabase.from('alerts').select('*').order('created_at', { ascending: false })
        if (!alertErr && dbAlerts) {
          setAlerts(dbAlerts)
        }

        // Load users
        const { data: dbUsers, error: userErr } = await supabase.from('users').select('*')
        if (!userErr && dbUsers) {
          setUsers(dbUsers)
        }
      } catch (err) {
        console.error('Error fetching Supabase data:', err)
      }
    }

    loadData()

    // Subscribe to realtime database changes
    const deviceSub = supabase
      .channel('realtime_devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDevices(prev => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setDevices(prev => prev.map(d => d.id === payload.new.id ? { ...d, ...payload.new } : d))
        } else if (payload.eventType === 'DELETE') {
          setDevices(prev => prev.filter(d => d.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(deviceSub)
    }
  }, [])

  // MQTT Connection setup
  useEffect(() => {
    mqttService.connect((status, isMock, errMessage) => {
      setMqttStatus(status)
      if (errMessage) setMqttErr(errMessage)
      else setMqttErr('')
    })

    // Listen for incoming hardware telemetry topics
    mqttService.subscribe('devices/+/telemetry', (payload, topic) => {
      const parts = topic.split('/')
      const devId = parts[1]
      
      setDevices(prev => prev.map(d => {
        if (d.id === devId) {
          // Parse values
          const updatedTelemetry = {
            voltage: Number(payload.v ?? d.telemetry.voltage),
            frequency: Number(payload.hz ?? d.telemetry.frequency),
            current: Number(payload.a ?? d.telemetry.current),
            energy: Number(payload.kwh ?? d.telemetry.energy),
            powerFactor: Number(payload.pf ?? d.telemetry.powerFactor),
            powerLoad: Number(payload.w ?? d.telemetry.powerLoad),
            temperature: Number(payload.t ?? d.telemetry.temperature),
            doorStatus: payload.door ?? d.telemetry.doorStatus
          }

          return {
            ...d,
            status: updatedTelemetry.current > 0.05 ? 'ACTIVE' : 'INACTIVE',
            power: updatedTelemetry.current > 0.05 ? 'ON' : 'OFF',
            connectionStatus: 'Connected',
            lastSeen: 'Just now',
            deviceTime: new Date().toLocaleTimeString(),
            telemetry: updatedTelemetry
          }
        }
        return d
      }))
    })

    return () => {
      mqttService.disconnect()
    }
  }, [])

  // MOCK TELEMETRY UPDATES: Simulates telemetry fluctuations in browser (runs if not using hardware or during testing)
  useEffect(() => {
    const timer = setInterval(() => {
      setDevices(prev => prev.map(d => {
        // Disconnected devices don't update live
        if (d.connectionStatus === 'Disconnected') return d

        // Toggle state math
        const isCurrentlyOn = d.power === 'ON'
        const currentTarget = isCurrentlyOn ? 4.25 + (Math.random() - 0.5) * 0.1 : 0.00
        const pfTarget = isCurrentlyOn ? 0.98 + (Math.random() - 0.5) * 0.02 : 0.00
        const loadTarget = isCurrentlyOn ? Number((d.telemetry.voltage * currentTarget * pfTarget).toFixed(1)) : 0.0

        // Voltage fluctuates around 240-270
        const vNoise = (Math.random() - 0.5) * 1.5
        const vBase = isCurrentlyOn ? 242.0 : 269.0
        const updatedVoltage = Number((vBase + vNoise).toFixed(1))

        // Frequency fluctuates around 50Hz
        const updatedFrequency = Number((50.0 + (Math.random() - 0.5) * 0.08).toFixed(2))

        // Temperature rises when lights turn on, cools when off
        let updatedTemp = d.telemetry.temperature
        if (isCurrentlyOn) {
          updatedTemp = Number(Math.min(65.0, updatedTemp + 0.15 + (Math.random() * 0.05)).toFixed(1))
        } else {
          updatedTemp = Number(Math.max(28.0, updatedTemp - 0.2 - (Math.random() * 0.05)).toFixed(1))
        }

        // Accrue small amounts of energy when ON
        let updatedEnergy = d.telemetry.energy
        if (isCurrentlyOn) {
          updatedEnergy = Number((updatedEnergy + 0.002).toFixed(4))
        }

        // Random door tamper simulator (very rare: 0.1% chance)
        let door = d.telemetry.doorStatus
        if (Math.random() < 0.001) {
          door = door === 'CLOSED' ? 'OPEN' : 'CLOSED'
          // Trigger alert
          if (door === 'OPEN') {
            triggerAlert(d.id, 'Door Tamper Alert', 'Warning')
          }
        }

        // Automatic Over-temperature alert check
        if (updatedTemp > 60.0) {
          triggerAlert(d.id, `Over Temperature Alert (${updatedTemp}°C)`, 'Critical')
        }

        return {
          ...d,
          deviceTime: new Date().toLocaleTimeString(),
          telemetry: {
            voltage: updatedVoltage,
            frequency: updatedFrequency,
            current: Number(currentTarget.toFixed(2)),
            energy: updatedEnergy,
            powerFactor: Number(Math.min(1.0, Math.max(0.0, pfTarget)).toFixed(2)),
            powerLoad: loadTarget,
            temperature: updatedTemp,
            doorStatus: door
          }
        }
      }))
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  // Log a new system/user activity event
  const addLog = (type, triggeredBy, details, deviceId = null) => {
    const newLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      triggeredBy,
      details,
      deviceId
    }
    setLogs(prev => [newLog, ...prev].slice(0, 100)) // Cap logs at 100 items

    // If Supabase is active, log to database
    if (isSupabaseConfigured) {
      supabase.from('audit_logs').insert([{
        action: type,
        target_device: deviceId,
        reason: details,
        user_id: triggeredBy
      }]).then(({ error }) => {
        if (error) console.error('Supabase logging error:', error)
      })
    }
  }

  // Trigger safety alarm notifications
  const triggerAlert = (deviceId, type, severity) => {
    const activeAlertExists = alerts.some(a => a.deviceId === deviceId && a.type === type && a.status === 'New')
    if (activeAlertExists) return

    const newAlert = {
      id: `A-${Math.floor(100 + Math.random() * 900)}`,
      deviceId,
      type,
      severity,
      status: 'New',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    }

    setAlerts(prev => [newAlert, ...prev])
    addLog('System Alarm', 'Engine', `Alert generated: ${type} on device ${deviceId}`, deviceId)

    // Save to Supabase
    if (isSupabaseConfigured) {
      supabase.from('alerts').insert([newAlert]).then(({ error }) => {
        if (error) console.error('Supabase alert insertion error:', error)
      })
    }
  }

  // Acknowledge or Resolve alerts
  const updateAlertStatus = (alertId, newStatus) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus } : a))
    
    const targetAlert = alerts.find(a => a.id === alertId)
    if (targetAlert) {
      addLog(`Alert ${newStatus}`, 'admin', `Alert ${targetAlert.type} marked as ${newStatus}`, targetAlert.deviceId)
    }

    if (isSupabaseConfigured) {
      supabase.from('alerts').update({ status: newStatus }).eq('id', alertId).then(({ error }) => {
        if (error) console.error('Supabase update alert status error:', error)
      })
    }
  }

  // Dispatch Remote Power Control Commands (Dashboard -> AWS MQTT / Local Sim)
  const executePowerControl = (deviceId, targetPowerState, authPassword, auditReason) => {
    // Password Security Check
    if (authPassword !== 'admin123') {
      return { success: false, error: 'Invalid token' }
    }

    const targetStatus = targetPowerState === 'ON' ? 'ACTIVE' : 'INACTIVE'
    
    // Update local state
    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return {
          ...d,
          power: targetPowerState,
          status: targetStatus,
          lastSeen: 'Just now'
        }
      }
      return d
    }))

    // Add activity to log
    addLog('Control Command', 'admin', `Remote power set to ${targetPowerState}. Reason: ${auditReason}`, deviceId)

    // Publish to AWS Broker
    mqttService.publish(`devices/${deviceId}/command`, {
      power: targetPowerState,
      triggeredBy: 'admin',
      reason: auditReason
    })

    return { success: true }
  }

  // Update schedule configuration
  const updateDeviceSchedule = (deviceId, newOnTime, newOffTime) => {
    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return {
          ...d,
          schedule: {
            ...d.schedule,
            turnOn: newOnTime,
            turnOff: newOffTime
          }
        }
      }
      return d
    }))
    addLog('Schedule Edit', 'admin', `Updated operational hours (ON: ${newOnTime}, OFF: ${newOffTime})`, deviceId)
  }

  // Add User functionality
  const addUser = (userData) => {
    const prefix = userData.role === 'Admin' ? 'KGPA' : userData.role === 'Vendor' ? 'KGPV' : 'KGPE'
    const newId = `${prefix}${Math.floor(10000 + Math.random() * 90000)}`
    
    const newUser = {
      id: newId,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      status: 'Active',
      created: new Date().toLocaleDateString()
    }

    setUsers(prev => [newUser, ...prev])
    addLog('User Provision', 'admin', `Registered new ${userData.role} user: ${userData.name}`)

    if (isSupabaseConfigured) {
      supabase.from('users').insert([newUser]).then(({ error }) => {
        if (error) console.error('Supabase user creation error:', error)
      })
    }
  }

  // Delete User
  const deleteUser = (userId) => {
    const userToDelete = users.find(u => u.id === userId)
    setUsers(prev => prev.filter(u => u.id !== userId))
    
    if (userToDelete) {
      addLog('User De-provision', 'admin', `Removed user profile: ${userToDelete.name}`)
    }

    if (isSupabaseConfigured) {
      supabase.from('users').delete().eq('id', userId).then(({ error }) => {
        if (error) console.error('Supabase user delete error:', error)
      })
    }
  }

  // Add Vendor
  const addVendor = (vendorData) => {
    const newId = `V-${Math.floor(100 + Math.random() * 900)}`
    const newVendor = {
      id: newId,
      ...vendorData,
      devices: 0,
      created: new Date().toISOString().split('T')[0]
    }
    setVendors(prev => [newVendor, ...prev])
    addLog('Vendor Registration', 'admin', `Registered new vendor: ${vendorData.name}`)
  }

  // Update Vendor
  const updateVendor = (vendorId, vendorData) => {
    setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, ...vendorData } : v))
    addLog('Vendor Update', 'admin', `Updated vendor profile: ${vendorData.name || 'Vendor'}`)
  }

  // Delete Vendor
  const deleteVendor = (vendorId) => {
    const vendorToDelete = vendors.find(v => v.id === vendorId)
    setVendors(prev => prev.filter(v => v.id !== vendorId))
    if (vendorToDelete) {
      addLog('Vendor Removal', 'admin', `Removed vendor profile: ${vendorToDelete.name}`)
    }
  }

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || devices[0]

  return (
    <AppContext.Provider value={{
      theme,
      setTheme,
      activeTab,
      setActiveTab,
      devices,
      setDevices,
      selectedDeviceId,
      setSelectedDeviceId,
      selectedDevice,
      users,
      addUser,
      deleteUser,
      vendors,
      addVendor,
      updateVendor,
      deleteVendor,
      alerts,
      setAlerts,
      updateAlertStatus,
      triggerAlert,
      logs,
      addLog,
      mqttStatus,
      mqttErr,
      executePowerControl,
      updateDeviceSchedule,
      sidebarCollapsed,
      setSidebarCollapsed
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
