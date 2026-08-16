import express from 'express'
import supabase from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { adminOnly } from '../middleware/rbac.js'

const router = express.Router()
router.use(authenticate)

// GET /api/audit_logs — Admin only, paginated
router.get('/', adminOnly, async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1
    const limit  = parseInt(req.query.limit) || 50
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        user_email,
        action,
        target_type,
        target_id,
        reason,
        ip_address,
        created_at,
        user_profiles ( display_name )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const mapped = data.map(entry => ({
      id:          entry.id,
      created_at:  entry.created_at,
      user_email:  entry.user_email || entry.user_profiles?.display_name || 'System',
      display_name: entry.user_profiles?.display_name || null,
      action:      entry.action,
      target_type: entry.target_type || 'system',
      target_id:   entry.target_id  || '',
      reason:      entry.reason     || '',
      ip_address:  entry.ip_address || ''
    }))

    return res.json({ data: mapped, meta: { total: count, page, limit } })
  } catch (err) {
    console.error('GET /api/audit_logs error:', err)
    return res.status(500).json({ error: 'Failed to fetch audit logs' })
  }
})

export default router
