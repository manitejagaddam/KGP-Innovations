import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { devicesApi } from '../services/api'
import { getTypeInfo, getAllTypes } from '../config/deviceTypes'
import { useToast } from '../components/Toast'

export default function FleetOverview() {
  const { devices, setDevices, alerts, setActiveTab, setSelectedDeviceId, loading, deviceError, refreshDevices } = useApp()
  const { user } = useAuth()
  const toast = useToast()

  // ─── Filter State ───────────────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState('')      // device type key
  const [statusFilter, setStatusFilter] = useState('')  // 'online' | 'offline'
  const [connFilter, setConnFilter] = useState('')      // 'WiFi' | 'LTE'
  const [alertFilter, setAlertFilter] = useState('')    // 'alert'
  const [locationFilter, setLocationFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // ─── Add Device Modal ───────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newDevice, setNewDevice] = useState({
    name: '', type: 'street_light', location: '',
    vendor_id: '', connectivity: 'WiFi', mqtt_topic: ''
  })

  // ─── Stats ──────────────────────────────────────────────────────
  const totalCount = devices.length
  const onlineCount = devices.filter(d => (d.connection_status || '').toLowerCase() === 'connected' || (d.status || '').toLowerCase() === 'online').length
  const offlineCount = totalCount - onlineCount
  const activeAlertCount = alerts?.filter(a => a.status === 'New').length || 0

  // ─── Unique locations for filter ────────────────────────────────
  const locations = useMemo(() => {
    const locs = [...new Set(devices.map(d => d.location).filter(Boolean))]
    return locs.sort()
  }, [devices])

  // ─── Device type counts ─────────────────────────────────────────
  const typeCounts = useMemo(() => {
    const counts = {}
    devices.forEach(d => {
      const t = d.device_type || d.type || 'street_light'
      counts[t] = (counts[t] || 0) + 1
    })
    return counts
  }, [devices])

  // ─── Filtered devices ────────────────────────────────────────────
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      const devType = d.device_type || d.type || 'street_light'
      const isOnline = (d.connection_status || '').toLowerCase() === 'connected' || (d.status || '').toLowerCase() === 'online'
      const conn = d.connectivity || d.connection_type || ''
      const hasAlert = alerts?.some(a => a.device_id === d.id && a.status === 'New')

      if (typeFilter && devType !== typeFilter) return false
      if (statusFilter === 'online' && !isOnline) return false
      if (statusFilter === 'offline' && isOnline) return false
      if (connFilter && conn !== connFilter) return false
      if (alertFilter === 'alert' && !hasAlert) return false
      if (locationFilter && d.location !== locationFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!d.name?.toLowerCase().includes(q) && !d.location?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [devices, alerts, typeFilter, statusFilter, connFilter, alertFilter, locationFilter, searchQuery])

  // ─── Handlers ───────────────────────────────────────────────────
  const handleDeviceClick = (devId) => {
    setSelectedDeviceId(devId)
    setActiveTab('device-details')
  }

  const handleAddDevice = async (e) => {
    e.preventDefault()
    try {
      const deviceObj = {
        name: newDevice.name,
        device_type: newDevice.type,
        type: newDevice.type,
        location: newDevice.location,
        connectivity: newDevice.connectivity,
        mqtt_topic: newDevice.mqtt_topic,
        vendor_id: user?.role?.toLowerCase() === 'vendor' ? user?.vendorId : (newDevice.vendor_id || null),
        approval_status: user?.role?.toLowerCase() === 'vendor' ? 'pending' : 'approved',
      }
      await devicesApi.create(deviceObj)
      toast.success(`Device "${newDevice.name}" added successfully`)
      if (refreshDevices) refreshDevices()
      setIsAddModalOpen(false)
      setNewDevice({ name: '', type: 'street_light', location: '', vendor_id: '', connectivity: 'WiFi', mqtt_topic: '' })
    } catch (err) {
      toast.error('Failed to create device: ' + (err.message || 'Unknown error'))
    }
  }

  const canAddDevice = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'vendor'

  // ─── Get all device types that appear in fleet ───────────────────
  const usedTypes = getAllTypes().filter(t => typeCounts[t.key] > 0)

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-44 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Devices" value={totalCount} delta="All registered" icon="🧩" color="#4F6EF7" bg="#EEF1FE" />
        <StatCard label="Online" value={onlineCount} delta={`${totalCount > 0 ? Math.round(onlineCount/totalCount*100) : 0}% uptime`} icon="✅" color="#0FA968" bg="#E7F8F0" />
        <StatCard label="Offline" value={offlineCount} delta="Connection lost" icon="📴" color="#9CA3AF" bg="#F3F4F6" />
        <StatCard label="Active Alerts" value={activeAlertCount} delta="Need attention" icon="⚠️" color={activeAlertCount > 0 ? '#E4483C' : '#9CA3AF'} bg={activeAlertCount > 0 ? '#FDECEB' : '#F3F4F6'} />
      </div>

      {/* ── Section Head ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Device Types</h2>
          <p className="text-xs text-gray-400 mt-0.5">Tap a type to filter the fleet below</p>
        </div>
        {canAddDevice && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            + Add Device
          </button>
        )}
      </div>

      {/* ── Device Type Chips ── */}
      {usedTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all
              ${!typeFilter ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}
          >
            All <span className="opacity-70">{totalCount}</span>
          </button>
          {usedTypes.map(t => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(typeFilter === t.key ? '' : t.key)}
              style={typeFilter === t.key ? { background: t.color, borderColor: t.color, color: '#fff' } : { borderColor: '#E7E9F0' }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all bg-white text-gray-600`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              <span style={{ opacity: 0.7 }}>{typeCounts[t.key]}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Filters Bar ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search devices or locations..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-800 outline-none focus:border-blue-400 min-w-[200px]"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 outline-none">
          <option value="">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <select value={connFilter} onChange={e => setConnFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 outline-none">
          <option value="">WiFi + LTE</option>
          <option value="WiFi">WiFi only</option>
          <option value="LTE">LTE only</option>
        </select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 outline-none">
          <option value="">All Locations</option>
          {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
        <select value={alertFilter} onChange={e => setAlertFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 outline-none">
          <option value="">All Devices</option>
          <option value="alert">Needs Attention</option>
        </select>
        {(typeFilter || statusFilter || connFilter || alertFilter || locationFilter || searchQuery) && (
          <button onClick={() => { setTypeFilter(''); setStatusFilter(''); setConnFilter(''); setAlertFilter(''); setLocationFilter(''); setSearchQuery('') }}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-500 hover:text-red-500 transition-colors">
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Device Card Grid ── */}
      {filteredDevices.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="font-semibold">No devices match your filters</p>
          <p className="text-sm mt-1">Try adjusting or clearing your filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDevices.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              alerts={alerts}
              onClick={() => handleDeviceClick(device.id)}
            />
          ))}
        </div>
      )}

      {/* ── Add Device Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">🧩 Add New Device</h3>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <Field label="Device Type *">
                <select
                  required
                  value={newDevice.type}
                  onChange={e => setNewDevice({ ...newDevice, type: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
                >
                  {getAllTypes().map(t => (
                    <option key={t.key} value={t.key}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Device Name *">
                <input required value={newDevice.name} onChange={e => setNewDevice({ ...newDevice, name: e.target.value })}
                  placeholder="e.g. MAIN-STREET-LIGHT-01" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none" />
              </Field>
              <Field label="Location *">
                <input required value={newDevice.location} onChange={e => setNewDevice({ ...newDevice, location: e.target.value })}
                  placeholder="e.g. Bhimavaram" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Connectivity">
                  <select value={newDevice.connectivity} onChange={e => setNewDevice({ ...newDevice, connectivity: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none">
                    <option value="WiFi">WiFi</option>
                    <option value="LTE">LTE</option>
                  </select>
                </Field>
                <Field label="MQTT Topic">
                  <input value={newDevice.mqtt_topic} onChange={e => setNewDevice({ ...newDevice, mqtt_topic: e.target.value })}
                    placeholder="devices/id/telemetry" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none" />
                </Field>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
                  Add Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────

function StatCard({ label, value, delta, icon, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-400">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
      <div className="text-xs font-semibold mt-1" style={{ color, opacity: 0.75 }}>{delta}</div>
    </div>
  )
}

function DeviceCard({ device, alerts, onClick }) {
  const typeKey = device.device_type || device.type || 'street_light'
  const typeInfo = getTypeInfo(typeKey)
  const isOnline = (device.connection_status || '').toLowerCase() === 'connected' || (device.status || '').toLowerCase() === 'online'
  const isPowered = (device.power || '').toUpperCase() === 'ON' || isOnline
  const hasAlert = alerts?.some(a => a.device_id === device.id && a.status === 'New')

  // Primary metric from telemetry or latest_telemetry
  const telemetry = device.latest_telemetry || device.telemetry || {}
  const primaryKey = typeInfo.primary
  const primaryVal = telemetry[primaryKey] ?? '—'
  const primaryUnit = typeInfo.primaryUnit || ''

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer p-4"
    >
      {/* Top Row */}
      <div className="flex justify-between items-start gap-2 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: typeInfo.bg }}
        >
          {typeInfo.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-900 truncate">{device.name}</div>
          <div className="text-xs text-gray-400 truncate">{device.location || '—'}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPowered ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
            {isPowered ? 'ON' : 'OFF'}
          </span>
          {hasAlert && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Alert</span>
          )}
        </div>
      </div>

      {/* Primary Metric */}
      <div className="text-center my-3 py-2 rounded-lg" style={{ background: typeInfo.bg }}>
        <div className="text-2xl font-black" style={{ color: typeInfo.color }}>
          {typeof primaryVal === 'number' ? Number(primaryVal).toFixed(primaryKey === 'pf' ? 2 : 1) : primaryVal}
          <span className="text-xs font-semibold ml-1 opacity-70">{primaryUnit}</span>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: typeInfo.color, opacity: 0.7 }}>
          {typeInfo.primaryLabel}
        </div>
      </div>

      {/* Mini metrics grid (first 2 metrics) */}
      {typeInfo.metrics && typeInfo.metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {typeInfo.metrics.slice(0, 2).map(m => (
            <div key={m.k} className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
              <div className="text-xs font-bold text-gray-800">
                {m.text ? (telemetry[m.k] ?? '—') : (telemetry[m.k] !== undefined ? Number(telemetry[m.k]).toFixed(m.dec ?? 0) : '—')}{m.text ? '' : ` ${m.u}`}
              </div>
              <div className="text-[9px] text-gray-400 font-semibold">{m.l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
