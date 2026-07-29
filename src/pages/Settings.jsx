import React, { useState, useEffect } from 'react'
import { settingsApi } from '../services/api'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const toast = useToast()
  const { user } = useAuth()
  const isAdmin = (user?.role || '').toLowerCase() === 'admin'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // MQTT config (stored in settings)
  const [mqttUrl, setMqttUrl] = useState('')
  const [mqttUser, setMqttUser] = useState('')
  const [mqttPass, setMqttPass] = useState('')
  const [mqttTopic, setMqttTopic] = useState('devices/+/telemetry')

  // Billing config (stored in settings table)
  const [tariffRate, setTariffRate] = useState(7.5)
  const [fixedCharge, setFixedCharge] = useState(25)

  // Org settings
  const [orgName, setOrgName] = useState('')
  const [orgTimezone, setOrgTimezone] = useState('Asia/Kolkata')
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifySms, setNotifySms] = useState(false)
  const [alertEmailTo, setAlertEmailTo] = useState('')

  // API key
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await settingsApi.get()
      if (data) {
        setOrgName(data.org_name || '')
        setOrgTimezone(data.org_timezone || 'Asia/Kolkata')
        setNotifyEmail(data.notify_email ?? true)
        setNotifySms(data.notify_sms ?? false)
        setAlertEmailTo(data.alert_email_to || '')
        setApiKey(data.api_key || '')
        // Billing config fields — stored in settings table
        setTariffRate(data.tariff_rate ?? 7.5)
        setFixedCharge(data.fixed_charge ?? 25)
        // MQTT config
        setMqttUrl(data.mqtt_url || '')
        setMqttUser(data.mqtt_username || '')
        setMqttTopic(data.mqtt_base_topic || 'devices/+/telemetry')
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
      toast.error('Failed to load settings from server')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveOrg = async () => {
    setSaving(true)
    try {
      await settingsApi.update({
        org_name: orgName,
        org_timezone: orgTimezone,
        notify_email: notifyEmail,
        notify_sms: notifySms,
        alert_email_to: alertEmailTo,
      })
      toast.success('Organization settings saved')
    } catch (err) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBilling = async () => {
    setSaving(true)
    try {
      await settingsApi.update({
        tariff_rate: Number(tariffRate),
        fixed_charge: Number(fixedCharge),
      })
      toast.success('Billing configuration saved')
    } catch (err) {
      toast.error('Failed to save billing configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMqtt = async () => {
    setSaving(true)
    try {
      await settingsApi.update({
        mqtt_url: mqttUrl,
        mqtt_username: mqttUser,
        mqtt_password: mqttPass || undefined,
        mqtt_base_topic: mqttTopic,
      })
      toast.success('MQTT configuration saved')
    } catch (err) {
      toast.error('Failed to save MQTT configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateKey = async () => {
    if (!window.confirm('Are you sure? Existing devices using the old key will lose access.')) return
    setRegenerating(true)
    try {
      const data = await settingsApi.regenerateKey()
      setApiKey(data.api_key)
      toast.success('API Key regenerated successfully')
    } catch (err) {
      toast.error('Failed to regenerate API key')
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900">⚙️ Settings</h2>
        <p className="text-sm text-gray-400 mt-1">MQTT connectivity, billing configuration & organization profile</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── MQTT Broker Connection ── */}
        <Card title="📡 MQTT Broker Connection">
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Connect to your real broker over WebSocket — WiFi and LTE (NB-IoT/Cat-M) devices both publish to the same broker on different topics.
          </p>
          <FormField label="Broker WebSocket URL">
            <input value={mqttUrl} onChange={e => setMqttUrl(e.target.value)}
              placeholder="wss://broker.example.com:8884/mqtt"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Username">
              <input value={mqttUser} onChange={e => setMqttUser(e.target.value)}
                placeholder="optional"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
            </FormField>
            <FormField label="Password">
              <input type="password" value={mqttPass} onChange={e => setMqttPass(e.target.value)}
                placeholder="optional"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
            </FormField>
          </div>
          <FormField label="Base Topic">
            <input value={mqttTopic} onChange={e => setMqttTopic(e.target.value)}
              placeholder="devices/+/telemetry"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
          </FormField>
          {isAdmin && (
            <button onClick={handleSaveMqtt} disabled={saving}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 mt-2">
              Save MQTT Config
            </button>
          )}
        </Card>

        {/* ── Billing Configuration ── */}
        <Card title="🧾 Billing Configuration">
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Applies to devices that meter energy: street lights, smart meters, solar analyzers, and EV chargers.
          </p>
          <FormField label="Tariff Rate (₹ per kWh)">
            <input type="number" step="0.1" min="0" value={tariffRate} onChange={e => setTariffRate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
          </FormField>
          <FormField label="Fixed Monthly Charge per Device (₹)">
            <input type="number" step="1" min="0" value={fixedCharge} onChange={e => setFixedCharge(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
          </FormField>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-semibold mt-1">
            Monthly bill = Energy (kWh) × ₹{tariffRate}/kWh + ₹{fixedCharge} fixed charge per device
          </div>
          {isAdmin && (
            <button onClick={handleSaveBilling} disabled={saving}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 mt-2">
              Save Billing Config
            </button>
          )}
        </Card>

        {/* ── Organization Profile ── */}
        <Card title="🏢 Organization Profile">
          <FormField label="Organization Name">
            <input value={orgName} onChange={e => setOrgName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
          </FormField>
          <FormField label="Timezone">
            <select value={orgTimezone} onChange={e => setOrgTimezone(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-white">
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </FormField>
          <FormField label="Alert Emails To">
            <input value={alertEmailTo} onChange={e => setAlertEmailTo(e.target.value)}
              placeholder="admin@yourorg.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
          </FormField>
          <div className="flex items-center gap-4 py-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={notifyEmail} onChange={e => setNotifyEmail(e.target.checked)}
                className="w-4 h-4 accent-blue-600" />
              Email Alerts
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={notifySms} onChange={e => setNotifySms(e.target.checked)}
                className="w-4 h-4 accent-blue-600" />
              SMS Alerts
            </label>
          </div>
          {isAdmin && (
            <button onClick={handleSaveOrg} disabled={saving}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50">
              Save Profile
            </button>
          )}
        </Card>

        {/* ── API Credentials ── */}
        {isAdmin && (
          <Card title="🔑 API Credentials">
            <p className="text-xs text-gray-500 mb-3">
              This key authenticates your IoT devices when they publish telemetry to the backend.
            </p>
            <FormField label="Device Authorization Key">
              <div className="flex gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  readOnly
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono text-gray-500 bg-gray-50 outline-none"
                />
                <button onClick={() => setShowKey(!showKey)}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </FormField>
            <button onClick={handleRegenerateKey} disabled={regenerating}
              className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-all disabled:opacity-50 mt-2">
              {regenerating ? 'Regenerating...' : '🔄 Regenerate Key'}
            </button>
            <p className="text-[11px] text-gray-400 mt-2">⚠️ Regenerating will break all devices using the old key until reconfigured.</p>
          </Card>
        )}

      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-3">{title}</h3>
      {children}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
