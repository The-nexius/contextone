import { createClient } from '@supabase/supabase-js';

// Use environment variables or fallback to production values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrqxmkutgrcquxffopeo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycXhta3V0Z3JjcXV4ZmZvcGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzY1ODEsImV4cCI6MjA5MDQ1MjU4MX0.c9kt3WWsxqd23ntQdegv9jgr2l8kqF-W4szb3gGJiKk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});