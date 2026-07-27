import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import supabase from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { adminOnly } from '../middleware/rbac.js'
import { log } from '../middleware/audit.js'

const router = express.Router()
router.use(authenticate)

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('settings').select('*').limit(1).single()
    if (error) throw error
    return res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// PUT /api/settings
router.put('/', adminOnly, async (req, res) => {
  try {
    const { org_name, org_timezone, notify_email, notify_sms, notify_push, alert_email_to, telemetry_retention_days } = req.body
    const { data: current } = await supabase.from('settings').select('id').limit(1).single()
    if (!current) return res.status(404).json({ error: 'Settings not initialized' })
    const { data, error } = await supabase
      .from('settings')
      .update({ org_name, org_timezone, notify_email, notify_sms, notify_push, alert_email_to, telemetry_retention_days, updated_at: new Date().toISOString() })
      .eq('id', current.id)
      .select()
      .single()
    if (error) throw error
    await log({ userId: req.user.id, userEmail: req.user.email, action: 'Settings Updated', targetType: 'settings', ipAddress: req.ip })
    return res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// POST /api/settings/regenerate-key
router.post('/regenerate-key', adminOnly, async (req, res) => {
  try {
    const newApiKey = `kgp_live_${uuidv4().replace(/-/g, '').slice(0, 24)}`
    const { data: current } = await supabase.from('settings').select('id').limit(1).single()
    const { data, error } = await supabase.from('settings').update({ api_key: newApiKey }).eq('id', current.id).select('api_key').single()
    if (error) throw error
    await log({ userId: req.user.id, userEmail: req.user.email, action: 'API Key Regenerated', targetType: 'settings', ipAddress: req.ip })
    return res.json({ api_key: data.api_key })
  } catch (err) {
    res.status(500).json({ error: 'Failed to regenerate API key' })
  }
})

export default router
