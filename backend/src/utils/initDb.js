import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pkg from 'pg'

const { Client } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function initDb() {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
    console.log('⚠️ DATABASE_URL not fully configured. Skipping auto-initialization.')
    return
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    
    // Check if user_profiles table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
      );
    `
    const { rows } = await client.query(checkTableQuery)
    const tablesExist = rows[0].exists
    
    if (!tablesExist) {
      console.log('⚙️ Database tables not found. Initializing schema...')
      
      // Read schema file
      const schemaPath = path.resolve(__dirname, '../../../../../../../.gemini/antigravity/brain/57a3fe0a-8a7c-4989-a159-2a52e4982306/supabase_schema.sql')
      let schemaSql = ''
      try {
        schemaSql = fs.readFileSync(schemaPath, 'utf8')
      } catch (err) {
        console.error('❌ Could not find supabase_schema.sql. Please ensure it is available.')
        return
      }
      
      // Execute schema
      await client.query(schemaSql)
      console.log('✅ Schema initialized successfully.')

      // Insert dummy data
      console.log('⚙️ Inserting mock data...')
      const seedSql = `
        INSERT INTO public.devices (id, name, type, location, coordinates, status, power, connection_status)
        VALUES 
          ('DEV-001', 'Smart Pole 1', 'Street Light', 'Hyderabad', '{"lat": 17.3850, "lng": 78.4867}', 'OK', 'ON', 'Connected'),
          ('DEV-002', 'Smart Pole 2', 'Street Light', 'Bhimavaram', '{"lat": 16.5449, "lng": 81.5224}', 'OK', 'OFF', 'Connected'),
          ('DEV-003', 'Smart Pole 3', 'Street Light', 'Vijayawada', '{"lat": 16.5062, "lng": 80.6480}', 'Fault', 'OFF', 'Disconnected')
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO public.automations (name, trigger_type, trigger_condition, action, target_devices, enabled)
        VALUES 
          ('Sunset ON', 'Time', '{"time": "18:00"}', '{"command": "TURN_ON"}', '["DEV-001", "DEV-002"]', true),
          ('Sunrise OFF', 'Time', '{"time": "06:00"}', '{"command": "TURN_OFF"}', '["DEV-001", "DEV-002"]', true)
        ON CONFLICT DO NOTHING;
      `
      await client.query(seedSql)
      console.log('✅ Mock data inserted.')
    } else {
      console.log('✅ Database tables already exist. Skipping initialization.')
    }
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message)
  } finally {
    await client.end()
  }
}
