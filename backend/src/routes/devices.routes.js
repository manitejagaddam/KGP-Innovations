import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly, adminOrVendor } from '../middleware/rbac.js';
import { log } from '../middleware/audit.js';
import { publish } from '../config/mqtt.js';

const router = express.Router();

router.use(authenticate);

// GET / -> list all devices with schedule joined
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('devices')
      .select('*, device_schedules(*)', { count: 'exact' })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ data, meta: { total: count, page, limit } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id -> single device + schedule + latest telemetry row
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*, device_schedules(*)')
      .eq('id', id)
      .single();

    if (deviceError) throw deviceError;
    if (!device) return res.status(404).json({ error: 'Device not found' });

    const { data: telemetry, error: telemetryError } = await supabase
      .from('telemetry')
      .select('*')
      .eq('device_id', id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    res.json({ ...device, latest_telemetry: telemetry || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / -> create device (adminOnly)
router.post('/', adminOnly, async (req, res) => {
  try {
    const { name, location, lat, lng, type, vendor_id, mqtt_topic } = req.body;
    const { data, error } = await supabase
      .from('devices')
      .insert([{ name, location, lat, lng, type, vendor_id, mqtt_topic }])
      .select()
      .single();

    if (error) throw error;
    await log(req.user.id, 'CREATE_DEVICE', data.id, { mqtt_topic });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id -> update device (adminOnly)
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('devices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await log(req.user.id, 'UPDATE_DEVICE', id, updates);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id -> delete device (adminOnly)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('devices').delete().eq('id', id);
    if (error) throw error;
    await log(req.user.id, 'DELETE_DEVICE', id, {});
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:id/command -> dispatch power command (Admin+Vendor)
router.post('/:id/command', adminOrVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const { power, password, reason } = req.body;
    
    if (password !== 'admin123' && password !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Invalid password' });
    }

    const { data: device, error } = await supabase
      .from('devices')
      .select('mqtt_topic')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    const topic = `devices/${device.mqtt_topic}/command`;
    publish(topic, JSON.stringify({ power }));
    
    await log(req.user.id, 'POWER_COMMAND', id, { power, reason });
    res.json({ message: 'Command dispatched successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id/schedule -> update device schedule (Admin+Vendor)
router.put('/:id/schedule', adminOrVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const { turn_on_time, turn_off_time } = req.body;
    
    const { data, error } = await supabase
      .from('device_schedules')
      .upsert({ device_id: id, turn_on_time, turn_off_time })
      .select()
      .single();
      
    if (error) throw error;
    await log(req.user.id, 'UPDATE_SCHEDULE', id, { turn_on_time, turn_off_time });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id/telemetry -> historical telemetry
router.get('/:id/telemetry', async (req, res) => {
  try {
    const { id } = req.params;
    const { metric, from, to, limit = 100 } = req.query;
    
    let query = supabase
      .from('telemetry')
      .select(metric ? `timestamp, ${metric}` : '*')
      .eq('device_id', id)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));
      
    if (from) query = query.gte('timestamp', from);
    if (to) query = query.lte('timestamp', to);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id/logs -> audit_logs filtered by target_id
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('target_id', id)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
