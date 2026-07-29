import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);

// GET /api/audit_logs -> list audit logs (Admin only)
router.get('/', adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('audit_logs')
      .select(`
        id, 
        action, 
        details, 
        ip_address, 
        created_at,
        user_id,
        user_profiles(display_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const mapped = data.map(log => ({
      id: log.id,
      created_at: log.created_at,
      user_email: log.user_profiles?.email || log.details?.userEmail || 'System',
      action: log.action,
      target_type: log.details?.targetType || 'system',
      target_id: log.details?.targetId || '',
      reason: log.details?.reason || '',
      ip_address: log.ip_address || log.details?.ipAddress || ''
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
