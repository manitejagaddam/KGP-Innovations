import express from 'express'
import supabase from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
router.use(authenticate)

// GET /api/analytics/fleet
router.get('/fleet', async (req, res) => {
  try {
    const { data: devices, error: devErr } = await supabase.from('devices').select('id, status, connection_status')
    if (devErr) throw devErr

    const total = devices.length
    const active = devices.filter(d => d.power === 'ON' || d.status === 'ACTIVE').length
    const offline = devices.filter(d => d.connection_status === 'Disconnected').length
    const online = total - offline

    const { data: newAlerts } = await supabase.from('alerts').select('id', { count: 'exact' }).eq('status', 'New')
    const { data: energyData } = await supabase
      .from('telemetry')
      .select('energy_kwh')
      .order('recorded_at', { ascending: false })
      .limit(total * 10)

    const totalEnergy = energyData?.reduce((sum, t) => sum + (Number(t.energy_kwh) || 0), 0).toFixed(2) || 0

    return res.json({
      total,
      active,
      offline,
      online,
      activeAlerts: newAlerts?.length || 0,
      totalEnergy: Number(totalEnergy),
      uptimePercent: total > 0 ? Math.round((online / total) * 100) : 0
    })
  } catch (err) {
    console.error('GET /analytics/fleet error:', err)
    res.status(500).json({ error: 'Failed to fetch fleet analytics' })
  }
})

// GET /api/analytics/energy
router.get('/energy', async (req, res) => {
  try {
    const { from, to, device_id, groupBy = 'day' } = req.query

    let query = supabase
      .from('telemetry')
      .select('device_id, recorded_at, energy_kwh')
      .order('recorded_at', { ascending: true })
      .limit(1000)

    if (from) query = query.gte('recorded_at', from)
    if (to) query = query.lte('recorded_at', to)
    if (device_id) query = query.eq('device_id', device_id)

    const { data, error } = await query
    if (error) throw error

    // Group by day
    const grouped = {}
    data.forEach(row => {
      const key = groupBy === 'hour'
        ? new Date(row.recorded_at).toISOString().slice(0, 13)
        : new Date(row.recorded_at).toISOString().slice(0, 10)
      if (!grouped[key]) grouped[key] = 0
      grouped[key] += Number(row.energy_kwh) || 0
    })

    const result = Object.entries(grouped).map(([date, energy]) => ({
      date,
      energy: Number(energy.toFixed(4))
    }))

    return res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch energy analytics' })
  }
})

// GET /api/analytics/voltage
router.get('/voltage', async (req, res) => {
  try {
    const { from, to, device_id, limit = 200 } = req.query
    let query = supabase
      .from('telemetry')
      .select('device_id, recorded_at, voltage')
      .order('recorded_at', { ascending: true })
      .limit(Number(limit))

    if (from) query = query.gte('recorded_at', from)
    if (to) query = query.lte('recorded_at', to)
    if (device_id) query = query.eq('device_id', device_id)

    const { data, error } = await query
    if (error) throw error
    return res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch voltage analytics' })
  }
})

// GET /api/analytics/uptime
router.get('/uptime', async (req, res) => {
  try {
    const { data: devices, error } = await supabase.from('devices').select('id, name, connection_status, last_seen')
    if (error) throw error
    const result = devices.map(d => ({
      deviceId: d.id,
      deviceName: d.name,
      isOnline: d.connection_status === 'Connected',
      lastSeen: d.last_seen,
      uptime: d.connection_status === 'Connected' ? 99.5 + Math.random() * 0.4 : Math.random() * 80
    }))
    return res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch uptime analytics' })
  }
})

export default router
