/**
 * KGP IoT Device Type Registry
 * Matches the reference dashboard's TYPES configuration.
 * Each device type defines its icon, metrics, primary metric,
 * control labels, alert thresholds, and color palette.
 */

const PALETTE = [
  { c: '#DB8B12', b: '#FDF3E0' }, { c: '#4F6EF7', b: '#EEF1FE' },
  { c: '#0891B2', b: '#E4F6FA' }, { c: '#7C5CE0', b: '#F1ECFC' },
  { c: '#E4483C', b: '#FDECEB' }, { c: '#0FA968', b: '#E7F8F0' },
  { c: '#0EA5E9', b: '#E0F5FE' }, { c: '#EA580C', b: '#FEEBDD' },
  { c: '#65A30D', b: '#EEF7DC' }, { c: '#CA8A04', b: '#FBF0D6' },
  { c: '#059669', b: '#DCF6EC' }, { c: '#6366F1', b: '#E7E8FD' },
  { c: '#DB2777', b: '#FCE4F0' }, { c: '#0D9488', b: '#DDF6F1' },
  { c: '#9333EA', b: '#F3E6FC' }, { c: '#F59E0B', b: '#FEF3D6' },
];

const TYPES_RAW = {
  street_light: {
    label: 'Street Light', icon: '💡', controllable: true, energyMetric: 'energy',
    controlLabels: { auto: 'Auto Mode', on: 'Manual ON', off: 'Manual OFF' },
    primary: 'load', primaryUnit: 'W', primaryLabel: 'Load',
    metrics: [
      { k: 'voltage', l: 'Voltage', u: 'V', ic: '🔌' },
      { k: 'current', l: 'Current', u: 'A', ic: '⚡' },
      { k: 'load', l: 'Power Load', u: 'W', ic: '💡' },
      { k: 'energy', l: 'Energy', u: 'kWh', ic: '🔋' },
      { k: 'pf', l: 'Power Factor', u: '', ic: '✖️', dec: 2 },
      { k: 'temp', l: 'Temperature', u: '°C', ic: '🌡️' },
    ],
  },
  smart_meter: {
    label: 'Smart Meter', icon: '🔢', controllable: true, energyMetric: 'energy',
    controlLabels: { auto: 'Auto Mode', on: 'Supply ON', off: 'Supply OFF' },
    primary: 'load', primaryUnit: 'W', primaryLabel: 'Load',
    metrics: [
      { k: 'voltage', l: 'Voltage', u: 'V', ic: '🔌' },
      { k: 'current', l: 'Current', u: 'A', ic: '⚡' },
      { k: 'load', l: 'Load', u: 'W', ic: '📟' },
      { k: 'energy', l: 'Energy', u: 'kWh', ic: '🔋' },
      { k: 'pf', l: 'Power Factor', u: '', ic: '✖️', dec: 2 },
      { k: 'freq', l: 'Frequency', u: 'Hz', ic: '〰️' },
    ],
  },
  tank: {
    label: 'Tank Level Indicator', icon: '🛢️', controllable: false,
    primary: 'level', primaryUnit: '%', primaryLabel: 'Water Level',
    alert: { k: 'level', low: 20 },
    metrics: [
      { k: 'level', l: 'Water Level', u: '%', ic: '🌊' },
      { k: 'volume', l: 'Volume', u: 'L', ic: '🪣' },
      { k: 'temp', l: 'Temperature', u: '°C', ic: '🌡️' },
      { k: 'pump', l: 'Pump Status', u: '', ic: '🔧', text: true },
    ],
  },
  motor: {
    label: 'Motor Controller', icon: '⚙️', controllable: true,
    controlLabels: { auto: 'Auto Mode', on: 'Force Run', off: 'Force Stop' },
    primary: 'rpm', primaryUnit: 'RPM', primaryLabel: 'Speed',
    alert: { k: 'vibration', high: 4 },
    metrics: [
      { k: 'voltage', l: 'Voltage', u: 'V', ic: '🔌' },
      { k: 'current', l: 'Current', u: 'A', ic: '⚡' },
      { k: 'rpm', l: 'Speed', u: 'RPM', ic: '🌀' },
      { k: 'vibration', l: 'Vibration', u: 'mm/s', ic: '📈' },
      { k: 'temp', l: 'Winding Temp', u: '°C', ic: '🌡️' },
      { k: 'runHours', l: 'Run Hours', u: 'h', ic: '⏱️' },
    ],
  },
  traffic: {
    label: 'Traffic Signal Monitor', icon: '🚦', controllable: true,
    controlLabels: { auto: 'Auto Timing', on: 'Manual Override', off: 'Flashing Mode' },
    primary: 'vehicles', primaryUnit: '/hr', primaryLabel: 'Vehicle Count',
    alert: { k: 'health', low: 80 },
    metrics: [
      { k: 'phase', l: 'Current Phase', u: '', ic: '🚦', text: true },
      { k: 'cycle', l: 'Cycle Time', u: 's', ic: '⏲️' },
      { k: 'vehicles', l: 'Vehicle Count', u: '/hr', ic: '🚗' },
      { k: 'health', l: 'Signal Health', u: '%', ic: '❤️' },
    ],
  },
  parking: {
    label: 'Smart Parking System', icon: '🅿️', controllable: false,
    primary: 'occupancy', primaryUnit: '%', primaryLabel: 'Occupancy',
    alert: { k: 'occupancy', high: 90 },
    metrics: [
      { k: 'total', l: 'Total Slots', u: '', ic: '🅿️' },
      { k: 'occupied', l: 'Occupied', u: '', ic: '🚙' },
      { k: 'available', l: 'Available', u: '', ic: '✅' },
      { k: 'occupancy', l: 'Occupancy', u: '%', ic: '📊' },
      { k: 'entries', l: 'Entries Today', u: '', ic: '⬇️' },
      { k: 'exits', l: 'Exits Today', u: '', ic: '⬆️' },
      { k: 'avgDuration', l: 'Avg. Stay', u: 'min', ic: '⏱️' },
      { k: 'revenue', l: 'Revenue Today', u: '₹', ic: '💰' },
    ],
  },
  water_quality: {
    label: 'Water Quality Tester', icon: '💧', controllable: false,
    primary: 'ph', primaryUnit: 'pH', primaryLabel: 'pH Level',
    alert: { k: 'ph', low: 6.5, high: 8.5 },
    metrics: [
      { k: 'ph', l: 'pH Level', u: '', ic: '💧', dec: 1 },
      { k: 'tds', l: 'TDS', u: 'ppm', ic: '🧪' },
      { k: 'turbidity', l: 'Turbidity', u: 'NTU', ic: '🌫️', dec: 1 },
      { k: 'temp', l: 'Temperature', u: '°C', ic: '🌡️' },
    ],
  },
  air_quality: {
    label: 'Air Quality Monitor', icon: '🌫️', controllable: false,
    primary: 'aqi', primaryUnit: 'AQI', primaryLabel: 'Air Quality Index',
    alert: { k: 'aqi', high: 150 },
    metrics: [
      { k: 'aqi', l: 'AQI', u: '', ic: '🌫️' },
      { k: 'pm25', l: 'PM2.5', u: 'µg/m³', ic: '🟤' },
      { k: 'pm10', l: 'PM10', u: 'µg/m³', ic: '⬛' },
      { k: 'co2', l: 'CO₂', u: 'ppm', ic: '💨' },
      { k: 'co', l: 'CO', u: 'ppm', ic: '☁️', dec: 1 },
      { k: 'no2', l: 'NO₂', u: 'ppb', ic: '🟠' },
      { k: 'temp', l: 'Temperature', u: '°C', ic: '🌡️' },
      { k: 'humidity', l: 'Humidity', u: '%', ic: '💦' },
    ],
  },
  dustbin: {
    label: 'Smart Dustbin', icon: '🗑️', controllable: false,
    primary: 'fill', primaryUnit: '%', primaryLabel: 'Fill Level',
    alert: { k: 'fill', high: 85 },
    metrics: [
      { k: 'fill', l: 'Fill Level', u: '%', ic: '🗑️' },
      { k: 'weight', l: 'Weight', u: 'kg', ic: '⚖️' },
      { k: 'lid', l: 'Lid Status', u: '', ic: '🔓', text: true },
      { k: 'battery', l: 'Sensor Battery', u: '%', ic: '🔋' },
    ],
  },
  solar: {
    label: 'Smart Solar Analyzer', icon: '☀️', controllable: true, energyMetric: 'generated',
    controlLabels: { auto: 'Auto Mode', on: 'Inverter ON', off: 'Inverter OFF' },
    primary: 'power', primaryUnit: 'W', primaryLabel: 'Output Power',
    metrics: [
      { k: 'panelVoltage', l: 'Panel Voltage', u: 'V', ic: '🔌' },
      { k: 'panelCurrent', l: 'Panel Current', u: 'A', ic: '⚡' },
      { k: 'power', l: 'Output Power', u: 'W', ic: '☀️' },
      { k: 'generated', l: 'Generated Today', u: 'kWh', ic: '🔋' },
      { k: 'battery', l: 'Battery', u: '%', ic: '🔋' },
    ],
  },
  soil_moisture: {
    label: 'Soil Moisture Sensor', icon: '🌱', controllable: false,
    primary: 'moisture', primaryUnit: '%', primaryLabel: 'Soil Moisture',
    alert: { k: 'moisture', low: 25 },
    metrics: [
      { k: 'moisture', l: 'Soil Moisture', u: '%', ic: '🌱' },
      { k: 'soilTemp', l: 'Soil Temp', u: '°C', ic: '🌡️' },
      { k: 'ec', l: 'Conductivity (EC)', u: 'mS/cm', ic: '🧪', dec: 2 },
      { k: 'battery', l: 'Battery', u: '%', ic: '🔋' },
    ],
  },
  weather_station: {
    label: 'Weather Station', icon: '⛅', controllable: false,
    primary: 'temp', primaryUnit: '°C', primaryLabel: 'Temperature',
    metrics: [
      { k: 'temp', l: 'Temperature', u: '°C', ic: '🌡️' },
      { k: 'humidity', l: 'Humidity', u: '%', ic: '💦' },
      { k: 'rainfall', l: 'Rainfall', u: 'mm', ic: '🌧️', dec: 1 },
      { k: 'windSpeed', l: 'Wind Speed', u: 'km/h', ic: '💨' },
      { k: 'pressure', l: 'Pressure', u: 'hPa', ic: '📟' },
    ],
  },
  gas_leak: {
    label: 'Gas Leak Detector', icon: '🧯', controllable: false,
    primary: 'gasLevel', primaryUnit: 'ppm', primaryLabel: 'Gas Concentration',
    alert: { k: 'gasLevel', high: 400 },
    metrics: [
      { k: 'gasLevel', l: 'Gas Concentration', u: 'ppm', ic: '🧯' },
      { k: 'status', l: 'Status', u: '', ic: '🚨', text: true },
      { k: 'temp', l: 'Temperature', u: '°C', ic: '🌡️' },
      { k: 'battery', l: 'Battery', u: '%', ic: '🔋' },
    ],
  },
  irrigation_valve: {
    label: 'Smart Irrigation Valve', icon: '🚿', controllable: true,
    controlLabels: { auto: 'Auto Schedule', on: 'Valve OPEN', off: 'Valve CLOSED' },
    primary: 'flowRate', primaryUnit: 'L/min', primaryLabel: 'Flow Rate',
    metrics: [
      { k: 'flowRate', l: 'Flow Rate', u: 'L/min', ic: '🚿' },
      { k: 'valveStatus', l: 'Valve Status', u: '', ic: '🔧', text: true },
      { k: 'pressure', l: 'Line Pressure', u: 'bar', ic: '📟', dec: 1 },
      { k: 'totalFlow', l: 'Total Flow Today', u: 'L', ic: '💧' },
    ],
  },
  ev_charger: {
    label: 'EV Charging Station', icon: '🔌', controllable: true, energyMetric: 'sessionEnergy',
    controlLabels: { auto: 'Auto Mode', on: 'Start Charging', off: 'Stop Charging' },
    primary: 'power', primaryUnit: 'kW', primaryLabel: 'Charging Power',
    metrics: [
      { k: 'voltage', l: 'Voltage', u: 'V', ic: '🔌' },
      { k: 'current', l: 'Current', u: 'A', ic: '⚡' },
      { k: 'power', l: 'Charging Power', u: 'kW', ic: '🔋', dec: 1 },
      { k: 'sessionEnergy', l: 'Session Energy', u: 'kWh', ic: '🔋', dec: 1 },
      { k: 'connector', l: 'Connector Status', u: '', ic: '🔌', text: true },
    ],
  },
  rain_wind: {
    label: 'Rain & Wind Station', icon: '🌬️', controllable: false,
    primary: 'windSpeed', primaryUnit: 'km/h', primaryLabel: 'Wind Speed',
    alert: { k: 'windGust', high: 60 },
    metrics: [
      { k: 'rainfall', l: 'Rainfall Intensity', u: 'mm/hr', ic: '🌧️', dec: 1 },
      { k: 'totalRainfall', l: 'Total Rainfall Today', u: 'mm', ic: '☔', dec: 1 },
      { k: 'windSpeed', l: 'Wind Speed', u: 'km/h', ic: '🌬️', dec: 1 },
      { k: 'windGust', l: 'Wind Gust', u: 'km/h', ic: '💨', dec: 1 },
      { k: 'windDirection', l: 'Wind Direction', u: '', ic: '🧭', text: true },
    ],
  },
  industrial_machine: {
    label: 'Industrial Machine Monitor', icon: '🏭', controllable: true,
    controlLabels: { auto: 'Auto Mode', on: 'Force Run', off: 'Force Stop' },
    primary: 'vibration', primaryUnit: 'mm/s', primaryLabel: 'Vibration',
    alert: { k: 'vibration', high: 7 },
    metrics: [
      { k: 'status', l: 'Machine Status', u: '', ic: '🏭', text: true },
      { k: 'rpm', l: 'Speed', u: 'RPM', ic: '🌀' },
      { k: 'current', l: 'Current Draw', u: 'A', ic: '⚡' },
      { k: 'vibration', l: 'Vibration', u: 'mm/s', ic: '📈', dec: 1 },
      { k: 'temp', l: 'Machine Temp', u: '°C', ic: '🌡️' },
      { k: 'health', l: 'Health Score', u: '%', ic: '❤️' },
      { k: 'runHours', l: 'Run Hours', u: 'h', ic: '⏱️' },
    ],
  },
  agri_controller: {
    label: 'Agriculture Controller', icon: '🌾', controllable: true,
    controlLabels: { auto: 'Auto Mode', on: 'Irrigation ON', off: 'Irrigation OFF' },
    primary: 'soilMoisture', primaryUnit: '%', primaryLabel: 'Soil Moisture',
    alert: { k: 'soilMoisture', low: 20 },
    metrics: [
      { k: 'soilMoisture', l: 'Soil Moisture', u: '%', ic: '🌾' },
      { k: 'soilTemp', l: 'Soil Temp', u: '°C', ic: '🌡️' },
      { k: 'humidity', l: 'Humidity', u: '%', ic: '💦' },
      { k: 'lightIntensity', l: 'Light Intensity', u: 'lux', ic: '☀️' },
      { k: 'pump', l: 'Pump Status', u: '', ic: '🔧', text: true },
    ],
  },
  gps_tracker: {
    label: 'GPS Vehicle Tracker', icon: '🛰️', controllable: true,
    controlLabels: { auto: 'Auto Mode', on: 'Engine Enabled', off: 'Engine Immobilized' },
    primary: 'speed', primaryUnit: 'km/h', primaryLabel: 'Speed',
    metrics: [
      { k: 'speed', l: 'Speed', u: 'km/h', ic: '🚗' },
      { k: 'fuelLevel', l: 'Fuel Level', u: '%', ic: '⛽' },
      { k: 'ignition', l: 'Ignition', u: '', ic: '🔑', text: true },
      { k: 'odometer', l: 'Odometer', u: 'km', ic: '🛣️', dec: 1 },
      { k: 'location', l: 'Location', u: '', ic: '📍', text: true },
    ],
  },
  building_gateway: {
    label: 'Smart Building Gateway', icon: '🏢', controllable: false,
    primary: 'connectedDevices', primaryUnit: '', primaryLabel: 'Connected Devices',
    metrics: [
      { k: 'connectedDevices', l: 'Connected Devices', u: '', ic: '🏢' },
      { k: 'temp', l: 'Avg Temperature', u: '°C', ic: '🌡️' },
      { k: 'humidity', l: 'Avg Humidity', u: '%', ic: '💦' },
      { k: 'energyLoad', l: 'Energy Load', u: 'kW', ic: '⚡', dec: 1 },
      { k: 'uptime', l: 'Gateway Uptime', u: '%', ic: '📶', dec: 1 },
    ],
  },
  cctv_gateway: {
    label: 'CCTV Gateway', icon: '📹', controllable: true,
    controlLabels: { auto: 'Auto Mode', on: 'Recording ON', off: 'Recording OFF' },
    primary: 'camerasOnline', primaryUnit: '', primaryLabel: 'Cameras Online',
    metrics: [
      { k: 'camerasOnline', l: 'Cameras Online', u: '', ic: '📹' },
      { k: 'storageUsed', l: 'Storage Used', u: '%', ic: '💾', dec: 1 },
      { k: 'bandwidth', l: 'Bandwidth', u: 'Mbps', ic: '📶', dec: 1 },
      { k: 'motionEvents', l: 'Motion Events Today', u: '', ic: '🚶' },
      { k: 'recording', l: 'Recording Status', u: '', ic: '⏺️', text: true },
    ],
  },
  fleet_gateway: {
    label: 'Fleet Gateway', icon: '🚚', controllable: false,
    primary: 'vehiclesConnected', primaryUnit: '', primaryLabel: 'Vehicles Connected',
    metrics: [
      { k: 'vehiclesConnected', l: 'Vehicles Connected', u: '', ic: '🚚' },
      { k: 'avgSpeed', l: 'Avg Fleet Speed', u: 'km/h', ic: '🚗', dec: 1 },
      { k: 'activeTrips', l: 'Active Trips', u: '', ic: '🗺️' },
      { k: 'alertsToday', l: 'Alerts Today', u: '', ic: '⚠️' },
    ],
  },
  smart_home: {
    label: 'Smart Home Controller', icon: '🏠', controllable: true,
    controlLabels: { auto: 'Auto Mode', on: 'Home Mode', off: 'Away Mode' },
    primary: 'devicesConnected', primaryUnit: '', primaryLabel: 'Connected Devices',
    metrics: [
      { k: 'devicesConnected', l: 'Connected Devices', u: '', ic: '🏠' },
      { k: 'temp', l: 'Temperature', u: '°C', ic: '🌡️' },
      { k: 'humidity', l: 'Humidity', u: '%', ic: '💦' },
      { k: 'energyUsage', l: 'Energy Usage', u: 'kWh', ic: '🔋', dec: 1 },
      { k: 'mode', l: 'Mode', u: '', ic: '🎛️', text: true },
    ],
  },
  fire_alarm_gateway: {
    label: 'Fire Alarm Gateway', icon: '🚨', controllable: false,
    primary: 'activeAlarms', primaryUnit: '', primaryLabel: 'Active Alarms',
    alert: { k: 'activeAlarms', high: 0 },
    metrics: [
      { k: 'zonesMonitored', l: 'Zones Monitored', u: '', ic: '🗺️' },
      { k: 'activeAlarms', l: 'Active Alarms', u: '', ic: '🚨' },
      { k: 'batteryBackup', l: 'Battery Backup', u: '%', ic: '🔋', dec: 1 },
      { k: 'status', l: 'System Status', u: '', ic: '🛡️', text: true },
    ],
  },
  smoke_detector: {
    label: 'Smoke Detector', icon: '🔥', controllable: false,
    primary: 'smokeLevel', primaryUnit: '%', primaryLabel: 'Smoke Level',
    alert: { k: 'smokeLevel', high: 40 },
    metrics: [
      { k: 'smokeLevel', l: 'Smoke Level', u: '%', ic: '🔥' },
      { k: 'temp', l: 'Temperature', u: '°C', ic: '🌡️' },
      { k: 'battery', l: 'Battery', u: '%', ic: '🔋' },
      { k: 'status', l: 'Status', u: '', ic: '🛑', text: true },
    ],
  },
  irrigation_controller: {
    label: 'Irrigation Controller', icon: '💦', controllable: true,
    controlLabels: { auto: 'Auto Schedule', on: 'Manual Irrigation ON', off: 'Manual Irrigation OFF' },
    primary: 'flowRate', primaryUnit: 'L/min', primaryLabel: 'Flow Rate',
    metrics: [
      { k: 'activeZone', l: 'Active Zone', u: '', ic: '🗺️', text: true },
      { k: 'flowRate', l: 'Flow Rate', u: 'L/min', ic: '💦' },
      { k: 'soilMoisture', l: 'Soil Moisture', u: '%', ic: '🌱' },
      { k: 'waterUsedToday', l: 'Water Used Today', u: 'L', ic: '🪣' },
      { k: 'schedule', l: 'Schedule Status', u: '', ic: '⏱️', text: true },
    ],
  },
  machine_monitor_unit: {
    label: 'Machine Monitoring Unit', icon: '🧰', controllable: false,
    primary: 'avgHealth', primaryUnit: '%', primaryLabel: 'Avg. Machine Health',
    alert: { k: 'avgHealth', low: 60 },
    metrics: [
      { k: 'machinesMonitored', l: 'Machines Monitored', u: '', ic: '🧰' },
      { k: 'avgVibration', l: 'Avg Vibration', u: 'mm/s', ic: '📈', dec: 1 },
      { k: 'faultsToday', l: 'Faults Today', u: '', ic: '⚠️' },
      { k: 'avgHealth', l: 'Avg Machine Health', u: '%', ic: '❤️' },
    ],
  },
  water_flow_meter: {
    label: 'Water Flow Meter', icon: '🚰', controllable: true,
    controlLabels: { auto: 'Auto Mode', on: 'Supply ON', off: 'Supply OFF' },
    primary: 'flowRate', primaryUnit: 'L/min', primaryLabel: 'Flow Rate',
    metrics: [
      { k: 'flowRate', l: 'Flow Rate', u: 'L/min', ic: '🚰' },
      { k: 'totalVolume', l: 'Total Volume', u: 'L', ic: '🪣' },
      { k: 'pressure', l: 'Line Pressure', u: 'bar', ic: '📟', dec: 1 },
      { k: 'temp', l: 'Water Temp', u: '°C', ic: '🌡️' },
    ],
  },
  generator_monitor: {
    label: 'Generator Monitor', icon: '⚡', controllable: true,
    controlLabels: { auto: 'Auto Mode', on: 'Start Generator', off: 'Stop Generator' },
    primary: 'load', primaryUnit: '%', primaryLabel: 'Load',
    alert: { k: 'fuelLevel', low: 15 },
    metrics: [
      { k: 'status', l: 'Status', u: '', ic: '⚡', text: true },
      { k: 'fuelLevel', l: 'Fuel Level', u: '%', ic: '⛽' },
      { k: 'voltage', l: 'Output Voltage', u: 'V', ic: '🔌' },
      { k: 'load', l: 'Load', u: '%', ic: '📊' },
      { k: 'runHours', l: 'Run Hours', u: 'h', ic: '⏱️' },
      { k: 'temp', l: 'Engine Temp', u: '°C', ic: '🌡️' },
    ],
  },
};

// Assign palette colors to each type
const DEVICE_TYPES = Object.fromEntries(
  Object.entries(TYPES_RAW).map(([key, val], i) => {
    const p = PALETTE[i % PALETTE.length];
    return [key, { ...val, color: p.c, bg: p.b }];
  })
);

/**
 * Get type info for a given device type key.
 * Falls back to street_light if key is unknown.
 */
export function getTypeInfo(typeKey) {
  return DEVICE_TYPES[typeKey] || DEVICE_TYPES.street_light;
}

/**
 * Get all type keys as an array.
 */
export function getAllTypeKeys() {
  return Object.keys(DEVICE_TYPES);
}

/**
 * Get all types as an array of { key, ...typeInfo }.
 */
export function getAllTypes() {
  return Object.entries(DEVICE_TYPES).map(([key, val]) => ({ key, ...val }));
}

/**
 * Format a metric value with optional decimal places.
 */
export function fmtVal(val, metricDef) {
  if (val === undefined || val === null) return '—';
  if (metricDef?.text) return String(val);
  const dec = metricDef?.dec ?? 0;
  return Number(val).toFixed(dec);
}

export default DEVICE_TYPES;
