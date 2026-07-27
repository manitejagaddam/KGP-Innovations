import supabase from '../config/supabase.js'

/**
 * Write an entry to the audit_logs table
 * Non-blocking — errors are swallowed so they never crash routes
 */
export const log = async ({ userId, userEmail, action, targetType, targetId, reason, ipAddress }) => {
  try {
    // Try with all extended fields first (requires migration to have run)
    const { error } = await supabase.from('audit_logs').insert([{
      user_id: userId || null,
      action: action || 'UNKNOWN',
      details: {
        userEmail: userEmail || null,
        targetType: targetType || null,
        targetId: targetId ? String(targetId) : null,
        reason: reason || null,
        ipAddress: ipAddress || null
      },
      ip_address: ipAddress || null
    }])
    if (error) {
      // Silently ignore — audit log is non-critical
      console.warn('Audit log insert warning:', error.message)
    }
  } catch (err) {
    // Never crash the calling route
    console.warn('Audit log failed silently:', err.message)
  }
}
