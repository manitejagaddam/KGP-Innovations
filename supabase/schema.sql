-- ============================================================
-- KGP INOVATION IoT PLATFORM — SUPABASE DATABASE SCHEMA
-- Run this in the Supabase SQL Editor (in order)
-- ============================================================

-- 1. VENDORS (no auth dependency)
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  phone TEXT,
  region TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Worker' CHECK (role IN ('Admin', 'Vendor', 'Worker')),
  kgp_id TEXT UNIQUE,
  vendor_id UUID REFERENCES vendors(id),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DEVICES
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  type TEXT DEFAULT 'Bulb',
  status TEXT DEFAULT 'INACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  power TEXT DEFAULT 'OFF' CHECK (power IN ('ON', 'OFF')),
  connection_status TEXT DEFAULT 'Disconnected' CHECK (connection_status IN ('Connected', 'Disconnected')),
  last_seen TIMESTAMPTZ,
  signal_strength TEXT DEFAULT '0/31',
  signal_level TEXT DEFAULT 'Weak' CHECK (signal_level IN ('Excellent', 'Good', 'Fair', 'Weak')),
  vendor_id UUID REFERENCES vendors(id),
  mqtt_topic TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DEVICE SCHEDULES
CREATE TABLE IF NOT EXISTS device_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  turn_on_time TEXT NOT NULL DEFAULT '06:00 PM',
  turn_off_time TEXT NOT NULL DEFAULT '06:00 AM',
  duration_hours NUMERIC GENERATED ALWAYS AS (
    CASE
      WHEN turn_on_time IS NOT NULL AND turn_off_time IS NOT NULL THEN 12.0
      ELSE NULL
    END
  ) STORED,
  is_active BOOLEAN DEFAULT TRUE,
  days_active TEXT[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id)
);

-- 5. TELEMETRY (time-series, partitioned by month for performance)
CREATE TABLE IF NOT EXISTS telemetry (
  id BIGSERIAL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  voltage NUMERIC(8,2),
  frequency NUMERIC(6,2),
  current_a NUMERIC(8,3),
  energy_kwh NUMERIC(12,4),
  power_factor NUMERIC(4,3),
  power_load_w NUMERIC(10,2),
  temperature_c NUMERIC(6,2),
  door_status TEXT DEFAULT 'CLOSED' CHECK (door_status IN ('OPEN', 'CLOSED')),
  raw_payload JSONB,
  PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Create initial monthly partitions
CREATE TABLE telemetry_2026_07 PARTITION OF telemetry
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE telemetry_2026_08 PARTITION OF telemetry
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE telemetry_2026_09 PARTITION OF telemetry
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE telemetry_2026_10 PARTITION OF telemetry
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE telemetry_2026_11 PARTITION OF telemetry
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE telemetry_2026_12 PARTITION OF telemetry
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE telemetry_2027_01 PARTITION OF telemetry
  FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON telemetry(device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_recent ON telemetry(device_id, recorded_at DESC) WHERE recorded_at > NOW() - INTERVAL '7 days';

-- 6. ALERTS
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Warning' CHECK (severity IN ('Warning', 'Critical')),
  status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Acknowledged', 'Resolved')),
  triggered_value TEXT,
  resolved_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_device ON alerts(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status) WHERE status = 'New';

-- 7. ALERT RULES (threshold configuration)
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  metric TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('>', '<', '>=', '<=', '==')),
  threshold TEXT NOT NULL,
  severity TEXT DEFAULT 'Warning' CHECK (severity IN ('Warning', 'Critical')),
  enabled BOOLEAN DEFAULT TRUE,
  notify_email BOOLEAN DEFAULT TRUE,
  notify_sms BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default alert rules
INSERT INTO alert_rules (name, metric, condition, threshold, severity) VALUES
  ('Over Voltage Alert', 'voltage', '>', '280', 'Warning'),
  ('Critical Over Voltage', 'voltage', '>', '300', 'Critical'),
  ('Over Temperature Alert', 'temperature_c', '>', '60', 'Warning'),
  ('Critical Temperature', 'temperature_c', '>', '70', 'Critical'),
  ('Door Tamper Alert', 'door_status', '==', 'OPEN', 'Warning'),
  ('Under Voltage Alert', 'voltage', '<', '180', 'Warning')
ON CONFLICT DO NOTHING;

-- 8. AUTOMATIONS
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'time' CHECK (trigger_type IN ('time', 'sensor', 'schedule')),
  trigger_condition JSONB NOT NULL DEFAULT '{}',
  action JSONB NOT NULL DEFAULT '{"type": "power", "value": "ON"}',
  target_devices UUID[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT TRUE,
  last_run TIMESTAMPTZ,
  run_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);

-- 10. SETTINGS (single-row org config)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT DEFAULT 'KGP Inovation',
  org_timezone TEXT DEFAULT 'Asia/Kolkata',
  notify_email BOOLEAN DEFAULT TRUE,
  notify_sms BOOLEAN DEFAULT FALSE,
  notify_push BOOLEAN DEFAULT TRUE,
  api_key TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  telemetry_retention_days INT DEFAULT 30,
  alert_email_to TEXT DEFAULT 'admin@kgpinovation.com',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed a single settings row
INSERT INTO settings (org_name) VALUES ('KGP Inovation') ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: Sample devices (matches the frontend mock data)
-- ============================================================

-- First insert vendor
INSERT INTO vendors (id, name, contact_email, phone, region)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'KGP Smart Lighting Systems', 'sales@kgpsmart.com', '+91 98765 43210', 'Andhra Pradesh'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Telangana IoT Solutions', 'support@tgiot.gov.in', '+91 87654 32109', 'Hyderabad Region')
ON CONFLICT DO NOTHING;

-- Insert devices
INSERT INTO devices (id, name, location, lat, lng, status, power, connection_status, signal_strength, signal_level, mqtt_topic, vendor_id)
VALUES
  ('d0000001-0000-0000-0000-000000000001', 'GUNUPUDI-STREET-LIGHT', 'BHIMAVARAM', 16.5449, 81.5224, 'INACTIVE', 'OFF', 'Connected', '31/31', 'Excellent', 'devices/gunupudi-street-light', 'a1b2c3d4-0000-0000-0000-000000000001'),
  ('d0000001-0000-0000-0000-000000000002', 'HYDERABAD-STREET-LIGHT-1', 'HYDERABAD', 17.3850, 78.4867, 'ACTIVE', 'ON', 'Connected', '28/31', 'Good', 'devices/hyderabad-street-light-1', 'a1b2c3d4-0000-0000-0000-000000000002'),
  ('d0000001-0000-0000-0000-000000000003', 'BHIMAVARAM-MAIN-LIGHT-2', 'BHIMAVARAM', 16.5410, 81.5290, 'ACTIVE', 'ON', 'Connected', '30/31', 'Excellent', 'devices/bhimavaram-main-light-2', 'a1b2c3d4-0000-0000-0000-000000000001'),
  ('d0000001-0000-0000-0000-000000000004', 'VIJAYAWADA-LIGHT-3', 'VIJAYAWADA', 16.5062, 80.6480, 'INACTIVE', 'OFF', 'Disconnected', '0/31', 'Weak', 'devices/vijayawada-light-3', 'a1b2c3d4-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Insert schedules for each device
INSERT INTO device_schedules (device_id, turn_on_time, turn_off_time, is_active)
VALUES
  ('d0000001-0000-0000-0000-000000000001', '06:00 PM', '06:02 AM', TRUE),
  ('d0000001-0000-0000-0000-000000000002', '06:30 PM', '06:00 AM', TRUE),
  ('d0000001-0000-0000-0000-000000000003', '06:00 PM', '06:00 AM', TRUE),
  ('d0000001-0000-0000-0000-000000000004', '07:00 PM', '05:30 AM', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Service role bypass (backend uses service key, bypasses RLS)
-- The backend server uses SUPABASE_SERVICE_KEY which bypasses all RLS.
-- RLS below applies to frontend direct Supabase queries only.

-- Admins: full access to everything
CREATE POLICY "Admin full access on devices" ON devices FOR ALL
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'Admin');

CREATE POLICY "Admin full access on users" ON user_profiles FOR ALL
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'Admin');

CREATE POLICY "Admin full access on alerts" ON alerts FOR ALL
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'Admin');

CREATE POLICY "Admin full access on telemetry" ON telemetry FOR ALL
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'Admin');

CREATE POLICY "Admin full access on vendors" ON vendors FOR ALL
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'Admin');

-- Vendors: read/update their own assigned devices only
CREATE POLICY "Vendor read own devices" ON devices FOR SELECT
  USING (
    vendor_id = (SELECT id FROM vendors WHERE contact_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    OR (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'Admin'
  );

-- Workers: read-only on all devices and alerts
CREATE POLICY "Worker read devices" ON devices FOR SELECT
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('Admin', 'Vendor', 'Worker'));

CREATE POLICY "Worker read alerts" ON alerts FOR SELECT
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('Admin', 'Vendor', 'Worker'));

-- User can always read their own profile
CREATE POLICY "Own profile read" ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Own profile update" ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- Settings: Admin only
CREATE POLICY "Admin settings access" ON settings FOR ALL
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'Admin');

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_role TEXT;
  new_kgp_id TEXT;
  role_prefix TEXT;
  user_count INT;
BEGIN
  new_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Worker');
  role_prefix := CASE new_role
    WHEN 'Admin' THEN 'KGPA'
    WHEN 'Vendor' THEN 'KGPV'
    ELSE 'KGPE'
  END;

  SELECT COUNT(*) + 1 INTO user_count
  FROM user_profiles WHERE role = new_role;

  new_kgp_id := role_prefix || LPAD(user_count::TEXT, 5, '0');

  INSERT INTO user_profiles (id, display_name, role, kgp_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    new_role,
    new_kgp_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update device updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_devices_timestamp BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_timestamp BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- REALTIME SUBSCRIPTIONS: Enable for live dashboard updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE telemetry;
