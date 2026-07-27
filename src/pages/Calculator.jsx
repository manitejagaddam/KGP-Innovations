import React, { useState, useMemo } from 'react'
import { Calculator as CalcIcon, Plus, Trash2, Zap, AlertCircle, Clock, Calendar, IndianRupee, PieChart } from 'lucide-react'

export default function Calculator() {
  const [lights, setLights] = useState([
    { id: 1, wattage: 20, quantity: 10 },
    { id: 2, wattage: 50, quantity: 5 },
    { id: 3, wattage: 30, quantity: 15 }
  ])

  const [params, setParams] = useState({
    voltage: 230,
    powerFactor: 0.99,
    hoursPerDay: 12,
    daysPerMonth: 30,
    costPerUnit: 8
  })

  const handleAddLight = () => {
    const newId = lights.length > 0 ? Math.max(...lights.map(l => l.id)) + 1 : 1
    setLights([...lights, { id: newId, wattage: 0, quantity: 1 }])
  }

  const handleRemoveLight = (id) => {
    setLights(lights.filter(l => l.id !== id))
  }

  const updateLight = (id, field, value) => {
    setLights(lights.map(l => l.id === id ? { ...l, [field]: Number(value) || 0 } : l))
  }

  const updateParam = (field, value) => {
    setParams({ ...params, [field]: Number(value) || 0 })
  }

  // Calculations
  const calculations = useMemo(() => {
    const totalLoad = lights.reduce((sum, light) => sum + (light.wattage * light.quantity), 0)
    const pf = params.powerFactor || 1
    const apparentPower = totalLoad / pf
    const current = apparentPower / (params.voltage || 1)
    const powerKw = totalLoad / 1000
    const dailyEnergy = powerKw * params.hoursPerDay
    const monthlyEnergy = dailyEnergy * params.daysPerMonth
    const bill = monthlyEnergy * params.costPerUnit

    return {
      totalLoad,
      apparentPower,
      current,
      powerKw,
      dailyEnergy,
      monthlyEnergy,
      bill
    }
  }, [lights, params])

  // Simple Donut Chart SVG Generation
  const renderDonutChart = () => {
    if (lights.length === 0 || calculations.totalLoad === 0) return null
    
    let currentAngle = 0
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    
    return (
      <div className="relative w-48 h-48 mx-auto mt-4">
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
          {lights.map((light, index) => {
            const load = light.wattage * light.quantity
            if (load === 0) return null
            const percentage = load / calculations.totalLoad
            const dashArray = `${percentage * 251.2} 251.2`
            const dashOffset = `-${currentAngle * 251.2}`
            currentAngle += percentage

            return (
              <circle
                key={light.id}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={colors[index % colors.length]}
                strokeWidth="20"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500 ease-in-out"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total Load</span>
          <span className="text-xl font-black text-white">{calculations.totalLoad} W</span>
        </div>
      </div>
    )
  }

  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500']

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/20 text-blue-500 rounded-2xl">
            <CalcIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-outfit font-bold text-white tracking-tight">Street Light Load Calculator</h1>
            <p className="text-sm text-slate-400 mt-1">Estimate connected load, current, energy use and the monthly electricity bill</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => {
            setLights([{ id: 1, wattage: 0, quantity: 1 }])
            setParams({ voltage: 230, powerFactor: 0.99, hoursPerDay: 12, daysPerMonth: 30, costPerUnit: 8 })
          }} className="px-4 py-2 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold">
            Reset
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-semibold shadow-lg shadow-blue-500/20">
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Street Lights List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <LightbulbIcon className="text-blue-500" size={18} />
                <h3 className="font-bold text-white">Street Lights</h3>
              </div>
              <button onClick={handleAddLight} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors">
                <Plus size={14} strokeWidth={3} /> Add Light
              </button>
            </div>

            <div className="space-y-4">
              {lights.map((light) => (
                <div key={light.id} className="flex items-end gap-3 pb-4 border-b border-slate-800/60 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Wattage (W)</label>
                    <div className="relative">
                      <input type="number" min="0" value={light.wattage || ''} onChange={(e) => updateLight(light.id, 'wattage', e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium text-white" />
                      <span className="absolute right-3 top-2 text-slate-500 text-sm">W</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Quantity</label>
                    <input type="number" min="1" value={light.quantity || ''} onChange={(e) => updateLight(light.id, 'quantity', e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium text-white" />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Load</label>
                    <div className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm font-bold text-white text-center">
                      {(light.wattage * light.quantity) || 0} W
                    </div>
                  </div>
                  <button onClick={() => handleRemoveLight(light.id)} className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors" title="Remove">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-between items-center bg-blue-900/20 rounded-xl p-3 border border-blue-500/20">
              <span className="text-sm font-medium text-slate-400">{lights.length} types • {lights.reduce((acc, l) => acc + l.quantity, 0)} lights</span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm">
                <Zap size={14} className="fill-current" /> Total: {calculations.totalLoad} W
              </span>
            </div>
          </div>

          {/* Parameters Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <AlertCircle className="text-blue-500" size={18} />
              <h3 className="font-bold text-white">Supply & Usage Parameters</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Supply Voltage (V)</label>
                <input type="number" value={params.voltage} onChange={e => updateParam('voltage', e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Power Factor</label>
                <input type="number" step="0.01" value={params.powerFactor} onChange={e => updateParam('powerFactor', e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1"><Clock size={10}/> Operating Hours / Day</label>
                <input type="number" value={params.hoursPerDay} onChange={e => updateParam('hoursPerDay', e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1"><Calendar size={10}/> Days / Month</label>
                <input type="number" value={params.daysPerMonth} onChange={e => updateParam('daysPerMonth', e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium text-white" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1"><IndianRupee size={10}/> Cost per Unit (₹ per kWh)</label>
                <input type="number" step="0.1" value={params.costPerUnit} onChange={e => updateParam('costPerUnit', e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium text-white" />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Results Grid */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-blue-500 mb-3">
                <Zap size={16} className="fill-current" />
                <span className="text-xs font-semibold text-slate-400">Total Connected Load</span>
              </div>
              <div>
                <span className="text-3xl font-black text-white">{calculations.totalLoad}</span>
                <span className="text-sm font-bold text-slate-500 ml-1">W</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-cyan-500 mb-3">
                <PieChart size={16} />
                <span className="text-xs font-semibold text-slate-400">Power Factor</span>
              </div>
              <div>
                <span className="text-3xl font-black text-white">{params.powerFactor}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-purple-500 mb-3">
                <ActivityIcon size={16} />
                <span className="text-xs font-semibold text-slate-400">Apparent Power</span>
              </div>
              <div>
                <span className="text-3xl font-black text-white">{calculations.apparentPower.toFixed(0)}</span>
                <span className="text-sm font-bold text-slate-500 ml-1">VA</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-amber-500 mb-3">
                <ActivityIcon size={16} />
                <span className="text-xs font-semibold text-slate-400">Current Consumption</span>
              </div>
              <div>
                <span className="text-3xl font-black text-white">{calculations.current.toFixed(2)}</span>
                <span className="text-sm font-bold text-slate-500 ml-1">A</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-emerald-500 mb-3">
                <LightbulbIcon size={16} className="fill-current" />
                <span className="text-xs font-semibold text-slate-400">Power</span>
              </div>
              <div>
                <span className="text-3xl font-black text-white">{calculations.powerKw.toFixed(1)}</span>
                <span className="text-sm font-bold text-slate-500 ml-1">kW</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-orange-400 mb-3">
                <SunIcon size={16} className="fill-current" />
                <span className="text-xs font-semibold text-slate-400">Daily Energy</span>
              </div>
              <div>
                <span className="text-3xl font-black text-white">{calculations.dailyEnergy.toFixed(1)}</span>
                <span className="text-sm font-bold text-slate-500 ml-1">kWh</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-blue-400 mb-3">
                <Calendar size={16} />
                <span className="text-xs font-semibold text-slate-400">Monthly Energy</span>
              </div>
              <div>
                <span className="text-3xl font-black text-white">{calculations.monthlyEnergy.toFixed(0)}</span>
                <span className="text-sm font-bold text-slate-500 ml-1">kWh</span>
              </div>
            </div>

            <div className="col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border border-red-500/20 rounded-2xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="flex items-center gap-2 text-red-400 mb-3 relative z-10">
                <IndianRupee size={16} />
                <span className="text-xs font-semibold text-slate-300">Estimated Electricity Bill</span>
              </div>
              <div className="relative z-10">
                <span className="text-4xl font-black text-white tracking-tight">₹{calculations.bill.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="text-slate-400" size={16} />
              <h3 className="font-bold text-white text-sm">Load Distribution by Light Type</h3>
            </div>
            
            {renderDonutChart()}

            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {lights.map((light, index) => {
                const load = light.wattage * light.quantity
                if (load === 0) return null
                const percentage = ((load / calculations.totalLoad) * 100).toFixed(0)
                
                return (
                  <div key={light.id} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors[index % colors.length]}`}></span>
                    {light.wattage}W × {light.quantity} <span className="text-white ml-1">{percentage}%</span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function LightbulbIcon(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
}

function ActivityIcon(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}

function SunIcon(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
}
