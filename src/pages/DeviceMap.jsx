import React, { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { MapPin, Lightbulb, Compass, Filter, Search, ChevronRight, Map as MapIcon, Crosshair, Layers, Plus, Minus } from 'lucide-react'

export default function DeviceMap() {
  const { devices, setSelectedDeviceId, setActiveTab } = useApp()
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Derived metrics
  const activeCount = devices.filter(d => d.power === 'ON' && d.connectionStatus === 'Connected').length
  const standbyCount = devices.filter(d => d.power === 'OFF' && d.connectionStatus === 'Connected').length
  const faultCount = devices.filter(d => d.alerts && d.alerts.length > 0).length // Assuming faults are alerts
  const offlineCount = devices.filter(d => d.connectionStatus === 'Disconnected').length

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    const L = window.L
    if (!L || !mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: false, // Hide default to match custom UI
        scrollWheelZoom: true,
        attributionControl: false
      }).setView([16.5449, 81.5224], 7)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstanceRef.current)
    }

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    filteredDevices.forEach(device => {
      const isOnline = device.connectionStatus === 'Connected'
      const isOn = device.power === 'ON'
      
      let markerColor = 'bg-slate-500' // offline
      if (isOnline) {
        markerColor = isOn ? 'bg-emerald-500' : 'bg-amber-500' // active vs standby
      }

      const customHtmlIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="relative flex items-center justify-center cursor-pointer group">
                 <div class="absolute -inset-2 rounded-full opacity-20 ${markerColor} ${isOn ? 'animate-ping' : ''}"></div>
                 <div class="w-8 h-8 rounded-full border-2 border-white ${markerColor} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                 </div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })

      const marker = L.marker(device.coordinates, { icon: customHtmlIcon })
        .addTo(mapInstanceRef.current)

      marker.on('click', () => {
        setSelectedDeviceId(device.id)
        setActiveTab('device-details')
      })

      markersRef.current.push(marker)
    })

    if (filteredDevices.length > 0 && markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current)
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
    }

  }, [filteredDevices, setSelectedDeviceId, setActiveTab])

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn()
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut()
  const handleRecenter = () => {
    if (markersRef.current.length > 0) {
      const group = new window.L.featureGroup(markersRef.current)
      mapInstanceRef.current?.fitBounds(group.getBounds().pad(0.1))
    }
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="p-2 bg-blue-600/20 text-blue-500 rounded-xl">
          <MapIcon size={20} />
        </div>
        <div>
          <h1 className="text-xl font-outfit font-bold text-white tracking-tight">Device Map</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {devices.length} devices • <span className="text-emerald-500">{activeCount} active</span> • <span className="text-red-400">{offlineCount} offline</span>
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex gap-5 overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="w-80 shrink-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1 pb-4">
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search devices..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-white shadow-sm"
            />
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center gap-2 py-2 border border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-xl text-xs font-semibold hover:bg-blue-500/20 transition-colors"
          >
            <Filter size={14} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Status Grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-center flex flex-col items-center justify-center">
              <span className="text-emerald-500 font-bold text-lg leading-tight">{activeCount}</span>
              <span className="text-[9px] text-slate-400 font-semibold uppercase">Active</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-center flex flex-col items-center justify-center">
              <span className="text-amber-500 font-bold text-lg leading-tight">{standbyCount}</span>
              <span className="text-[9px] text-slate-400 font-semibold uppercase">Standby</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-center flex flex-col items-center justify-center">
              <span className="text-red-500 font-bold text-lg leading-tight">{faultCount}</span>
              <span className="text-[9px] text-slate-400 font-semibold uppercase">Fault</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-center flex flex-col items-center justify-center">
              <span className="text-slate-500 font-bold text-lg leading-tight">{offlineCount}</span>
              <span className="text-[9px] text-slate-400 font-semibold uppercase">Offline</span>
            </div>
          </div>

          {/* Device List */}
          <div className="space-y-2 mt-2">
            {filteredDevices.map(device => {
              const isOnline = device.connectionStatus === 'Connected'
              const isOn = device.power === 'ON'
              let statusText = 'Offline'
              let statusColor = 'text-slate-500'
              let iconBg = 'bg-slate-800 text-slate-500'
              
              if (isOnline) {
                if (isOn) {
                  statusText = 'Active'
                  statusColor = 'text-emerald-500'
                  iconBg = 'bg-emerald-500/10 text-emerald-500'
                } else {
                  statusText = 'Standby'
                  statusColor = 'text-amber-500'
                  iconBg = 'bg-amber-500/10 text-amber-500'
                }
              }

              return (
                <div 
                  key={device.id} 
                  onClick={() => {
                    if (mapInstanceRef.current && device.coordinates) {
                      mapInstanceRef.current.setView(device.coordinates, 15)
                    }
                  }}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${iconBg}`}>
                      <Lightbulb size={16} className={isOn && isOnline ? 'fill-current' : ''} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{device.name}</h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        {device.id} • <span className={`${statusColor} font-semibold px-1.5 py-0.5 rounded bg-slate-950`}>{statusText}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Floating DEVICE STATUS Box */}
          <div className="absolute top-4 left-4 z-[400] bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl w-56">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Device Status</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-200 font-medium">Active</span>
                </div>
                <span className="text-slate-400 font-mono">{activeCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-200 font-medium">Standby</span>
                </div>
                <span className="text-slate-400 font-mono">{standbyCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-slate-200 font-medium">Fault</span>
                </div>
                <span className="text-slate-400 font-mono">{faultCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <span className="text-slate-200 font-medium">Offline</span>
                </div>
                <span className="text-slate-400 font-mono">{offlineCount}</span>
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
            <button onClick={handleZoomIn} className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-lg">
              <Plus size={16} />
            </button>
            <button onClick={handleZoomOut} className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-lg">
              <Minus size={16} />
            </button>
            <button onClick={handleRecenter} className="w-8 h-8 mt-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-lg">
              <Crosshair size={16} />
            </button>
            <button className="w-8 h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-lg">
              <Layers size={16} />
            </button>
          </div>

          {/* Scale indicator placeholder */}
          <div className="absolute bottom-4 left-4 z-[400] bg-white text-black text-[10px] font-bold px-2 py-1 flex items-center w-24">
            3 km
            <div className="absolute bottom-0 right-0 left-0 border-b-2 border-black border-l-2 border-r-2 h-1"></div>
          </div>

          {/* Active indicator placeholder */}
          <div className="absolute bottom-4 right-4 z-[400] bg-blue-900/40 border border-blue-500/30 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            {filteredDevices.length} devices on map
          </div>

        </div>
      </div>
    </div>
  )
}

