// Shared Supabase client for Vercel serverless functions.
// Uses anon key with permissive RLS policies (see supabase/migrations/0001_ais_events.sql).
// Switch to SUPABASE_SERVICE_ROLE_KEY when RLS is tightened for production.

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Throw early on cold-start so failures are obvious in the Vercel function log.
  // The frontend will surface a structured error if /api/* responds 500.
  throw new Error(
    'Missing Supabase env vars: set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel project settings.'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export const EVENTS_TABLE = 'ais_events';
