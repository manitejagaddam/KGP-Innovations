import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts'
import { Calendar, Download, BarChart3, LineChart as LineIcon, Activity, ThermometerSun, Zap, PieChart as PieIcon, TrendingDown } from 'lucide-react'

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

  const peakDistributionData = [
    { name: 'Peak Hours', value: 65, color: '#f59e0b' },
    { name: 'Off-Peak', value: 35, color: '#3b82f6' }
  ]

  const budgetData = [
    { name: 'Consumed', value: 72, color: '#10b981' }, // 72%
    { name: 'Remaining', value: 28, color: '#334155' } // 28%
  ]

  const handleExport = (format) => {
    alert(`Exporting analytics reports as ${format.toUpperCase()}...`)
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-outfit font-black text-2xl tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <Activity className="text-purple-500" />
            Energy Analytics
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
            Comprehensive system performance reporting
          </p>
        </div>

        {/* Date Filters and export */}
        <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
             <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="px-3 py-1.5 text-xs bg-transparent text-slate-300 outline-none font-semibold cursor-pointer uppercase tracking-wider"
            >
              <option value="all">All Regions</option>
              <option value="bhimavaram">Bhimavaram</option>
              <option value="hyderabad">Hyderabad</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="px-3 py-1.5 text-xs bg-transparent text-slate-300 outline-none font-semibold cursor-pointer uppercase tracking-wider"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <button 
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-purple-900/50 cursor-pointer uppercase tracking-wider"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top Row Widgets (Budget & Peak) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Budget Half-Donut */}
        <div className="glass-card bg-slate-950 p-6 border border-slate-800 rounded-2xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-700"></div>
          <h3 className="font-outfit font-bold text-sm text-slate-400 uppercase tracking-widest absolute top-6 left-6">Monthly Energy Budget</h3>
          
          <div className="w-full h-48 mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={100}
                  outerRadius={140}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="absolute bottom-6 flex flex-col items-center">
            <span className="text-4xl font-black text-white tracking-tighter">72%</span>
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest mt-1">Consumed</span>
          </div>

          <div className="w-full flex justify-between items-center px-8 mt-4 border-t border-slate-800/50 pt-4">
             <div className="text-center">
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Used</p>
               <p className="text-lg font-bold text-slate-300">1,450 <span className="text-xs">kWh</span></p>
             </div>
             <div className="text-center">
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Budget</p>
               <p className="text-lg font-bold text-slate-300">2,000 <span className="text-xs">kWh</span></p>
             </div>
          </div>
        </div>

        {/* Peak vs Off-Peak Pie */}
        <div className="glass-card bg-slate-950 p-6 border border-slate-800 rounded-2xl shadow-xl flex flex-col relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>
           <h3 className="font-outfit font-bold text-sm text-slate-400 uppercase tracking-widest absolute top-6 left-6">Peak Distribution</h3>
           
           <div className="flex-1 flex items-center justify-center mt-6">
             <div className="w-1/2 h-48">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={peakDistributionData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {peakDistributionData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="w-1/2 flex flex-col gap-4 pl-4">
               {peakDistributionData.map(item => (
                 <div key={item.name} className="flex items-center gap-3">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                   <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.name}</p>
                     <p className="text-xl font-bold text-white">{item.value}%</p>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card: Energy Consumption */}
        <div className="glass-card bg-slate-950 p-6 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-outfit font-bold text-sm text-white uppercase tracking-wider">Energy Consumed</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Daily kWh Usage</p>
            </div>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockDailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} 
                />
                <Bar dataKey="Energy" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28}>
                  {mockDailyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.Energy > 50 ? '#3b82f6' : '#60a5fa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card: Temperature Trend */}
        <div className="glass-card bg-slate-950 p-6 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <ThermometerSun className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-outfit font-bold text-sm text-white uppercase tracking-wider">Thermal Status</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Average Temperature (°C)</p>
            </div>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockDailyData}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} 
                />
                <Area type="monotone" dataKey="Temperature" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card: Fleet Uptime */}
        <div className="glass-card bg-slate-950 p-6 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingDown className="w-5 h-5 text-emerald-500 rotate-180" />
            </div>
            <div>
              <h3 className="font-outfit font-bold text-sm text-white uppercase tracking-wider">Fleet Uptime</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">System Availability %</p>
            </div>
          </div>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockDailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} domain={[90, 100]} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} 
                />
                <Line type="monotone" dataKey="Uptime" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#020617' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card: Power Factor */}
        <div className="glass-card bg-slate-950 p-6 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <LineIcon className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-outfit font-bold text-sm text-white uppercase tracking-wider">Power Factor</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Efficiency Metric</p>
            </div>
          </div>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockDailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0.8, 1.0]} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }} 
                />
                <Line type="step" dataKey="PowerFactor" stroke="#a855f7" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#a855f7', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  )
}
