import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

export default supabase;
