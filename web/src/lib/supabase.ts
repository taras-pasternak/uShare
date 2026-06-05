import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
    import.meta.env.VITE_SUPABASE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error(
        'Missing Supabase env: set VITE_SUPABASE_URL and VITE_SUPABASE_KEY (or VITE_SUPABASE_ANON_KEY) in web/.env'
    );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');
