import supabase from '../config/supabase.js'

/**
 * Write an entry to the audit_logs table
 */
export const log = async ({ userId, userEmail, action, targetType, targetId, reason, metadata = {}, ipAddress }) => {
  try {
    await supabase.from('audit_logs').insert([{
      user_id: userId || null,
      user_email: userEmail || null,
      action,
      target_type: targetType || null,
      target_id: targetId ? String(targetId) : null,
      reason: reason || null,
      metadata,
      ip_address: ipAddress || null
    }])
  } catch (err) {
    console.error('Failed to write audit log:', err)
  }
}
