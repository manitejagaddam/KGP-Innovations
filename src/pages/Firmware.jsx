import React, { useState, useEffect } from 'react';
import { firmwareApi, pendingDevicesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Cpu, Upload, Code, Check, X, Play } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Firmware() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [firmwares, setFirmwares] = useState([]);
  const [pendingDevices, setPendingDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', version: '', platform: 'Arduino', description: '', source_code: '' });
  const [pushData, setPushData] = useState({ firmwareId: null, deviceId: '' });

  const isAdmin = user?.role === 'Admin';

  const arduinoTemplate = `#include <Arduino.h>\n\nconst char* API_KEY = "{API_KEY}";\nconst char* DEVICE_ID = "{DEVICE_ID}";\nconst char* MQTT_BROKER = "{MQTT_BROKER}";\n\nvoid setup() {\n  Serial.begin(115200);\n  // Initialize your sensors here\n}\n\nvoid loop() {\n  // Send telemetry: {"v":voltage,"a":current,"t":temperature}\n  delay(3000);\n}`;
  const esp32Template = `#include <WiFi.h>\n#include <PubSubClient.h>\n\nconst char* WIFI_SSID = "{WIFI_SSID}";\nconst char* WIFI_PASS = "{WIFI_PASS}";\nconst char* MQTT_HOST = "{MQTT_BROKER}";\nconst char* API_KEY = "{API_KEY}";\nconst char* DEVICE_ID = "{DEVICE_ID}";\n\nvoid setup() {\n  WiFi.begin(WIFI_SSID, WIFI_PASS);\n  // Connect to MQTT broker\n  // Subscribe to: devices/{DEVICE_ID}/command\n  // Publish to: devices/{DEVICE_ID}/telemetry\n}\n\nvoid loop() {\n  // Read sensors and publish JSON telemetry\n  delay(3000);\n}`;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const fwRes = await firmwareApi.list();
      setFirmwares(Array.isArray(fwRes) ? fwRes : fwRes.data || []);
      
      if (isAdmin) {
        const pdRes = await pendingDevicesApi.list();
        setPendingDevices(Array.isArray(pdRes) ? pdRes : pdRes.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load firmware data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformChange = (e) => {
    const platform = e.target.value;
    setFormData({ 
      ...formData, 
      platform,
      source_code: platform === 'ESP32' ? esp32Template : arduinoTemplate
    });
  };

  const handleSaveFirmware = async (e) => {
    e.preventDefault();
    try {
      await firmwareApi.create(formData);
      toast.success('Firmware created successfully');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to create firmware');
    }
  };

  const handlePushOTA = async (e) => {
    e.preventDefault();
    try {
      // Assuming a push OTA endpoint exists
      await firmwareApi.push(pushData.firmwareId, pushData.deviceId);
      toast.success('OTA Push Initiated');
      setIsPushModalOpen(false);
    } catch (err) {
      toast.error('Failed to push OTA');
    }
  };

  const handleApprove = async (id) => {
    try {
      await pendingDevicesApi.approve(id);
      toast.success('Device approved');
      loadData();
    } catch (err) {
      toast.error('Failed to approve device');
    }
  };

  const handleReject = async (id) => {
    try {
      await pendingDevicesApi.reject(id);
      toast.success('Device rejected');
      loadData();
    } catch (err) {
      toast.error('Failed to reject device');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="text-blue-500" /> Firmware Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage device firmware versions and OTA updates</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setFormData({ name: '', version: '', platform: 'Arduino', description: '', source_code: arduinoTemplate }); setIsModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium">
            <Upload size={18} /> New Firmware
          </button>
        )}
      </div>

      <div className="glass-card bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/50 text-slate-400">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Version</th>
              <th className="p-4">Platform</th>
              <th className="p-4">Description</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {firmwares.map(fw => (
              <tr key={fw.id} className="hover:bg-slate-700/20 text-slate-300">
                <td className="p-4 font-medium">{fw.name}</td>
                <td className="p-4"><span className="px-2 py-1 bg-slate-700 rounded text-xs">{fw.version}</span></td>
                <td className="p-4">{fw.platform}</td>
                <td className="p-4 text-slate-400">{fw.description}</td>
                <td className="p-4 flex gap-2">
                  {isAdmin && (
                    <button onClick={() => { setPushData({ firmwareId: fw.id, deviceId: '' }); setIsPushModalOpen(true); }} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="Push OTA">
                      <Play size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {firmwares.length === 0 && !loading && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">No firmware versions available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && pendingDevices.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
            Pending Device Approvals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingDevices.map(pd => (
              <div key={pd.id} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                <h4 className="font-bold text-slate-200">{pd.name || pd.id}</h4>
                <p className="text-xs text-slate-400 mt-1">Vendor: {pd.vendor_id}</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleApprove(pd.id)} className="flex-1 flex items-center justify-center gap-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 py-1.5 rounded-lg text-sm transition-colors">
                    <Check size={16} /> Approve
                  </button>
                  <button onClick={() => handleReject(pd.id)} className="flex-1 flex items-center justify-center gap-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 py-1.5 rounded-lg text-sm transition-colors">
                    <X size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveFirmware} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Code size={20} /> Create Firmware</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Version</label>
                  <input required value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Platform</label>
                <select value={formData.platform} onChange={handlePlatformChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500">
                  <option value="Arduino">Arduino</option>
                  <option value="ESP32">ESP32</option>
                  <option value="ESP8266">ESP8266</option>
                  <option value="Raspberry Pi">Raspberry Pi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 min-h-[60px]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Source Code Template</label>
                <textarea value={formData.source_code} onChange={e => setFormData({...formData, source_code: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-green-400 font-mono text-xs focus:outline-none focus:border-blue-500 min-h-[200px]" />
              </div>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">Save Firmware</button>
            </div>
          </form>
        </div>
      )}

      {isPushModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handlePushOTA} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Play size={20} /> Push OTA Update</h3>
              <button type="button" onClick={() => setIsPushModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Target Device ID</label>
              <input required value={pushData.deviceId} onChange={e => setPushData({...pushData, deviceId: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. DEV-1234" />
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
              <button type="button" onClick={() => setIsPushModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">Push Update</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
