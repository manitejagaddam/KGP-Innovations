import supabase from '../config/supabase.js'

/**
 * Write an entry to the audit_logs table.
 * Writes to individual columns — NOT to a JSONB "details" blob.
 * Non-blocking: errors are swallowed so they never crash the calling route.
 */
export const log = async ({ userId, userEmail, action, targetType, targetId, reason, ipAddress } = {}) => {
  try {
    const { error } = await supabase.from('audit_logs').insert([{
      user_id:     userId     || null,
      user_email:  userEmail  || null,
      action:      action     || 'UNKNOWN',
      target_type: targetType || null,
      target_id:   targetId   ? String(targetId) : null,
      reason:      reason     || null,
      ip_address:  ipAddress  || null
    }])
    if (error) {
      console.warn('⚠️  Audit log insert warning:', error.message)
    }
  } catch (err) {
    // Never crash the calling route
    console.warn('⚠️  Audit log failed silently:', err.message)
  }
}
