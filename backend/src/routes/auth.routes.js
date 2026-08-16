import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import supabase from '../config/supabase.js'
import { log } from '../middleware/audit.js'

const router = express.Router()

// ── Helpers ──────────────────────────────────────────────────────────────────
const generateTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { sub: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  )
  const refreshToken = jwt.sign(
    { sub: userId, email, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )
  return { accessToken, refreshToken }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // 1. Fetch user from user_profiles
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, email, password_hash, display_name, role, status, kgp_id, vendor_id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !profile) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    if (profile.status === 'Inactive') {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact your administrator.' })
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, profile.password_hash)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // 3. Generate tokens
    const { accessToken, refreshToken } = generateTokens(profile.id, profile.email)
    await log({ userId: profile.id, userEmail: profile.email, action: 'User Login', targetType: 'auth', ipAddress: req.ip })

    return res.json({
      user: {
        id:          profile.id,
        email:       profile.email,
        displayName: profile.display_name,
        role:        profile.role,
        kgpId:       profile.kgp_id,
        vendorId:    profile.vendor_id
      },
      accessToken,
      refreshToken
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }

    // Check if email exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()
    
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }

    const validRoles = ['Admin', 'Vendor', 'User']
    const assignedRole = validRoles.includes(role) ? role : 'User'

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const password_hash = await bcrypt.hash(password, salt)

    // Generate KGP ID
    const rolePrefix = assignedRole === 'Admin' ? 'KGPA' : assignedRole === 'Vendor' ? 'KGPV' : 'KGPU'
    const { count } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', assignedRole)
    const kgp_id = `${rolePrefix}${String((count || 0) + 1).padStart(5, '0')}`

    // Insert user
    const { data: newProfile, error } = await supabase
      .from('user_profiles')
      .insert([{
        email:         email.toLowerCase().trim(),
        password_hash: password_hash,
        display_name:  name,
        role:          assignedRole,
        kgp_id:        kgp_id,
        status:        'Active'
      }])
      .select('id, email, display_name, role, status, kgp_id, vendor_id')
      .single()

    if (error || !newProfile) {
      console.error('Registration failed:', error)
      return res.status(500).json({ error: 'Failed to register user' })
    }

    const { accessToken, refreshToken } = generateTokens(newProfile.id, newProfile.email)
    await log({ userId: newProfile.id, userEmail: newProfile.email, action: 'User Registered', targetType: 'auth', ipAddress: req.ip })

    return res.status(201).json({
      user: {
        id:          newProfile.id,
        email:       newProfile.email,
        displayName: newProfile.display_name,
        role:        newProfile.role,
        kgpId:       newProfile.kgp_id,
        vendorId:    newProfile.vendor_id
      },
      accessToken,
      refreshToken
    })
  } catch (err) {
    console.error('Registration error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' })

    let decoded
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Not a refresh token' })
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, status')
      .eq('id', decoded.sub)
      .single()

    if (error || !profile || profile.status === 'Inactive') {
      return res.status(401).json({ error: 'User not found or deactivated' })
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.sub, decoded.email)
    return res.json({ accessToken, refreshToken: newRefreshToken })
  } catch (err) {
    console.error('Refresh error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  return res.json({ message: 'Logged out successfully' })
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
      }
      return res.status(401).json({ error: 'Invalid token' })
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, email, display_name, role, kgp_id, status, vendor_id, created_at')
      .eq('id', decoded.sub)
      .single()

    if (error || !profile) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json({
      id:          profile.id,
      email:       profile.email,
      displayName: profile.display_name,
      role:        profile.role,
      kgpId:       profile.kgp_id,
      status:      profile.status,
      vendorId:    profile.vendor_id,
      createdAt:   profile.created_at
    })
  } catch (err) {
    console.error('/me error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
