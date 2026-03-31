import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrqxmkutgrcquxffopeo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycXhta3V0Z3JjcXV4Zm9wZW8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMjIxMTcwMCwiZXhwIjoxOTM4MTcxNzAwfQ.0MTRi2L2r0P6lJ0x0l0l0l0l0l0l0l0l0l0l0l0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);