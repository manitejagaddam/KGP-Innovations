import express from 'express'
import supabase from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { adminOnly } from '../middleware/rbac.js'
import { log } from '../middleware/audit.js'

const router = express.Router()
router.use(authenticate)

// GET /api/automations
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('automations').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch automations' })
  }
})

// POST /api/automations
router.post('/', adminOnly, async (req, res) => {
  try {
    const { name, trigger_type, trigger_condition, action, target_devices, enabled } = req.body
    if (!name || !trigger_type || !action) {
      return res.status(400).json({ error: 'name, trigger_type, and action are required' })
    }
    const { data, error } = await supabase.from('automations').insert([{ name, trigger_type, trigger_condition, action, target_devices, enabled }]).select().single()
    if (error) throw error
    await log({ userId: req.user.id, userEmail: req.user.email, action: 'Automation Created', targetType: 'automation', targetId: data.id, ipAddress: req.ip })
    return res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create automation' })
  }
})

// PUT /api/automations/:id
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { name, trigger_type, trigger_condition, action, target_devices, enabled } = req.body
    const { data, error } = await supabase.from('automations').update({ name, trigger_type, trigger_condition, action, target_devices, enabled }).eq('id', req.params.id).select().single()
    if (error) throw error
    return res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update automation' })
  }
})

// DELETE /api/automations/:id
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { error } = await supabase.from('automations').delete().eq('id', req.params.id)
    if (error) throw error
    await log({ userId: req.user.id, userEmail: req.user.email, action: 'Automation Deleted', targetType: 'automation', targetId: req.params.id, ipAddress: req.ip })
    return res.json({ message: 'Automation deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete automation' })
  }
})

// PATCH /api/automations/:id/toggle
router.patch('/:id/toggle', adminOnly, async (req, res) => {
  try {
    const { data: current } = await supabase.from('automations').select('enabled, name').eq('id', req.params.id).single()
    if (!current) return res.status(404).json({ error: 'Automation not found' })
    const { data, error } = await supabase.from('automations').update({ enabled: !current.enabled }).eq('id', req.params.id).select().single()
    if (error) throw error
    await log({ userId: req.user.id, userEmail: req.user.email, action: `Automation ${data.enabled ? 'Enabled' : 'Disabled'}: ${current.name}`, targetType: 'automation', targetId: req.params.id, ipAddress: req.ip })
    return res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle automation' })
  }
})

export default router
