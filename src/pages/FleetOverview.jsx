import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { devicesApi } from '../services/api'
import { 
  Activity, 
  Lightbulb, 
  AlertTriangle, 
  BatteryCharging, 
  Compass, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Signal,
  Plus,
  Power,
  Copy,
  Check,
  X,
  Code
} from 'lucide-react'
import { useToast } from '../components/Toast'

export default function FleetOverview() {
  const { devices, setDevices, alerts, setActiveTab, setSelectedDeviceId, loading, deviceError, executePowerControl, refreshDevices } = useApp()
  const { user } = useAuth()
  const toast = useToast()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addStep, setAddStep] = useState(1) // 1 = Form, 2 = Success
  const [newDevice, setNewDevice] = useState({ id: '', type: 'Street Light', location: '', firmware: '1.0.0', description: '' })
  const [generatedCreds, setGeneratedCreds] = useState({ apiKey: '', secret: '' })
  const [activeCodeTab, setActiveCodeTab] = useState('arduino')
  const [copied, setCopied] = useState(false)

  const totalCount = devices.length
  const activeCount = devices.filter(d => d.power === 'ON' && d.connectionStatus === 'Connected').length
  const offlineCount = devices.filter(d => d.connectionStatus === 'Disconnected').length
  const warningCount = alerts.filter(a => a.status === 'New').length

  const handleDeviceClick = (devId) => {
    setSelectedDeviceId(devId)
    setActiveTab('device-details')
  }

  const handleTogglePower = (device) => {
    const targetState = device.power === 'ON' ? 'OFF' : 'ON'
    const res = executePowerControl(device.id, targetState, 'admin123', 'Dashboard quick toggle')
    if (res.success) {
      toast.success(`${device.name} turned ${targetState}`)
    } else {
      toast.error('Failed to control device')
    }
  }

  const handleAddDevice = async (e) => {
    e.preventDefault()
    
    const apiKey = `iot_live_${Math.random().toString(36).substr(2, 10)}${Math.random().toString(36).substr(2, 10)}`
    const secret = `sec_${Math.random().toString(36).substr(2, 16)}`
    setGeneratedCreds({ apiKey, secret })

    const finalId = newDevice.id || `DEV-${Math.floor(1000 + Math.random() * 9000)}`
    
    const deviceObj = {
      id: finalId,
      name: finalId,
      location: newDevice.location,
      type: newDevice.type,
      firmware: newDevice.firmware,
      description: newDevice.description,
      approval_status: user?.role === 'Vendor' ? 'pending' : 'approved',
      vendor_id: user?.role === 'Vendor' ? user?.vendorId || user?.id : null
    }
    
    try {
      await devicesApi.create(deviceObj)
      if (refreshDevices) refreshDevices()
      setAddStep(2)
    } catch (err) {
      toast.error('Failed to create device')
    }
  }

  const handleCloseModal = () => {
    setIsAddModalOpen(false)
    setAddStep(1)
    setNewDevice({ id: '', type: 'Street Light', location: '', firmware: '1.0.0', description: '' })
    setCopied(false)
  }

  const copyCode = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard')
  }

  // Compute total energy consumption
  const totalEnergy = devices.reduce((sum, d) => sum + (d.telemetry?.energy || d.latest_telemetry?.energy_kwh || 0), 0).toFixed(1)

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"></div>
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"></div>
      </div>
    );
  }

  if (deviceError) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Devices</h2>
        <p>{deviceError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 4 Summary Dashboard Widget Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Widget 1: Total Devices */}
        <div className="glass-card bg-white dark:bg-slate-900 p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Fleet</span>
            <h3 className="font-outfit font-black text-3xl text-slate-850 dark:text-white">{totalCount}</h3>
            <p className="text-[10px] font-semibold text-slate-400">Registered devices</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
            <Lightbulb size={24} className="fill-current" />
          </div>
        </div>

        {/* Widget 2: Active Devices */}
        <div className="glass-card bg-white dark:bg-slate-900 p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active ON</span>
            <h3 className="font-outfit font-black text-3xl text-emerald-500">{activeCount}</h3>
            <p className="text-[10px] font-semibold text-emerald-500/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Operational now
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <Activity size={24} />
          </div>
        </div>

        {/* Widget 3: Offline Devices */}
        <div className="glass-card bg-white dark:bg-slate-900 p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Offline</span>
            <h3 className="font-outfit font-black text-3xl text-slate-400 dark:text-slate-400">{offlineCount}</h3>
            <p className="text-[10px] font-semibold text-slate-400">Connection lost</p>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl">
            <Compass size={24} />
          </div>
        </div>

        {/* Widget 4: Alerts */}
        <div className="glass-card bg-white dark:bg-slate-900 p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Alarms</span>
            <h3 className="font-outfit font-black text-3xl text-red-500">{warningCount}</h3>
            <p className="text-[10px] font-semibold text-red-500/80">Require attention</p>
          </div>
          <div className={`p-3 rounded-2xl
            ${warningCount > 0 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
          >
            <AlertTriangle size={24} />
          </div>
        </div>

      </div>

      {/* Main Row: Devices Status List */}
      <div className="glass-card bg-white dark:bg-slate-900 overflow-hidden border-slate-200 dark:border-slate-800 shadow-md">
        <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
          <div>
            <h3 className="font-outfit font-bold text-base text-slate-900 dark:text-white">Device Fleet Registry</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time listing of active smart street lights</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-extrabold rounded-full uppercase tracking-wider hidden sm:inline-block">
              Telemetry Live
            </span>
            {user?.role !== 'Worker' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/10"
              >
                <Plus size={14} strokeWidth={3} />
                <span>Add Device</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Device Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Operational Mode</th>
                <th className="p-4">Voltage</th>
                <th className="p-4">Temperature</th>
                <th className="p-4">Network</th>
                <th className="p-4 pr-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
              {devices.map((device) => {
                const isOnline = device.connectionStatus === 'Connected'
                return (
                  <tr key={device.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 font-medium">
                    
                    {/* Device Identifier */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 border
                          ${!isOnline 
                            ? 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-400' 
                            : device.power === 'ON' 
                              ? 'bg-blue-600/10 border-blue-500/30 text-blue-500' 
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}
                        >
                          <Lightbulb size={16} />
                        </div>
                        <div className="flex flex-col">
                          <button 
                            onClick={() => handleDeviceClick(device.id)}
                            className="font-bold text-slate-900 dark:text-white leading-tight text-left hover:text-blue-500 transition-colors"
                          >
                            {device.name}
                          </button>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold mt-0.5 tracking-wider">
                            ID: {device.id.substring(0, 15)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin size={12} className="text-slate-400" />
                        <span>{device.location}</span>
                      </div>
                    </td>

                    {/* Operational Power State */}
                    <td className="p-4">
                      {user?.role !== 'Worker' ? (
                        <button 
                          onClick={() => handleTogglePower(device)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase transition-all shadow-sm
                          ${device.power === 'ON' 
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                          title="Toggle Power"
                        >
                          <Power size={12} />
                          {device.power}
                        </button>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase
                          ${device.power === 'ON' 
                            ? 'bg-emerald-500/20 text-emerald-500' 
                            : 'bg-slate-800 text-slate-400'}`}
                        >
                          {device.power}
                        </span>
                      )}
                    </td>

                    {/* Voltage Telemetry */}
                    <td className="p-4 font-mono text-xs">
                      {isOnline ? `${(device.telemetry?.voltage ?? device.latest_telemetry?.voltage ?? 0).toFixed(1)} V` : '—'}
                    </td>

                    {/* Temperature Telemetry */}
                    <td className="p-4 font-mono text-xs">
                      <span className={(device.telemetry?.temperature ?? device.latest_telemetry?.temperature_c ?? 0) > 60.0 ? 'text-red-500 font-bold' : ''}>
                        {(device.telemetry?.temperature ?? device.latest_telemetry?.temperature_c ?? 0).toFixed(1)} °C
                      </span>
                    </td>

                    {/* Network connectivity */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {isOnline ? `Online (${device.signalLevel})` : 'Offline'}
                        </span>
                      </div>
                    </td>

                    {/* Navigation Link to Details */}
                    <td className="p-4 pr-6 text-center">
                      <button
                        onClick={() => handleDeviceClick(device.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-850 rounded-xl text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                      >
                        <span>Details</span>
                        <ArrowRight size={12} />
                      </button>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Device Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                  {addStep === 1 ? <Plus size={20} /> : <Check size={20} className="text-emerald-500" />}
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {addStep === 1 ? 'Add New Device' : 'Device Added Successfully!'}
                </h3>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 custom-scrollbar">
              {addStep === 1 ? (
                <form id="add-device-form" onSubmit={handleAddDevice} className="space-y-5">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs rounded-xl flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">ℹ️</span>
                    <p>
                      Fill in the device details below. An API key will be generated for device authentication.
                      {user?.role === 'Vendor' && " Note: Your devices will require Admin approval before going live."}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Device ID *</label>
                    <input required type="text" value={newDevice.id} onChange={e => setNewDevice({...newDevice, id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-800 dark:text-slate-200" placeholder="Unique identifier (e.g., light_001)" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Device Type *</label>
                    <select required value={newDevice.type} onChange={e => setNewDevice({...newDevice, type: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-800 dark:text-slate-200 appearance-none">
                      <option value="Street Light">Street Light</option>
                      <option value="Smart Meter">Smart Meter</option>
                      <option value="Environmental Sensor">Environmental Sensor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Location *</label>
                    <input required type="text" value={newDevice.location} onChange={e => setNewDevice({...newDevice, location: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-800 dark:text-slate-200" placeholder="Physical location or zone" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Firmware Version</label>
                    <input type="text" value={newDevice.firmware} onChange={e => setNewDevice({...newDevice, firmware: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-800 dark:text-slate-200" placeholder="1.0.0" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                    <textarea value={newDevice.description} onChange={e => setNewDevice({...newDevice, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium text-slate-800 dark:text-slate-200 min-h-[80px]" placeholder="Additional notes..." />
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Credentials Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">API Key</label>
                      <p className="text-[10px] text-slate-500 mb-2">Save this key securely. You'll need it to authenticate your device.</p>
                      <div className="flex items-center gap-2">
                        <input readOnly type="text" value={generatedCreds.apiKey} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-blue-500/30 rounded-xl focus:outline-none text-sm font-mono text-slate-800 dark:text-slate-200" />
                        <button onClick={() => copyCode(generatedCreds.apiKey)} className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors">
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">Device Secret</label>
                      <p className="text-[10px] text-slate-500 mb-2">Additional authentication credential for enhanced security.</p>
                      <div className="flex items-center gap-2">
                        <input readOnly type="text" value={generatedCreds.secret} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-sm font-mono text-slate-800 dark:text-slate-200 opacity-80" />
                        <button onClick={() => copyCode(generatedCreds.secret)} className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors">
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Integration Code Section */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Integration Code</h4>
                      <button onClick={() => copyCode(`// Generated Arduino Code for ${newDevice.id}...`)} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                        <Copy size={12} /> Copy Code
                      </button>
                    </div>

                    <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 mb-4 text-xs font-semibold">
                      <button onClick={() => setActiveCodeTab('arduino')} className={`pb-2 border-b-2 transition-colors ${activeCodeTab === 'arduino' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Street Light (Full Arduino)</button>
                      <button onClick={() => setActiveCodeTab('python')} className={`pb-2 border-b-2 transition-colors ${activeCodeTab === 'python' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Python / Raspberry Pi</button>
                      <button onClick={() => setActiveCodeTab('simple')} className={`pb-2 border-b-2 transition-colors ${activeCodeTab === 'simple' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Simple Arduino Template</button>
                    </div>

                    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                      <div className="p-4 text-[11px] font-mono text-emerald-400 whitespace-pre-wrap overflow-x-auto">
                        {activeCodeTab === 'arduino' && (
`#define TINY_GSM_MODEM_SIM7600
#include <TinyGsmClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* API_KEY = "${generatedCreds.apiKey}";
const char* SECRET = "${generatedCreds.secret}";
const char* DEVICE_ID = "${newDevice.id || 'DEV-XYZ'}";

// Setup MQTT Client...
void setup() {
  Serial.begin(115200);
  // Initialize Sensors
}

void loop() {
  // Read Telemetry
  // Publish to topic: devices/${newDevice.id}/telemetry
}`
                        )}
                        {activeCodeTab === 'python' && (
`import paho.mqtt.client as mqtt
import json
import time

API_KEY = "${generatedCreds.apiKey}"
SECRET = "${generatedCreds.secret}"
DEVICE_ID = "${newDevice.id || 'DEV-XYZ'}"

def on_connect(client, userdata, flags, rc):
    print("Connected to IoT Core")

client = mqtt.Client(client_id=DEVICE_ID)
client.username_pw_set(API_KEY, SECRET)
client.connect("mqtt.kgpinnovation.com", 8883, 60)

client.loop_start()
while True:
    payload = {"v": 230.5, "a": 4.2}
    client.publish(f"devices/{DEVICE_ID}/telemetry", json.dumps(payload))
    time.sleep(5)
`
                        )}
                        {activeCodeTab === 'simple' && (
`// Minimal ESP32 Template
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PWD";

const char* mqtt_server = "mqtt.kgpinnovation.com";
const char* api_key = "${generatedCreds.apiKey}";
const char* api_secret = "${generatedCreds.secret}";

void setup() {
  // Connect WiFi & MQTT
}

void loop() {
  // Main logic
}
`
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 flex gap-3 justify-end shrink-0">
              {addStep === 1 ? (
                <>
                  <button type="button" onClick={handleCloseModal} className="px-5 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                  <button form="add-device-form" type="submit" className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-500/20">Generate API Key & Add Device</button>
                </>
              ) : (
                <button onClick={handleCloseModal} className="px-5 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors">Close Dashboard</button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
