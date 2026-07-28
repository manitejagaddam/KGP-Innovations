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

    // Load user profile with role (select only guaranteed columns)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, display_name, role, status, kgp_id, vendor_id')
      .eq('id', authData.user.id)
      .single()

    let finalProfile = profile;
    
    if (profileError) {
      // If columns don't exist yet (migration not run), try minimal select
      const { data: basicProfile, error: basicErr } = await supabase
        .from('user_profiles')
        .select('id, display_name, role, status')
        .eq('id', authData.user.id)
        .single()
        
      if (basicErr) {
        // If it's PGRST116 (0 rows), the user exists in Auth but has no profile. Auto-create it.
        if (basicErr.code === 'PGRST116' || profileError.code === 'PGRST116') {
          console.log(`Auto-creating missing profile for ${email}`);
          const { data: newProfile, error: insertErr } = await supabase
            .from('user_profiles')
            .insert([{
              id: authData.user.id,
              email: email.toLowerCase().trim(),
              display_name: email.split('@')[0],
              role: 'viewer',
              status: 'active'
            }])
            .select('id, display_name, role, status')
            .single()
            
          if (insertErr || !newProfile) {
            console.error('Auto-create insert error:', insertErr);
            return res.status(500).json({ error: 'User profile missing and auto-creation failed: ' + (insertErr?.message || 'unknown error') })
          }
          finalProfile = { ...newProfile, kgp_id: null, vendor_id: null };
        } else {
          return res.status(500).json({ error: 'User profile not found — contact administrator' })
        }
      } else {
        finalProfile = { ...basicProfile, kgp_id: null, vendor_id: null };
      }
    }

    if (!finalProfile) {
      return res.status(500).json({ error: 'User profile not found — contact administrator' })
    }

    if (finalProfile.status === 'Inactive') {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact your administrator.' })
    }

    const { accessToken, refreshToken } = generateTokens(authData.user.id, email)

    await log({
      userId: finalProfile.id,
      userEmail: email,
      action: 'User Login',
      targetType: 'auth',
      ipAddress: req.ip
    })

    return res.json({
      user: {
        id: finalProfile.id,
        email,
        displayName: finalProfile.display_name,
        role: finalProfile.role || 'viewer',
        kgpId: finalProfile.kgp_id,
        vendorId: finalProfile.vendor_id
      },
      accessToken,
      refreshToken
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }

    // 1. Create user in Supabase Auth using admin API (bypasses rate limits and email confirmation)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        display_name: name
      }
    })

    if (authError) {
      console.error('Supabase Admin CreateUser Error:', authError)
      return res.status(400).json({ error: authError.message })
    }

    const userId = authData.user?.id
    if (!userId) {
      return res.status(500).json({ error: 'User creation failed' })
    }

    // 2. Insert into user_profiles
    // For testing purposes, auto-assign roles based on the email address
    let assignedRole = 'Viewer';
    if (email.toLowerCase().includes('admin')) {
      assignedRole = 'Admin';
    } else if (email.toLowerCase().includes('vendor')) {
      assignedRole = 'Vendor';
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: userId,
          email: email.toLowerCase().trim(),
          display_name: name,
          role: assignedRole, 
          status: 'active'
        }
      ])

    if (profileError) {
      // Best effort cleanup if profile insert fails
      console.error('Profile creation failed:', profileError)
      await supabase.auth.admin.deleteUser(userId) // Clean up orphaned auth user
      return res.status(500).json({ error: 'Failed to create user profile' })
    }

    // Generate our backend JWT tokens to login immediately
    const { accessToken, refreshToken } = generateTokens(userId, email)

    await log({
      userId: userId,
      userEmail: email,
      action: 'User Registered',
      targetType: 'auth',
      ipAddress: req.ip
    })

    return res.status(201).json({
      user: {
        id: userId,
        email,
        displayName: name,
        role: assignedRole,
        status: 'active'
      },
      accessToken,
      refreshToken
    })
  } catch (err) {
    console.error('Registration error:', err)
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
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Try full select first, fallback to minimal if columns missing
    let profile;
    const { data: fullProfile, error: fullErr } = await supabase
      .from('user_profiles')
      .select('id, display_name, role, kgp_id, status, vendor_id, created_at')
      .eq('id', decoded.sub)
      .single()

    if (fullErr) {
      const { data: basicProfile, error: basicErr } = await supabase
        .from('user_profiles')
        .select('id, display_name, role, status, created_at')
        .eq('id', decoded.sub)
        .single()
      if (basicErr || !basicProfile) return res.status(404).json({ error: 'User not found' })
      profile = { ...basicProfile, kgp_id: null, vendor_id: null }
    } else {
      profile = fullProfile
    }

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
    console.error('/me error:', err)
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
