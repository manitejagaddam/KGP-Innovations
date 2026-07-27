import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'
import { Calendar, Download, BarChart3, LineChart as LineIcon, Activity, ThermometerSun } from 'lucide-react'

export default function Analytics() {
  const { devices } = useApp()
  const [range, setRange] = useState('7d')
  const [region, setRegion] = useState('all')

  // Sample analytics datasets
  const mockDailyData = [
    { day: 'Mon', Energy: 45.2, Uptime: 98.4, PowerFactor: 0.95, Temperature: 42.1 },
    { day: 'Tue', Energy: 52.8, Uptime: 99.1, PowerFactor: 0.97, Temperature: 44.5 },
    { day: 'Wed', Energy: 49.1, Uptime: 96.5, PowerFactor: 0.94, Temperature: 46.2 },
    { day: 'Thu', Energy: 55.4, Uptime: 98.8, PowerFactor: 0.98, Temperature: 45.1 },
    { day: 'Fri', Energy: 58.2, Uptime: 99.5, PowerFactor: 0.99, Temperature: 43.8 },
    { day: 'Sat', Energy: 42.1, Uptime: 100.0, PowerFactor: 0.96, Temperature: 41.2 },
    { day: 'Sun', Energy: 40.5, Uptime: 99.8, PowerFactor: 0.95, Temperature: 40.5 },
  ]

  const handleExport = (format) => {
    alert(`Exporting analytics reports as ${format.toUpperCase()}...`)
  }

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-outfit font-black text-2xl tracking-tight text-slate-900 dark:text-white uppercase">
            Fleet Analytics
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            Aggregated system reporting & tracking
          </p>
        </div>

        {/* Date Filters and export */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl outline-none shadow-sm font-semibold cursor-pointer"
          >
            <option value="all">Region: All</option>
            <option value="bhimavaram">Bhimavaram</option>
            <option value="hyderabad">Hyderabad</option>
            <option value="vijayawada">Vijayawada</option>
          </select>

          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl outline-none shadow-sm font-semibold cursor-pointer"
          >
            <option value="24h">Range: 24 Hours</option>
            <option value="7d">Range: 7 Days</option>
            <option value="30d">Range: 30 Days</option>
          </select>

          <button 
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card: Energy Consumption */}
        <div className="glass-card bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h3 className="font-outfit font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider">Energy Consumed (kWh)</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockDailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '12px',
                    color: '#f1f5f9'
                  }} 
                />
                <Bar dataKey="Energy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card: Fleet Uptime */}
        <div className="glass-card bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <LineIcon className="w-5 h-5 text-emerald-500" />
            <h3 className="font-outfit font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider">Fleet Uptime Trend</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockDailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[90, 100]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '12px',
                    color: '#f1f5f9'
                  }} 
                />
                <Line type="monotone" dataKey="Uptime" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card: Power Factor */}
        <div className="glass-card bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <Activity className="w-5 h-5 text-purple-500" />
            <h3 className="font-outfit font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider">Average Power Factor</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockDailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0.8, 1.0]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '12px',
                    color: '#f1f5f9'
                  }} 
                />
                <Line type="monotone" dataKey="PowerFactor" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#a855f7' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card: Temperature Trend */}
        <div className="glass-card bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <ThermometerSun className="w-5 h-5 text-amber-500" />
            <h3 className="font-outfit font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider">Average Temperature (°C)</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockDailyData}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[30, 60]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '12px',
                    color: '#f1f5f9'
                  }} 
                />
                <Area type="monotone" dataKey="Temperature" stroke="#f59e0b" fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  )
}
