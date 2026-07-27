import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly, adminOrVendor } from '../middleware/rbac.js';
import { log } from '../middleware/audit.js';
import { publish } from '../config/mqtt.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
router.use(authenticate);

// Helper: build role-based device query
function buildDeviceQuery(user, query) {
  if (user.role === 'Admin') return query; // Admin sees everything
  if (user.role === 'Vendor') return query.eq('vendor_id', user.vendorId).eq('approval_status', 'approved');
  // viewer: filter by user_devices join
  return null; // handled separately
}

// GET / -> list devices filtered by role
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (req.user.role === 'viewer') {
      // Get device IDs assigned to this user
      const { data: userDevices, error: udErr } = await supabase
        .from('user_devices')
        .select('device_id')
        .eq('user_id', req.user.id);
      if (udErr) throw udErr;
      const deviceIds = userDevices.map(ud => ud.device_id);
      if (deviceIds.length === 0) return res.json({ data: [], meta: { total: 0 } });

      let query = supabase.from('devices').select('*, device_schedules(*)', { count: 'exact' }).in('id', deviceIds);
      if (status) query = query.eq('status', status);
      const { data, error, count } = await query.range(offset, offset + parseInt(limit) - 1);
      if (error) throw error;
      return res.json({ data, meta: { total: count, page: parseInt(page), limit: parseInt(limit) } });
    }

    let query = supabase.from('devices').select('*, device_schedules(*)', { count: 'exact' });
    if (req.user.role === 'Vendor') {
      query = query.eq('vendor_id', req.user.vendorId).eq('approval_status', 'approved');
    } else {
      // Admin: optionally filter by approval_status
      query = query.not('approval_status', 'eq', 'pending');
    }
    if (status) query = query.eq('status', status);
    const { data, error, count } = await query.range(offset, offset + parseInt(limit) - 1);
    if (error) throw error;
    res.json({ data, meta: { total: count, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /pending -> Admin only: list pending devices awaiting approval
router.get('/pending', adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*, vendors(name)')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id -> single device + telemetry
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*, device_schedules(*), vendors(name)')
      .eq('id', id)
      .single();
    if (deviceError) throw deviceError;
    if (!device) return res.status(404).json({ error: 'Device not found' });

    // Access control
    if (req.user.role === 'Vendor' && device.vendor_id !== req.user.vendorId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user.role === 'viewer') {
      const { data: ud } = await supabase.from('user_devices').select('id').eq('user_id', req.user.id).eq('device_id', id).single();
      if (!ud) return res.status(403).json({ error: 'Access denied' });
    }

    const { data: telemetry } = await supabase
      .from('telemetry').select('*').eq('device_id', id)
      .order('timestamp', { ascending: false }).limit(1).single();

    res.json({ ...device, latest_telemetry: telemetry || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / -> create device (Admin = approved, Vendor = pending approval)
router.post('/', adminOrVendor, async (req, res) => {
  try {
    const { name, location, lat, lng, type, mqtt_topic } = req.body;
    const isAdmin = req.user.role === 'Admin';
    const vendor_id = isAdmin ? (req.body.vendor_id || null) : req.user.vendorId;
    const approval_status = isAdmin ? 'approved' : 'pending';

    // Generate API key and device secret
    const api_key = 'KGP-' + uuidv4().replace(/-/g, '').toUpperCase().substring(0, 16);
    const device_secret = uuidv4().replace(/-/g, '').toUpperCase();
    const device_id = mqtt_topic || name.toLowerCase().replace(/\s+/g, '-');

    const { data, error } = await supabase
      .from('devices')
      .insert([{ id: device_id, name, location, type, vendor_id, mqtt_topic: mqtt_topic || device_id, approval_status, api_key, device_secret }])
      .select()
      .single();
    if (error) throw error;
    await log({ userId: req.user.id, userEmail: req.user.email, action: isAdmin ? 'CREATE_DEVICE' : 'REQUEST_DEVICE_APPROVAL', targetId: data.id, targetType: 'device', ipAddress: req.ip });
    res.status(201).json({ ...data, message: isAdmin ? 'Device created' : 'Device submitted for admin approval' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id/approve -> Admin only: approve or reject pending device
router.put('/:id/approve', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const approval_status = action === 'approve' ? 'approved' : 'rejected';
    const { data, error } = await supabase.from('devices').update({ approval_status }).eq('id', id).select().single();
    if (error) throw error;
    await log({ userId: req.user.id, userEmail: req.user.email, action: action === 'approve' ? 'APPROVE_DEVICE' : 'REJECT_DEVICE', targetId: id, targetType: 'device', ipAddress: req.ip });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id -> update device
router.put('/:id', adminOrVendor, async (req, res) => {
  try {
    const { id } = req.params;
    // Vendors can only update their own devices
    if (req.user.role === 'Vendor') {
      const { data: existing } = await supabase.from('devices').select('vendor_id').eq('id', id).single();
      if (!existing || existing.vendor_id !== req.user.vendorId) return res.status(403).json({ error: 'Access denied' });
    }
    const { data, error } = await supabase.from('devices').update(req.body).eq('id', id).select().single();
    if (error) throw error;
    await log({ userId: req.user.id, userEmail: req.user.email, action: 'UPDATE_DEVICE', targetId: id, targetType: 'device', ipAddress: req.ip });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id -> Admin only
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('devices').delete().eq('id', id);
    if (error) throw error;
    await log({ userId: req.user.id, userEmail: req.user.email, action: 'DELETE_DEVICE', targetId: id, targetType: 'device', ipAddress: req.ip });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:id/command -> power command
router.post('/:id/command', adminOrVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const { power, reason } = req.body;
    const { data: device, error } = await supabase.from('devices').select('mqtt_topic, vendor_id').eq('id', id).single();
    if (error) throw error;
    if (req.user.role === 'Vendor' && device.vendor_id !== req.user.vendorId) return res.status(403).json({ error: 'Access denied' });
    const topic = `devices/${device.mqtt_topic}/command`;
    publish(topic, JSON.stringify({ power }));
    await log({ userId: req.user.id, userEmail: req.user.email, action: 'POWER_COMMAND', targetId: id, targetType: 'device', reason, ipAddress: req.ip });
    res.json({ message: 'Command dispatched' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id/schedule
router.put('/:id/schedule', adminOrVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const { turn_on_time, turn_off_time, days, action } = req.body;
    const { data, error } = await supabase.from('device_schedules').upsert({ device_id: id, time: turn_on_time, action: action || 'ON', days }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id/telemetry
router.get('/:id/telemetry', async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, limit = 100 } = req.query;
    let query = supabase.from('telemetry').select('*').eq('device_id', id).order('timestamp', { ascending: false }).limit(parseInt(limit));
    if (from) query = query.gte('timestamp', from);
    if (to) query = query.lte('timestamp', to);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id/logs
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('audit_logs').select('*').eq('target_id', id).order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
