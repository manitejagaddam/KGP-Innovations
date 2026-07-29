import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getTypeInfo } from '../config/deviceTypes';

export default function Reports() {
  const { devices, alerts } = useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('billing'); // 'billing' or 'monitoring'
  const [selectedMonth, setSelectedMonth] = useState('0'); // 0 = current, 1 = prev, etc.
  const [selectedType, setSelectedType] = useState('All');
  const [invoiceModal, setInvoiceModal] = useState(null);

  // Billing calculation constants
  const RATE_PER_KWH = 7.5;
  const FIXED_CHARGE = 25;

  // Derive billing data
  const billingData = useMemo(() => {
    // We mock energy usage if not present in telemetry.
    // For energy meters, use total_kwh if available.
    return devices.map(device => {
      let energy = 0;
      if (device.type === 'ENERGY_METER' && device.telemetry?.total_kwh) {
        energy = device.telemetry.total_kwh;
      } else {
        // Mock some energy based on device id
        const numId = parseInt(device.id.replace(/\D/g, '') || '0');
        energy = 50 + (numId % 200) + (parseInt(selectedMonth) * 10);
      }
      
      const amount = (energy * RATE_PER_KWH) + FIXED_CHARGE;
      
      return {
        ...device,
        energy: energy.toFixed(2),
        rate: RATE_PER_KWH,
        amount: amount.toFixed(2),
        fixedCharge: FIXED_CHARGE
      };
    });
  }, [devices, selectedMonth]);

  const totalEnergy = billingData.reduce((sum, d) => sum + parseFloat(d.energy), 0);
  const totalAmount = billingData.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const devicesBilled = billingData.length;

  // Derive monitoring data
  const monitoringData = useMemo(() => {
    let filtered = devices;
    if (selectedType !== 'All') {
      filtered = filtered.filter(d => d.type === selectedType);
    }
    
    return filtered.map(device => {
      const typeInfo = getTypeInfo(device.type);
      const primaryMetric = typeInfo?.metrics?.[0]?.key || 'value';
      const metricLabel = typeInfo?.metrics?.[0]?.label || 'Value';
      const unit = typeInfo?.metrics?.[0]?.unit || '';
      
      // Mock stats
      const currentVal = device.telemetry?.[primaryMetric] || 0;
      const numId = parseInt(device.id.replace(/\D/g, '') || '0');
      
      const avg = currentVal ? (currentVal * 0.9).toFixed(1) : (20 + numId % 50).toFixed(1);
      const min = currentVal ? (currentVal * 0.7).toFixed(1) : (10 + numId % 20).toFixed(1);
      const max = currentVal ? (currentVal * 1.2).toFixed(1) : (40 + numId % 60).toFixed(1);
      const uptime = (95 + (numId % 5) + Math.random() * 0.9).toFixed(1);
      
      const deviceAlerts = alerts.filter(a => a.deviceId === device.id).length;
      
      return {
        ...device,
        metricLabel,
        unit,
        avg,
        min,
        max,
        uptime,
        alertsCount: deviceAlerts
      };
    });
  }, [devices, selectedType, alerts]);

  const uniqueTypes = ['All', ...new Set(devices.map(d => d.type))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Billing</h1>
          <p className="text-gray-500 text-sm mt-1">Generate reports and manage device billing</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'billing' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📊 Energy Billing
          </button>
          <button 
            onClick={() => setActiveTab('monitoring')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'monitoring' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📈 Monitoring Report
          </button>
        </div>
      </div>

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Billing Period:</label>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - m);
                  return (
                    <option key={m} value={m}>
                      {d.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </option>
                  );
                })}
              </select>
            </div>
            <button className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Generate Bill
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Energy (kWh)</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{totalEnergy.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Amount (₹)</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">₹{totalAmount.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500">Devices Billed</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{devicesBilled}</p>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Energy (kWh)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (₹/kWh)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billingData.map(device => {
                    const typeInfo = getTypeInfo(device.type);
                    return (
                      <tr key={device.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{device.name}</div>
                          <div className="text-sm text-gray-500">{device.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {typeInfo?.label || device.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{device.energy}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{device.rate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{device.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => setInvoiceModal(device)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md"
                          >
                            Invoice
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {billingData.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                        No billing data found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              >
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'All' ? 'All Types' : (getTypeInfo(type)?.label || type)}
                  </option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => window.print()}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              🖨️ Export / Print
            </button>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary Metric</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Min</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Max</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Uptime %</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Alerts</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monitoringData.map(device => {
                    const typeInfo = getTypeInfo(device.type);
                    return (
                      <tr key={device.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{device.name}</div>
                          <div className="text-sm text-gray-500">{device.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {typeInfo?.label || device.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{device.metricLabel}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{device.avg} {device.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{device.min} {device.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{device.max} {device.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${parseFloat(device.uptime) >= 99 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {device.uptime}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {device.alertsCount > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {device.alertsCount}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {monitoringData.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-sm text-gray-500">
                        No data available for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setInvoiceModal(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Invoice: {invoiceModal.name}
                    </h3>
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm text-gray-500">Device ID</span>
                        <span className="text-sm font-medium text-gray-900">{invoiceModal.id}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm text-gray-500">Location</span>
                        <span className="text-sm font-medium text-gray-900">{invoiceModal.location}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm text-gray-500">Energy Consumed</span>
                        <span className="text-sm font-medium text-gray-900">{invoiceModal.energy} kWh</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm text-gray-500">Rate per kWh</span>
                        <span className="text-sm font-medium text-gray-900">₹{invoiceModal.rate}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm text-gray-500">Energy Charges</span>
                        <span className="text-sm font-medium text-gray-900">₹{(invoiceModal.energy * invoiceModal.rate).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm text-gray-500">Fixed Charges</span>
                        <span className="text-sm font-medium text-gray-900">₹{invoiceModal.fixedCharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="text-base font-bold text-gray-900">Total Amount</span>
                        <span className="text-base font-bold text-blue-600">₹{invoiceModal.amount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={() => {
                    window.print();
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Print Invoice
                </button>
                <button 
                  type="button" 
                  onClick={() => setInvoiceModal(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
