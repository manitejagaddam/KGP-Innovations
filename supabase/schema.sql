-- ============================================================
-- KGP INNOVATION IoT PLATFORM — CLEAN DATABASE SCHEMA v2
-- Roles: Admin | Vendor | User
--
-- HOW TO USE:
--   1. Open Supabase → SQL Editor
--   2. Run the DROP block below first to wipe old tables
--   3. Then run the rest of this file in the same editor
-- ============================================================

-- ============================================================
-- STEP 0: DROP EVERYTHING (full reset)
-- ============================================================
DROP TABLE IF EXISTS device_firmware CASCADE;
DROP TABLE IF EXISTS firmware CASCADE;
DROP TABLE IF EXISTS user_devices CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS automations CASCADE;
DROP TABLE IF EXISTS alert_rules CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS telemetry_2026_07 CASCADE;
DROP TABLE IF EXISTS telemetry_2026_08 CASCADE;
DROP TABLE IF EXISTS telemetry_2026_09 CASCADE;
DROP TABLE IF EXISTS telemetry_2026_10 CASCADE;
DROP TABLE IF EXISTS telemetry_2026_11 CASCADE;
DROP TABLE IF EXISTS telemetry_2026_12 CASCADE;
DROP TABLE IF EXISTS telemetry_2027_01 CASCADE;
DROP TABLE IF EXISTS telemetry CASCADE;
DROP TABLE IF EXISTS device_schedules CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Drop old triggers and functions if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.my_role();

-- ============================================================
-- 1. VENDORS
-- ============================================================
CREATE TABLE vendors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  contact_email TEXT,
  phone         TEXT,
  region        TEXT,
  status        TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. USER PROFILES (Standalone Custom Authentication)
--    Roles: Admin | Vendor | User
-- ============================================================
CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'Vendor', 'User')),
  kgp_id        TEXT UNIQUE,
  vendor_id     UUID REFERENCES vendors(id) ON DELETE SET NULL,
  status        TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. DEVICES
-- ============================================================
CREATE TABLE devices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL UNIQUE,
  location          TEXT,
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  type              TEXT DEFAULT 'Street Light',
  connectivity      TEXT DEFAULT 'WiFi',
  status            TEXT DEFAULT 'INACTIVE'     CHECK (status IN ('ACTIVE', 'INACTIVE')),
  power             TEXT DEFAULT 'OFF'           CHECK (power IN ('ON', 'OFF')),
  connection_status TEXT DEFAULT 'Disconnected'  CHECK (connection_status IN ('Connected', 'Disconnected')),
  approval_status   TEXT DEFAULT 'approved'      CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  last_seen         TIMESTAMPTZ,
  signal_strength   TEXT DEFAULT '0/31',
  signal_level      TEXT DEFAULT 'Weak'          CHECK (signal_level IN ('Excellent', 'Good', 'Fair', 'Weak')),
  vendor_id         UUID REFERENCES vendors(id) ON DELETE SET NULL,
  mqtt_topic        TEXT UNIQUE,
  api_key           TEXT UNIQUE DEFAULT ('KGP-' || upper(encode(gen_random_bytes(8), 'hex'))),
  device_secret     TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. USER DEVICES — assigns specific devices to User-role accounts
-- ============================================================
CREATE TABLE user_devices (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  device_id  UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- ============================================================
-- 5. DEVICE SCHEDULES
-- ============================================================
CREATE TABLE device_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id     UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  turn_on_time  TEXT NOT NULL DEFAULT '18:00',
  turn_off_time TEXT NOT NULL DEFAULT '06:00',
  is_active     BOOLEAN DEFAULT TRUE,
  days_active   TEXT[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id)
);

-- ============================================================
-- 6. TELEMETRY (partitioned time-series)
-- ============================================================
CREATE TABLE telemetry (
  id            BIGSERIAL,
  device_id     UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  voltage       NUMERIC(8,2),
  frequency     NUMERIC(6,2),
  current_a     NUMERIC(8,3),
  energy_kwh    NUMERIC(12,4),
  power_factor  NUMERIC(4,3),
  power_load_w  NUMERIC(10,2),
  temperature_c NUMERIC(6,2),
  door_status   TEXT DEFAULT 'CLOSED' CHECK (door_status IN ('OPEN', 'CLOSED')),
  raw_payload   JSONB,
  PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

CREATE TABLE telemetry_2026_07 PARTITION OF telemetry FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE telemetry_2026_08 PARTITION OF telemetry FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE telemetry_2026_09 PARTITION OF telemetry FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE telemetry_2026_10 PARTITION OF telemetry FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE telemetry_2026_11 PARTITION OF telemetry FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE telemetry_2026_12 PARTITION OF telemetry FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE telemetry_2027_01 PARTITION OF telemetry FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');

CREATE INDEX idx_telemetry_device_time ON telemetry(device_id, recorded_at DESC);

-- ============================================================
-- 7. ALERTS
-- ============================================================
CREATE TABLE alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  rule_id         UUID,
  type            TEXT NOT NULL,
  severity        TEXT NOT NULL DEFAULT 'Warning' CHECK (severity IN ('Warning', 'Critical')),
  status          TEXT DEFAULT 'New' CHECK (status IN ('New', 'Acknowledged', 'Resolved')),
  message         TEXT,
  triggered_value TEXT,
  resolved_by     UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  resolved_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_device ON alerts(device_id, created_at DESC);
CREATE INDEX idx_alerts_status ON alerts(status) WHERE status = 'New';

-- ============================================================
-- 8. ALERT RULES
-- ============================================================
CREATE TABLE alert_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  metric       TEXT NOT NULL,
  condition    TEXT NOT NULL CHECK (condition IN ('>', '<', '>=', '<=', '==')),
  threshold    TEXT NOT NULL,
  severity     TEXT DEFAULT 'Warning' CHECK (severity IN ('Warning', 'Critical')),
  enabled      BOOLEAN DEFAULT TRUE,
  notify_email BOOLEAN DEFAULT TRUE,
  notify_sms   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO alert_rules (name, metric, condition, threshold, severity) VALUES
  ('Over Voltage Alert',     'voltage',       '>',  '280', 'Warning'),
  ('Critical Over Voltage',  'voltage',       '>',  '300', 'Critical'),
  ('Over Temperature Alert', 'temperature_c', '>',  '60',  'Warning'),
  ('Critical Temperature',   'temperature_c', '>',  '70',  'Critical'),
  ('Door Tamper Alert',      'door_status',   '==', 'OPEN','Warning'),
  ('Under Voltage Alert',    'voltage',       '<',  '180', 'Warning')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. AUTOMATIONS
-- ============================================================
CREATE TABLE automations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  trigger_type      TEXT NOT NULL DEFAULT 'time' CHECK (trigger_type IN ('time', 'sensor', 'schedule')),
  trigger_condition JSONB NOT NULL DEFAULT '{}',
  action            JSONB NOT NULL DEFAULT '{"type": "power", "value": "ON"}',
  target_devices    UUID[] DEFAULT '{}',
  enabled           BOOLEAN DEFAULT TRUE,
  last_run          TIMESTAMPTZ,
  run_count         INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. FIRMWARE
-- ============================================================
CREATE TABLE firmware (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  version     TEXT NOT NULL,
  platform    TEXT DEFAULT 'Arduino',
  description TEXT,
  source_code TEXT,
  file_url    TEXT,
  is_active   BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. DEVICE FIRMWARE (OTA)
-- ============================================================
CREATE TABLE device_firmware (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  firmware_id  UUID NOT NULL REFERENCES firmware(id) ON DELETE CASCADE,
  ota_status   TEXT DEFAULT 'pending' CHECK (ota_status IN ('pending', 'downloading', 'installed', 'failed')),
  pushed_at    TIMESTAMPTZ DEFAULT NOW(),
  installed_at TIMESTAMPTZ,
  UNIQUE(device_id, firmware_id)
);

-- ============================================================
-- 12. AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  user_email  TEXT,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  reason      TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_time ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);

-- ============================================================
-- 13. SETTINGS
-- ============================================================
CREATE TABLE settings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name                 TEXT DEFAULT 'KGP Innovation',
  org_timezone             TEXT DEFAULT 'Asia/Kolkata',
  notify_email             BOOLEAN DEFAULT TRUE,
  notify_sms               BOOLEAN DEFAULT FALSE,
  notify_push              BOOLEAN DEFAULT TRUE,
  api_key                  TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  telemetry_retention_days INT DEFAULT 30,
  alert_email_to           TEXT DEFAULT 'admin@kgpinnovation.com',
  tariff_rate              NUMERIC(10,4) DEFAULT 7.5,
  fixed_charge             NUMERIC(10,2) DEFAULT 150.0,
  mqtt_url                 TEXT,
  mqtt_username            TEXT,
  mqtt_password            TEXT,
  mqtt_base_topic          TEXT DEFAULT 'devices',
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (org_name) VALUES ('KGP Innovation') ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO vendors (id, name, contact_email, phone, region) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'KGP Smart Lighting Systems', 'sales@kgpsmart.com',   '+91 98765 43210', 'Andhra Pradesh'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Telangana IoT Solutions',    'support@tgiot.gov.in', '+91 87654 32109', 'Hyderabad Region')
ON CONFLICT DO NOTHING;

INSERT INTO devices (id, name, location, lat, lng, status, power, connection_status, approval_status, signal_strength, signal_level, mqtt_topic, vendor_id) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'GUNUPUDI-STREET-LIGHT',    'BHIMAVARAM', 16.5449, 81.5224, 'INACTIVE', 'OFF', 'Connected',    'approved', '31/31', 'Excellent', 'gunupudi-street-light',    'a1b2c3d4-0000-0000-0000-000000000001'),
  ('d0000001-0000-0000-0000-000000000002', 'HYDERABAD-STREET-LIGHT-1', 'HYDERABAD',  17.3850, 78.4867, 'ACTIVE',   'ON',  'Connected',    'approved', '28/31', 'Good',      'hyderabad-street-light-1', 'a1b2c3d4-0000-0000-0000-000000000002'),
  ('d0000001-0000-0000-0000-000000000003', 'BHIMAVARAM-MAIN-LIGHT-2',  'BHIMAVARAM', 16.5410, 81.5290, 'ACTIVE',   'ON',  'Connected',    'approved', '30/31', 'Excellent', 'bhimavaram-main-light-2',  'a1b2c3d4-0000-0000-0000-000000000001'),
  ('d0000001-0000-0000-0000-000000000004', 'VIJAYAWADA-LIGHT-3',       'VIJAYAWADA', 16.5062, 80.6480, 'INACTIVE', 'OFF', 'Disconnected', 'approved', '0/31',  'Weak',      'vijayawada-light-3',       'a1b2c3d4-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO device_schedules (device_id, turn_on_time, turn_off_time, is_active) VALUES
  ('d0000001-0000-0000-0000-000000000001', '18:00', '06:00', TRUE),
  ('d0000001-0000-0000-0000-000000000002', '18:30', '06:00', TRUE),
  ('d0000001-0000-0000-0000-000000000003', '18:00', '06:00', TRUE),
  ('d0000001-0000-0000-0000-000000000004', '19:00', '05:30', TRUE)
ON CONFLICT DO NOTHING;

-- Create default admin account (password is: Admin@123)
-- bcrypt hash for Admin@123 is $2a$10$wN9P34jD23/15O2t/dK/C.Qh.M7z45q4C3d6rGZ.e.jG4e1gVz1o6
INSERT INTO user_profiles (email, password_hash, display_name, role, kgp_id, status)
VALUES (
  'admin@kgpinnovation.com',
  '$2a$10$wN9P34jD23/15O2t/dK/C.Qh.M7z45q4C3d6rGZ.e.jG4e1gVz1o6',
  'System Admin',
  'Admin',
  'KGPA00001',
  'Active'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Backend uses SUPABASE_SERVICE_KEY → bypasses ALL RLS automatically.

ALTER TABLE devices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry        ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmware         ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_firmware  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid()
$$;

CREATE POLICY "Admin full access users"  ON user_profiles FOR ALL    USING (my_role() = 'Admin');
CREATE POLICY "Own profile read"         ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Own profile update"       ON user_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin full access devices"      ON devices      FOR ALL USING (my_role() = 'Admin');
CREATE POLICY "Admin full access alerts"       ON alerts       FOR ALL USING (my_role() = 'Admin');
CREATE POLICY "Admin full access telemetry"    ON telemetry    FOR ALL USING (my_role() = 'Admin');
CREATE POLICY "Admin full access vendors"      ON vendors      FOR ALL USING (my_role() = 'Admin');
CREATE POLICY "Admin full access firmware"     ON firmware     FOR ALL USING (my_role() = 'Admin');
CREATE POLICY "Admin full access settings"     ON settings     FOR ALL USING (my_role() = 'Admin');
CREATE POLICY "Admin full access audit_logs"   ON audit_logs   FOR ALL USING (my_role() = 'Admin');
CREATE POLICY "Admin full access automations"  ON automations  FOR ALL USING (my_role() = 'Admin');
CREATE POLICY "Admin full access alert_rules"  ON alert_rules  FOR ALL USING (my_role() = 'Admin');
CREATE POLICY "Vendor read own devices" ON devices FOR SELECT USING (vendor_id = (SELECT vendor_id FROM user_profiles WHERE id = auth.uid()) OR my_role() = 'Admin');
CREATE POLICY "All auth read alerts" ON alerts FOR SELECT USING (my_role() IN ('Admin', 'Vendor', 'User'));
CREATE POLICY "User read assigned devices" ON devices FOR SELECT USING (id IN (SELECT device_id FROM user_devices WHERE user_id = auth.uid()) OR my_role() IN ('Admin', 'Vendor'));

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER update_devices_timestamp     BEFORE UPDATE ON devices       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_timestamp     BEFORE UPDATE ON vendors       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_timestamp    BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_firmware_timestamp    BEFORE UPDATE ON firmware      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automations_timestamp BEFORE UPDATE ON automations   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE telemetry;
