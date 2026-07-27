import React, { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { MapPin, Lightbulb, Compass, AlertTriangle, Filter } from 'lucide-react'

export default function DeviceMap() {
  const { devices, setSelectedDeviceId, setActiveTab } = useApp()
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  
  const [filterRegion, setFilterRegion] = useState('All')
  const [filterPower, setFilterPower] = useState('All')

  useEffect(() => {
    // Check if Leaflet is loaded on window
    const L = window.L
    if (!L || !mapContainerRef.current) return

    // 1. Initialize Map (Center around Bhimavaram/Hyderabad midpoints)
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([16.5449, 81.5224], 7) // Set center to Bhimavaram

      // Add CartoDB Dark Matter tile layer for a gorgeous dark aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstanceRef.current)
    }

    // 2. Clear old markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // 3. Render markers based on devices
    const filteredDevices = devices.filter(device => {
      const regionMatch = filterRegion === 'All' || device.location.toUpperCase() === filterRegion.toUpperCase()
      const powerMatch = filterPower === 'All' || device.power === filterPower
      return regionMatch && powerMatch
    })

    filteredDevices.forEach(device => {
      const isOnline = device.connectionStatus === 'Connected'
      const isOn = device.power === 'ON'
      
      // Determine marker dot styling using custom DivIcon HTML
      const ringColor = !isOnline 
        ? 'bg-slate-400 border-slate-600' 
        : isOn 
          ? 'bg-blue-500 border-blue-600 shadow-glow-blue animate-pulse' 
          : 'bg-amber-500 border-amber-600 shadow-glow-orange'
      
      const customHtmlIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="relative flex items-center justify-center">
                 <div class="absolute w-6 h-6 rounded-full opacity-35 ${isOn && isOnline ? 'bg-blue-500 animate-ping' : ''}"></div>
                 <div class="w-4.5 h-4.5 rounded-full border-2 border-slate-900 ${ringColor}"></div>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })

      // Add marker to map
      const marker = L.marker(device.coordinates, { icon: customHtmlIcon })
        .addTo(mapInstanceRef.current)

      // Bind detailed interactive popup matching dashboard style
      const popupHtml = `
        <div class="p-2 text-left min-w-[160px] font-sans">
          <h4 class="font-extrabold text-xs text-white uppercase tracking-tight">${device.name}</h4>
          <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">${device.location}</p>
          <div class="flex items-center gap-1.5 mt-2.5">
            <span class="w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}"></span>
            <span class="text-[10px] text-slate-300 font-bold uppercase">${device.power} (${device.status})</span>
          </div>
          <p class="text-[10px] font-medium text-slate-400 mt-1">Voltage: ${isOnline ? `${device.telemetry.voltage.toFixed(1)}V` : 'Offline'}</p>
          <button 
            id="popup-btn-${device.id}" 
            class="w-full mt-3 py-1 bg-blue-600 hover:bg-blue-700 text-[10px] font-bold text-white rounded-lg transition-colors border-0 uppercase tracking-wider text-center cursor-pointer"
          >
            Open Console
          </button>
        </div>
      `
      marker.bindPopup(popupHtml, { closeButton: false })

      // Handle popup click navigation
      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${device.id}`)
        if (btn) {
          btn.addEventListener('click', () => {
            setSelectedDeviceId(device.id)
            setActiveTab('device-details')
          })
        }
      })

      markersRef.current.push(marker)
    })

    // Adjust zoom if multiple devices exist
    if (filteredDevices.length > 0) {
      const group = new L.featureGroup(markersRef.current)
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.15))
    }

  }, [devices, filterRegion, filterPower])

  return (
    <div className="space-y-6">
      
      {/* Map Header details */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="font-outfit font-black text-2xl tracking-tight text-slate-900 dark:text-white uppercase">
            Geographic Fleet Map
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            Real-time geospatial status tracking
          </p>
        </div>

        {/* Filters & Legend */}
        <div className="flex flex-col sm:items-end gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none cursor-pointer text-slate-600 dark:text-slate-300 font-bold uppercase shadow-sm"
            >
              <option value="All">All Regions</option>
              <option value="HYDERABAD">Hyderabad</option>
              <option value="BHIMAVARAM">Bhimavaram</option>
              <option value="VIJAYAWADA">Vijayawada</option>
            </select>
            <select
              value={filterPower}
              onChange={(e) => setFilterPower(e.target.value)}
              className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none cursor-pointer text-slate-600 dark:text-slate-300 font-bold uppercase shadow-sm"
            >
              <option value="All">All Power</option>
              <option value="ON">Power: ON</option>
              <option value="OFF">Power: OFF</option>
            </select>
          </div>
          
          <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-600 shadow-glow-blue" />
              <span>Active ON</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600" />
              <span>Inactive OFF</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-600" />
              <span>Offline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Canvas Wrapper */}
      <div className="glass-card bg-slate-950/80 p-1 border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
        <div 
          ref={mapContainerRef} 
          className="w-full h-[540px] z-10" 
        />
        
        {/* Render Leaflet Fallback if CDN is slow */}
        {!window.L && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-950 text-center text-slate-400 space-y-3">
            <Compass className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-sm font-semibold uppercase tracking-wider">Loading Leaflet Map Engine...</p>
            <p className="text-xs text-slate-500">Please make sure you have internet access to download map resources.</p>
          </div>
        )}
      </div>

    </div>
  )
}
