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
    let finalProfile = profile;
    if (error) {
      const { data: basicProfile, error: basicErr } = await supabase
        .from('user_profiles')
        .select('id, display_name, role, status')
        .eq('id', decoded.sub)
        .single()
      
      if (basicErr || !basicProfile) {
        return res.status(401).json({ error: 'User not found' })
      }
      finalProfile = { ...basicProfile, kgp_id: null, vendor_id: null };
    }

    if (!finalProfile) {
      return res.status(401).json({ error: 'User not found' })
    }

    if (finalProfile.status === 'Inactive') {
      return res.status(403).json({ error: 'Account is deactivated' })
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: finalProfile.role,
      kgpId: finalProfile.kgp_id,
      displayName: finalProfile.display_name,
      vendorId: finalProfile.vendor_id
    }

    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    res.status(500).json({ error: 'Internal server error during authentication' })
  }
}
