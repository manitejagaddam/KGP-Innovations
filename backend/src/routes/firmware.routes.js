import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';
import { publish } from '../config/mqtt.js';
import { log } from '../middleware/audit.js';

const router = express.Router();
router.use(authenticate);

// GET / -> list all firmware
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('firmware').select('*, user_profiles(display_name)').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id -> single firmware detail
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('firmware').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / -> Admin only: create firmware entry with source_code
router.post('/', adminOnly, async (req, res) => {
  try {
    const { name, version, platform, source_code, description, file_url } = req.body;
    const { data, error } = await supabase.from('firmware').insert([{
      name, version, platform, source_code, description, file_url,
      uploaded_by: req.user.id
    }]).select().single();
    if (error) throw error;
    await log({ userId: req.user.id, userEmail: req.user.email, action: 'CREATE_FIRMWARE', targetId: data.id, targetType: 'firmware', ipAddress: req.ip });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id -> Admin only: update firmware source_code
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { name, version, platform, source_code, description, file_url } = req.body;
    const { data, error } = await supabase.from('firmware').update({ name, version, platform, source_code, description, file_url }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id -> Admin only
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { error } = await supabase.from('firmware').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/push/:deviceId -> Admin only: trigger OTA via MQTT
router.post('/:id/push/:deviceId', adminOnly, async (req, res) => {
  try {
    const { id, deviceId } = req.params;
    const { data: firmware, error: fwErr } = await supabase.from('firmware').select('*').eq('id', id).single();
    if (fwErr) throw fwErr;
    const { data: device, error: devErr } = await supabase.from('devices').select('mqtt_topic').eq('id', deviceId).single();
    if (devErr) throw devErr;

    // Publish OTA command to device
    const otaTopic = `devices/${device.mqtt_topic}/ota`;
    publish(otaTopic, JSON.stringify({ firmware_url: firmware.file_url, version: firmware.version }));

    // Record OTA assignment
    await supabase.from('device_firmware').upsert({ device_id: deviceId, firmware_id: id, ota_status: 'pending' });
    await log({ userId: req.user.id, userEmail: req.user.email, action: 'OTA_PUSH', targetId: deviceId, targetType: 'device', reason: `Pushed firmware ${firmware.name} v${firmware.version}`, ipAddress: req.ip });
    res.json({ message: `OTA push initiated for device ${deviceId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
