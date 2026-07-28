import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);

// GET / -> list all vendors with device count
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        *,
        devices (count)
      `);
      
    if (error) throw error;
    
    const formattedData = data.map(vendor => ({
      ...vendor,
      device_count: vendor.devices[0]?.count || 0
    }));
    
    res.json(formattedData);
  } catch (error) {
    console.error('API Error in backend\src\routes\vendors.routes.js:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /:id -> single vendor + assigned devices
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        *,
        devices (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Vendor not found' });
    
    res.json(data);
  } catch (error) {
    console.error('API Error in backend\src\routes\vendors.routes.js:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST / -> create vendor (adminOnly)
router.post('/', adminOnly, async (req, res) => {
  try {
    const { name, contact_email, phone, region } = req.body;
    const { data, error } = await supabase
      .from('vendors')
      .insert([{ name, contact_email, phone, region }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('API Error in backend\src\routes\vendors.routes.js:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /:id -> update vendor (adminOnly)
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('API Error in backend\src\routes\vendors.routes.js:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /:id -> delete vendor (adminOnly)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    // check for assigned devices first
    const { data: devices, error: deviceError } = await supabase
      .from('devices')
      .select('id')
      .eq('vendor_id', id)
      .limit(1);
      
    if (deviceError) throw deviceError;
    if (devices.length > 0) {
      return res.status(400).json({ error: 'Cannot delete vendor with assigned devices' });
    }

    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) throw error;
    
    res.status(204).send();
  } catch (error) {
    console.error('API Error in backend\src\routes\vendors.routes.js:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
