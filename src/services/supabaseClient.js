import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if credentials are provided in .env
export const isSupabaseConfigured = !!(supabaseUrl && supabaseUrl !== 'your_supabase_url' && supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key')

// Fallback client/null if not configured yet
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

console.log(`[Supabase Service] Status: ${isSupabaseConfigured ? 'CONNECTED' : 'MOCK MODE (No credentials)'}`)
