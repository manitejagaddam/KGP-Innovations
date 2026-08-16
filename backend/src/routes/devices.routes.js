import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import supabase from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { adminOnly, adminOrVendor } from '../middleware/rbac.js'
import { log } from '../middleware/audit.js'
import { publish } from '../config/mqtt.js'

const router = express.Router()
router.use(authenticate)

// ── GET / — list devices filtered by role ─────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query
    const offset   = (parseInt(page) - 1) * parseInt(limit)
    const userRole = (req.user.role || '').toLowerCase()

    // User role: only see devices explicitly assigned to them
    if (userRole === 'user') {
      const { data: userDevices, error: udErr } = await supabase
        .from('user_devices')
        .select('device_id')
        .eq('user_id', req.user.id)

      if (udErr) throw udErr
      const deviceIds = (userDevices || []).map(ud => ud.device_id)
      if (deviceIds.length === 0) return res.json({ data: [], meta: { total: 0, page: parseInt(page), limit: parseInt(limit) } })

      let query = supabase
        .from('devices')
        .select('*, device_schedules(*)', { count: 'exact' })
        .in('id', deviceIds)
      if (status) query = query.eq('status', status)

      const { data, error, count } = await query.range(offset, offset + parseInt(limit) - 1)
      if (error) throw error
      return res.json({ data, meta: { total: count, page: parseInt(page), limit: parseInt(limit) } })
    }

    // Vendor role: only their vendor's approved devices
    let query = supabase.from('devices').select('*, device_schedules(*)', { count: 'exact' })

    if (userRole === 'vendor') {
      if (!req.user.vendorId) {
        return res.json({ data: [], meta: { total: 0, page: parseInt(page), limit: parseInt(limit) } })
      }
      query = query.eq('vendor_id', req.user.vendorId).eq('approval_status', 'approved')
    } else {
      // Admin: all devices, including pending
      // No filter — admin sees everything
    }

    if (status) query = query.eq('status', status)
    const { data, error, count } = await query.range(offset, offset + parseInt(limit) - 1)
    if (error) throw error

    return res.json({ data, meta: { total: count, page: parseInt(page), limit: parseInt(limit) } })
  } catch (err) {
    console.error('GET /api/devices error:', err)
    return res.status(500).json({ error: 'Failed to fetch devices' })
  }
})

// ── GET /pending — pending devices awaiting approval (Admin only) ──────────────
router.get('/pending', adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*, vendors(name)')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return res.json(data)
  } catch (err) {
    console.error('GET /api/devices/pending error:', err)
    return res.status(500).json({ error: 'Failed to fetch pending devices' })
  }
})

// ── GET /:id — single device with latest telemetry ───────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*, device_schedules(*), vendors(name)')
      .eq('id', id)
      .single()

    if (deviceError || !device) return res.status(404).json({ error: 'Device not found' })

    // Access control
    const userRole = (req.user.role || '').toLowerCase()
    if (userRole === 'vendor' && device.vendor_id !== req.user.vendorId) {
      return res.status(403).json({ error: 'Access denied' })
    }
    if (userRole === 'user') {
      const { data: ud } = await supabase
        .from('user_devices')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('device_id', id)
        .single()
      if (!ud) return res.status(403).json({ error: 'Access denied' })
    }

    // Latest telemetry — uses recorded_at (the correct column name)
    const { data: telemetry } = await supabase
      .from('telemetry')
      .select('*')
      .eq('device_id', id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()

    return res.json({ ...device, latest_telemetry: telemetry || null })
  } catch (err) {
    console.error('GET /api/devices/:id error:', err)
    return res.status(500).json({ error: 'Failed to fetch device' })
  }
})

// ── POST / — create device ────────────────────────────────────────────────────
// Admin: device is immediately approved
// Vendor: device is submitted as pending for Admin approval
router.post('/', adminOrVendor, async (req, res) => {
  try {
    const { name, location, lat, lng, type, mqtt_topic, connectivity, vendor_id } = req.body

    if (!name) return res.status(400).json({ error: 'Device name is required' })

    const isAdmin = req.user.role === 'Admin'

    if (req.user.role === 'Vendor' && !req.user.vendorId) {
      return res.status(403).json({ error: 'You are not assigned to a vendor group' })
    }

    const resolvedVendorId = isAdmin ? (vendor_id || null) : req.user.vendorId
    const topicSlug = mqtt_topic || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const devicePayload = {
      // No id field — let Postgres generate a UUID
      name,
      location:         location   || null,
      lat:              lat        ? parseFloat(lat) : null,
      lng:              lng        ? parseFloat(lng) : null,
      type:             type       || 'Street Light',
      connectivity:     connectivity || 'WiFi',
      vendor_id:        resolvedVendorId,
      approval_status:  isAdmin ? 'approved' : 'pending',
      mqtt_topic:       topicSlug,
      // api_key and device_secret are auto-generated by the DB default
    }

    const { data, error } = await supabase
      .from('devices')
      .insert([devicePayload])
      .select()
      .single()

    if (error) {
      console.error('Device insert error:', error)
      return res.status(500).json({ error: error.message })
    }

    await log({
      userId:     req.user.id,
      userEmail:  req.user.email,
      action:     isAdmin ? 'CREATE_DEVICE' : 'REQUEST_DEVICE_APPROVAL',
      targetId:   data.id,
      targetType: 'device',
      ipAddress:  req.ip
    })

    return res.status(201).json({
      ...data,
      message: isAdmin ? 'Device created successfully' : 'Device submitted for admin approval'
    })
  } catch (err) {
    console.error('POST /api/devices error:', err)
    return res.status(500).json({ error: 'Failed to create device' })
  }
})

// ── PUT /:id/approve — approve or reject pending device (Admin only) ──────────
router.put('/:id/approve', adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { action } = req.body   // 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approve" or "reject"' })
    }

    const approval_status = action === 'approve' ? 'approved' : 'rejected'
    const { data, error } = await supabase
      .from('devices')
      .update({ approval_status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await log({
      userId:     req.user.id,
      userEmail:  req.user.email,
      action:     action === 'approve' ? 'APPROVE_DEVICE' : 'REJECT_DEVICE',
      targetId:   id,
      targetType: 'device',
      ipAddress:  req.ip
    })

    return res.json(data)
  } catch (err) {
    console.error('PUT /api/devices/:id/approve error:', err)
    return res.status(500).json({ error: 'Failed to update device approval' })
  }
})

// ── PUT /:id — update device metadata ────────────────────────────────────────
router.put('/:id', adminOrVendor, async (req, res) => {
  try {
    const { id } = req.params

    // Vendors can only update their own devices
    if (req.user.role === 'Vendor') {
      const { data: existing } = await supabase.from('devices').select('vendor_id').eq('id', id).single()
      if (!existing || existing.vendor_id !== req.user.vendorId) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    // Strip protected fields that shouldn't be updated via this endpoint
    const { approval_status, api_key, device_secret, id: _id, ...safeUpdates } = req.body

    const { data, error } = await supabase
      .from('devices')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await log({ userId: req.user.id, userEmail: req.user.email, action: 'UPDATE_DEVICE', targetId: id, targetType: 'device', ipAddress: req.ip })
    return res.json(data)
  } catch (err) {
    console.error('PUT /api/devices/:id error:', err)
    return res.status(500).json({ error: 'Failed to update device' })
  }
})

// ── DELETE /:id — delete device (Admin only) ─────────────────────────────────
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabase.from('devices').delete().eq('id', id)
    if (error) throw error

    await log({ userId: req.user.id, userEmail: req.user.email, action: 'DELETE_DEVICE', targetId: id, targetType: 'device', ipAddress: req.ip })
    return res.status(204).send()
  } catch (err) {
    console.error('DELETE /api/devices/:id error:', err)
    return res.status(500).json({ error: 'Failed to delete device' })
  }
})

// ── POST /:id/command — send power command via MQTT ──────────────────────────
router.post('/:id/command', adminOrVendor, async (req, res) => {
  try {
    const { id } = req.params
    const { power, reason } = req.body

    if (!['ON', 'OFF'].includes(power)) {
      return res.status(400).json({ error: 'power must be "ON" or "OFF"' })
    }

    const { data: device, error } = await supabase
      .from('devices')
      .select('mqtt_topic, vendor_id')
      .eq('id', id)
      .single()

    if (error || !device) return res.status(404).json({ error: 'Device not found' })

    if (req.user.role === 'Vendor' && device.vendor_id !== req.user.vendorId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const topic = `devices/${device.mqtt_topic}/command`
    publish(topic, JSON.stringify({ power }))

    // Optimistically update power state in DB
    await supabase.from('devices').update({ power }).eq('id', id)

    await log({ userId: req.user.id, userEmail: req.user.email, action: 'POWER_COMMAND', targetId: id, targetType: 'device', reason: reason || `Power ${power}`, ipAddress: req.ip })
    return res.json({ message: `Command ${power} dispatched to ${device.mqtt_topic}` })
  } catch (err) {
    console.error('POST /api/devices/:id/command error:', err)
    return res.status(500).json({ error: 'Failed to dispatch command' })
  }
})

// ── PUT /:id/schedule — upsert device schedule ───────────────────────────────
router.put('/:id/schedule', adminOrVendor, async (req, res) => {
  try {
    const { id } = req.params
    const { turn_on_time, turn_off_time, days_active, is_active } = req.body

    const { data, error } = await supabase
      .from('device_schedules')
      .upsert({
        device_id:    id,
        turn_on_time:  turn_on_time  || '18:00',
        turn_off_time: turn_off_time || '06:00',
        days_active:   days_active   || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        is_active:     is_active !== undefined ? is_active : true
      }, { onConflict: 'device_id' })
      .select()
      .single()

    if (error) throw error
    return res.json(data)
  } catch (err) {
    console.error('PUT /api/devices/:id/schedule error:', err)
    return res.status(500).json({ error: 'Failed to update schedule' })
  }
})

// ── GET /:id/telemetry — historical telemetry ─────────────────────────────────
router.get('/:id/telemetry', async (req, res) => {
  try {
    const { id } = req.params
    const { from, to, limit = 100 } = req.query

    // Uses recorded_at — the correct column name in the schema
    let query = supabase
      .from('telemetry')
      .select('*')
      .eq('device_id', id)
      .order('recorded_at', { ascending: false })
      .limit(parseInt(limit))

    if (from) query = query.gte('recorded_at', from)
    if (to)   query = query.lte('recorded_at', to)

    const { data, error } = await query
    if (error) throw error
    return res.json(data)
  } catch (err) {
    console.error('GET /api/devices/:id/telemetry error:', err)
    return res.status(500).json({ error: 'Failed to fetch telemetry' })
  }
})

// ── GET /:id/logs — audit logs for a device ───────────────────────────────────
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('target_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return res.json(data)
  } catch (err) {
    console.error('GET /api/devices/:id/logs error:', err)
    return res.status(500).json({ error: 'Failed to fetch device logs' })
  }
})

export default router
