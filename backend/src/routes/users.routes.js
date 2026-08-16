import express from 'express'
import supabase from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { adminOnly } from '../middleware/rbac.js'

const router = express.Router()
router.use(authenticate)

// GET /api/users — list user_profiles (Admin only)
router.get('/', adminOnly, async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1
    const limit  = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { role, status, search } = req.query

    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })

    if (role)   query = query.eq('role', role)
    if (status) query = query.eq('status', status)
    if (search) {
      // email column now exists in user_profiles
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)
    if (error) throw error

    return res.json({ data, meta: { total: count, page, limit } })
  } catch (err) {
    console.error('GET /api/users error:', err)
    return res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// GET /api/users/:id — single user profile
router.get('/:id', adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'User not found' })
    return res.json(data)
  } catch (err) {
    console.error('GET /api/users/:id error:', err)
    return res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// POST /api/users — create user (Admin only)
router.post('/', adminOnly, async (req, res) => {
  try {
    const { email, password, display_name, role, vendor_id } = req.body

    if (!email || !password || !display_name) {
      return res.status(400).json({ error: 'email, password, and display_name are required' })
    }

    // Check if email already exists
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

    // Hash password (need to import bcrypt at top of file)
    const bcrypt = await import('bcryptjs')
    const salt = await bcrypt.default.genSalt(10)
    const password_hash = await bcrypt.default.hash(password, salt)

    // Generate KGP ID
    const rolePrefix = assignedRole === 'Admin' ? 'KGPA' : assignedRole === 'Vendor' ? 'KGPV' : 'KGPU'
    const { count } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', assignedRole)
    const kgp_id = `${rolePrefix}${String((count || 0) + 1).padStart(5, '0')}`

    const { data: inserted, error: insertErr } = await supabase
      .from('user_profiles')
      .insert([{ 
        email: email.toLowerCase().trim(), 
        password_hash, 
        display_name, 
        role: assignedRole, 
        kgp_id, 
        vendor_id: vendor_id || null, 
        status: 'Active' 
      }])
      .select('id, email, display_name, role, status, kgp_id, vendor_id, created_at')
      .single()

    if (insertErr) throw insertErr

    return res.status(201).json(inserted)
  } catch (err) {
    console.error('POST /api/users error:', err)
    return res.status(500).json({ error: err.message || 'Failed to create user' })
  }
})

// PUT /api/users/:id — update user profile (Admin only)
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { display_name, role, status, vendor_id } = req.body

    const validRoles = ['Admin', 'Vendor', 'User']
    const updates = {}
    if (display_name !== undefined) updates.display_name = display_name
    if (role !== undefined)         updates.role = validRoles.includes(role) ? role : undefined
    if (status !== undefined)       updates.status = ['Active', 'Inactive'].includes(status) ? status : undefined
    if (vendor_id !== undefined)    updates.vendor_id = vendor_id || null

    // Remove undefined keys
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k])

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    return res.json(data)
  } catch (err) {
    console.error('PUT /api/users/:id error:', err)
    return res.status(500).json({ error: 'Failed to update user' })
  }
})

// DELETE /api/users/:id — delete user (Admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id)
      
    if (error) throw error

    return res.status(204).send()
  } catch (err) {
    console.error('DELETE /api/users/:id error:', err)
    return res.status(500).json({ error: 'Failed to delete user' })
  }
})

// PATCH /api/users/:id/status — toggle Active/Inactive (Admin only)
router.patch('/:id/status', adminOnly, async (req, res) => {
  try {
    const { id } = req.params

    const { data: current, error: getError } = await supabase
      .from('user_profiles')
      .select('status')
      .eq('id', id)
      .single()

    if (getError || !current) return res.status(404).json({ error: 'User not found' })

    const newStatus = current.status === 'Active' ? 'Inactive' : 'Active'

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return res.json(data)
  } catch (err) {
    console.error('PATCH /api/users/:id/status error:', err)
    return res.status(500).json({ error: 'Failed to update user status' })
  }
})

export default router
