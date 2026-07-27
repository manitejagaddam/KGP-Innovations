import express from 'express'
import jwt from 'jsonwebtoken'
import supabase from '../config/supabase.js'
import { log } from '../middleware/audit.js'

const router = express.Router()

const generateTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { sub: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  )
  const refreshToken = jwt.sign(
    { sub: userId, email, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )
  return { accessToken, refreshToken }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    })

    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Load user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, display_name, role, kgp_id, status, vendor_id')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return res.status(500).json({ error: 'User profile not found — contact administrator' })
    }

    if (profile.status === 'Inactive') {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact your administrator.' })
    }

    const { accessToken, refreshToken } = generateTokens(authData.user.id, email)

    await log({
      userId: profile.id,
      userEmail: email,
      action: 'User Login',
      targetType: 'auth',
      ipAddress: req.ip
    })

    return res.json({
      user: {
        id: profile.id,
        email,
        displayName: profile.display_name,
        role: profile.role,
        kgpId: profile.kgp_id,
        vendorId: profile.vendor_id
      },
      accessToken,
      refreshToken
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/refresh
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

    // Verify user still exists and is active
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
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    await supabase.auth.signOut()
    return res.json({ message: 'Logged out successfully' })
  } catch (err) {
    console.error('Logout error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/auth/me — get current user info from token
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, display_name, role, kgp_id, status, vendor_id, created_at')
      .eq('id', decoded.sub)
      .single()

    if (!profile) return res.status(404).json({ error: 'User not found' })

    return res.json({
      id: profile.id,
      email: decoded.email,
      displayName: profile.display_name,
      role: profile.role,
      kgpId: profile.kgp_id,
      status: profile.status,
      vendorId: profile.vendor_id,
      createdAt: profile.created_at
    })
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    })

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ message: 'Password reset email sent. Please check your inbox.' })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
