import express from 'express'
import supabase from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { adminOnly } from '../middleware/rbac.js'
import { log } from '../middleware/audit.js'

const router = express.Router()
router.use(authenticate)

// ── ALERT RULES (must be declared BEFORE /:id to avoid route conflict) ────────

// GET /api/alerts/rules
router.get('/rules', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alert_rules')
      .select('*')
      .order('created_at')
    if (error) throw error
    return res.json(data)
  } catch (err) {
    console.error('GET /api/alerts/rules error:', err)
    return res.status(500).json({ error: 'Failed to fetch alert rules' })
  }
})

// POST /api/alerts/rules
router.post('/rules', adminOnly, async (req, res) => {
  try {
    const { name, metric, condition, threshold, severity, notify_email, notify_sms } = req.body
    if (!name || !metric || !condition || !threshold) {
      return res.status(400).json({ error: 'name, metric, condition, and threshold are required' })
    }
    const validConditions = ['>', '<', '>=', '<=', '==']
    if (!validConditions.includes(condition)) {
      return res.status(400).json({ error: `condition must be one of: ${validConditions.join(', ')}` })
    }
    const { data, error } = await supabase
      .from('alert_rules')
      .insert([{ name, metric, condition, threshold, severity, notify_email, notify_sms }])
      .select()
      .single()
    if (error) throw error
    return res.status(201).json(data)
  } catch (err) {
    console.error('POST /api/alerts/rules error:', err)
    return res.status(500).json({ error: 'Failed to create alert rule' })
  }
})

// PUT /api/alerts/rules/:ruleId
router.put('/rules/:ruleId', adminOnly, async (req, res) => {
  try {
    const { name, metric, condition, threshold, severity, notify_email, notify_sms } = req.body
    const { data, error } = await supabase
      .from('alert_rules')
      .update({ name, metric, condition, threshold, severity, notify_email, notify_sms })
      .eq('id', req.params.ruleId)
      .select()
      .single()
    if (error) throw error
    return res.json(data)
  } catch (err) {
    console.error('PUT /api/alerts/rules/:ruleId error:', err)
    return res.status(500).json({ error: 'Failed to update alert rule' })
  }
})

// DELETE /api/alerts/rules/:ruleId
router.delete('/rules/:ruleId', adminOnly, async (req, res) => {
  try {
    const { error } = await supabase
      .from('alert_rules')
      .delete()
      .eq('id', req.params.ruleId)
    if (error) throw error
    return res.json({ message: 'Alert rule deleted' })
  } catch (err) {
    console.error('DELETE /api/alerts/rules/:ruleId error:', err)
    return res.status(500).json({ error: 'Failed to delete alert rule' })
  }
})

// PATCH /api/alerts/rules/:ruleId/toggle
router.patch('/rules/:ruleId/toggle', adminOnly, async (req, res) => {
  try {
    const { data: current } = await supabase
      .from('alert_rules')
      .select('enabled')
      .eq('id', req.params.ruleId)
      .single()
    if (!current) return res.status(404).json({ error: 'Rule not found' })

    const { data, error } = await supabase
      .from('alert_rules')
      .update({ enabled: !current.enabled })
      .eq('id', req.params.ruleId)
      .select()
      .single()
    if (error) throw error
    return res.json(data)
  } catch (err) {
    console.error('PATCH /api/alerts/rules/:ruleId/toggle error:', err)
    return res.status(500).json({ error: 'Failed to toggle alert rule' })
  }
})

// ── ALERTS ───────────────────────────────────────────────────────────────────

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const { status, severity, device_id, from, to, page = 1, limit = 50 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = supabase
      .from('alerts')
      .select('*, devices(id, name, location)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (status && status !== 'All') query = query.eq('status', status)
    if (severity)  query = query.eq('severity', severity)
    if (device_id) query = query.eq('device_id', device_id)
    if (from)      query = query.gte('created_at', from)
    if (to)        query = query.lte('created_at', to)

    const { data, error, count } = await query
    if (error) throw error

    return res.json({ alerts: data, total: count, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    console.error('GET /api/alerts error:', err)
    return res.status(500).json({ error: 'Failed to fetch alerts' })
  }
})

// GET /api/alerts/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*, devices(id, name, location)')
      .eq('id', req.params.id)
      .single()
    if (error || !data) return res.status(404).json({ error: 'Alert not found' })
    return res.json(data)
  } catch (err) {
    console.error('GET /api/alerts/:id error:', err)
    return res.status(500).json({ error: 'Failed to fetch alert' })
  }
})

// PUT /api/alerts/:id — acknowledge or resolve
router.put('/:id', async (req, res) => {
  try {
    const { status, reason } = req.body
    const validStatuses = ['Acknowledged', 'Resolved']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` })
    }

    const updates = {
      status,
      resolved_by:     status === 'Resolved' ? req.user.id : null,
      resolved_at:     status === 'Resolved' ? new Date().toISOString() : null,
      resolved_reason: status === 'Resolved' ? (reason || null) : null
    }

    const { data, error } = await supabase
      .from('alerts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error

    await log({
      userId: req.user.id, userEmail: req.user.email,
      action: `Alert ${status}`, targetType: 'alert',
      targetId: req.params.id, reason, ipAddress: req.ip
    })
    return res.json(data)
  } catch (err) {
    console.error('PUT /api/alerts/:id error:', err)
    return res.status(500).json({ error: 'Failed to update alert' })
  }
})

// DELETE /api/alerts/:id
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { error } = await supabase.from('alerts').delete().eq('id', req.params.id)
    if (error) throw error
    return res.json({ message: 'Alert deleted' })
  } catch (err) {
    console.error('DELETE /api/alerts/:id error:', err)
    return res.status(500).json({ error: 'Failed to delete alert' })
  }
})

export default router
