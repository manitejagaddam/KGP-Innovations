import jwt from 'jsonwebtoken'
import supabase from '../config/supabase.js'

/**
 * JWT Authentication Middleware
 * Verifies the Bearer token from Authorization header,
 * loads the user profile from Supabase, and attaches it to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.split(' ')[1]

    // Verify our custom JWT
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
      }
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Load user profile from Supabase to get latest role/status
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, display_name, role, kgp_id, status, vendor_id')
      .eq('id', decoded.sub)
      .single()

    if (error || !profile) {
      return res.status(401).json({ error: 'User not found' })
    }

    if (profile.status === 'Inactive') {
      return res.status(403).json({ error: 'Account is deactivated' })
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: profile.role,
      kgpId: profile.kgp_id,
      displayName: profile.display_name,
      vendorId: profile.vendor_id
    }

    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    res.status(500).json({ error: 'Internal server error during authentication' })
  }
}
