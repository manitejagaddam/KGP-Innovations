import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);

// GET / -> list user_profiles
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { role, status, search } = req.query;

    let query = supabase.from('user_profiles').select('*', { count: 'exact' });

    if (role) query = query.eq('role', role);
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    res.json({ data, meta: { total: count, page, limit } });
    res.json({ data, meta: { total: count, page, limit } });
  } catch (err) {
    console.error('GET /api/users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /:id -> single user profile
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
    res.json(data);
  } catch (err) {
    console.error('GET /api/users/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST / -> create user (adminOnly)
router.post('/', adminOnly, async (req, res) => {
  try {
    const { email, password, display_name, role, vendor_id } = req.body;
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    const userId = authData.user.id;
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert([{ id: userId, email, display_name, role, vendor_id }])
      .select()
      .single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    res.status(201).json(profileData);
    res.status(201).json(profileData);
  } catch (err) {
    console.error('POST /api/users error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /:id -> update user profile (adminOnly)
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { display_name, role, status, vendor_id } = req.body;
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ display_name, role, status, vendor_id })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
    res.json(data);
  } catch (err) {
    console.error('PUT /api/users/:id error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /:id -> delete user (adminOnly)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;

    const { error: profileError } = await supabase.from('user_profiles').delete().eq('id', id);
    if (profileError) throw profileError;

    res.status(204).send();
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/users/:id error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// PATCH /:id/status -> toggle Active/Inactive (adminOnly)
router.patch('/:id/status', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: profile, error: getError } = await supabase
      .from('user_profiles')
      .select('status')
      .eq('id', id)
      .single();

    if (getError) throw getError;

    const newStatus = profile.status === 'Active' ? 'Inactive' : 'Active';
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
    res.json(data);
  } catch (err) {
    console.error('PATCH /api/users/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

export default router;
