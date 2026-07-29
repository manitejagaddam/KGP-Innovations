import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { firmwareApi } from '../services/api';
import { getTypeInfo } from '../config/deviceTypes';
import { useToast } from '../components/Toast';

export default function Firmware() {
  const { devices } = useApp();
  const { user } = useAuth();
  const toast = useToast();
  
  const [firmwares, setFirmwares] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [pushModalDevice, setPushModalDevice] = useState(null);
  const [codeModalFirmware, setCodeModalFirmware] = useState(null);
  
  // Progress simulation for demo purposes
  const [updatingDevices, setUpdatingDevices] = useState({});

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    loadFirmwares();
  }, []);

  const loadFirmwares = async () => {
    setLoading(true);
    try {
      const fwRes = await firmwareApi.list();
      setFirmwares(Array.isArray(fwRes) ? fwRes : fwRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load firmware data');
    } finally {
      setLoading(false);
    }
  };

  const getLatestFirmware = (device) => {
    // Attempt to match firmware platform to device type or platform
    const eligible = firmwares.filter(fw => 
      fw.platform === device.platform || fw.platform === device.type || fw.platform === 'Arduino' // Fallback
    );
    if (!eligible.length) return null;
    // Assuming version strings can be sorted, or just take the last one
    return eligible[eligible.length - 1];
  };

  const getDeviceStatus = (device) => {
    if (updatingDevices[device.id]) return 'Updating';
    
    const currentVersion = device.firmware_version || device.firmware || 'Unknown';
    const latestFw = getLatestFirmware(device);
    
    if (!latestFw) return 'Up to Date'; // or Unknown
    if (currentVersion === 'Unknown' || currentVersion !== latestFw.version) {
      return 'Update Available';
    }
    return 'Up to Date';
  };

  const handlePushOTA = async (firmwareId, deviceId) => {
    try {
      setPushModalDevice(null);
      // Simulate progress start
      setUpdatingDevices(prev => ({ ...prev, [deviceId]: 10 }));
      
      await firmwareApi.push(firmwareId, deviceId);
      toast.success('OTA Push Initiated');
      
      // Simulate progress
      let progress = 10;
      const interval = setInterval(() => {
        progress += 20;
        if (progress >= 100) {
          clearInterval(interval);
          setUpdatingDevices(prev => {
            const next = { ...prev };
            delete next[deviceId];
            return next;
          });
          toast.success(`Device ${deviceId} updated successfully`);
        } else {
          setUpdatingDevices(prev => ({ ...prev, [deviceId]: progress }));
        }
      }, 1000);
      
    } catch (err) {
      toast.error('Failed to push OTA');
      setUpdatingDevices(prev => {
        const next = { ...prev };
        delete next[deviceId];
        return next;
      });
    }
  };

  const handlePushAll = () => {
    if (!isAdmin) return;
    const eligibleDevices = devices.filter(d => getDeviceStatus(d) === 'Update Available');
    if (eligibleDevices.length === 0) {
      toast.error('No eligible devices for update');
      return;
    }
    eligibleDevices.forEach(d => {
      const latestFw = getLatestFirmware(d);
      if (latestFw) {
        handlePushOTA(latestFw.id, d.id);
      }
    });
    toast.success(`Initiated update for ${eligibleDevices.length} devices`);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const handleDownloadCode = (fw) => {
    const element = document.createElement("a");
    const file = new Blob([fw.source_code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${fw.name || 'firmware'}.ino`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            ⬆️ OTA Firmware Updates
          </h2>
          <p className="text-gray-500 text-sm mt-1">Push firmware remotely to any device type and track rollout</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handlePushAll}
            className="flex items-center gap-2 bg-[#4F6EF7] hover:bg-[#4F6EF7]/90 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
          >
            ⬆️ Push Update to All Eligible
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="p-4">Device</th>
                <th className="p-4">Type</th>
                <th className="p-4">Current Version</th>
                <th className="p-4">Latest Version</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devices.map(device => {
                const currentVersion = device.firmware_version || device.firmware || 'Unknown';
                const latestFw = getLatestFirmware(device);
                const status = getDeviceStatus(device);
                const typeInfo = getTypeInfo(device.type);
                
                return (
                  <tr key={device.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">
                      {device.name || device.id}
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>{typeInfo.icon || '📦'}</span>
                        <span>{typeInfo.label || device.type}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {currentVersion}
                    </td>
                    <td className="p-4 text-gray-600">
                      {latestFw ? latestFw.version : 'N/A'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex w-fit px-2.5 py-1 rounded-full text-xs font-medium
                          ${status === 'Up to Date' ? 'bg-green-100 text-green-700' : ''}
                          ${status === 'Update Available' ? 'bg-amber-100 text-amber-700' : ''}
                          ${status === 'Updating' ? 'bg-blue-100 text-blue-700' : ''}
                          ${status === 'Failed' ? 'bg-red-100 text-red-700' : ''}
                        `}>
                          {status}
                        </span>
                        
                        {status === 'Updating' && (
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 max-w-[120px]">
                            <div 
                              className="bg-[#4F6EF7] h-1.5 rounded-full transition-all duration-500" 
                              style={{ width: `${updatingDevices[device.id]}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {isAdmin && status !== 'Updating' && (
                        <button 
                          onClick={() => setPushModalDevice(device)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#4F6EF7] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          ⬆️ Push
                        </button>
                      )}
                      {status === 'Updating' && (
                        <span className="text-sm text-gray-400 font-medium">Updating...</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {devices.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">No devices found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Firmware Select Modal */}
      {pushModalDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">Select Firmware</h3>
              <button onClick={() => setPushModalDevice(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Select a firmware version to push to <span className="font-semibold text-gray-800">{pushModalDevice.name || pushModalDevice.id}</span>
              </p>
              
              <div className="space-y-3">
                {firmwares.length > 0 ? (
                  firmwares.map(fw => (
                    <div key={fw.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:border-[#4F6EF7]/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{fw.name || 'Unnamed Firmware'}</h4>
                          <p className="text-sm text-gray-500">Version: {fw.version}</p>
                          <p className="text-xs text-gray-400 mt-1">Platform: {fw.platform}</p>
                        </div>
                        <button 
                          onClick={() => setCodeModalFirmware(fw)}
                          className="text-xs text-[#4F6EF7] font-medium hover:underline"
                        >
                          View Code
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => handlePushOTA(fw.id, pushModalDevice.id)}
                        className="w-full py-2 bg-[#4F6EF7]/10 text-[#4F6EF7] hover:bg-[#4F6EF7]/20 font-medium rounded-lg text-sm transition-colors mt-2"
                      >
                        Push this version
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No firmwares available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Firmware Code Modal */}
      {codeModalFirmware && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">Firmware Code (.ino)</h3>
              <button onClick={() => setCodeModalFirmware(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800">{codeModalFirmware.name || 'Unnamed Firmware'} <span className="text-gray-500 font-normal">v{codeModalFirmware.version}</span></h4>
              </div>
              
              {codeModalFirmware.source_code ? (
                <textarea 
                  readOnly 
                  value={codeModalFirmware.source_code} 
                  className="w-full h-64 bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs text-gray-700 focus:outline-none resize-none"
                />
              ) : (
                <div className="w-full py-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-sm">No source code available for this firmware.</p>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              {codeModalFirmware.source_code && (
                <>
                  <button 
                    onClick={() => handleCopyCode(codeModalFirmware.source_code)}
                    className="px-4 py-2 rounded-xl text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 font-medium text-sm transition-colors"
                  >
                    Copy
                  </button>
                  <button 
                    onClick={() => handleDownloadCode(codeModalFirmware)}
                    className="px-4 py-2 rounded-xl text-white bg-[#4F6EF7] hover:bg-[#4F6EF7]/90 font-medium text-sm shadow-sm transition-colors"
                  >
                    Download (.ino)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
