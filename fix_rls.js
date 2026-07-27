import dotenv from 'dotenv';
import { Client } from 'pg';
import path from 'path';

dotenv.config({ path: path.resolve('backend/.env') });

const run = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to Postgres directly!');

    await client.query(`
      -- Allow anyone to insert into user_profiles for development
      DROP POLICY IF EXISTS "Allow anon insert" ON public.user_profiles;
      CREATE POLICY "Allow anon insert" ON public.user_profiles FOR INSERT WITH CHECK (true);
      
      -- Also ensure the columns exist in case they didn't run the migration
      ALTER TABLE public.user_profiles
        ADD COLUMN IF NOT EXISTS kgp_id TEXT,
        ADD COLUMN IF NOT EXISTS vendor_id UUID;
    `);

    console.log('RLS fixed and missing columns added!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};

run();
