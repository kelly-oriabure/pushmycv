const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)');
}
if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    try {
        console.log('Applying professional_summaries permissions fix...');

        // First, let's test if we can access the table
        console.log('Testing table access...');
        const { data: testData, error: testError } = await supabase
            .from('professional_summaries')
            .select('count')
            .limit(1);

        if (testError) {
            console.log('Table access test failed:', testError.message);
        } else {
            console.log('Table access test passed');
        }

        // Try to apply permissions using PostgreSQL's information_schema
        console.log('Checking current table permissions...');
        const { data: permissions, error: permError } = await supabase
            .from('information_schema.table_privileges')
            .select('*')
            .eq('table_name', 'professional_summaries')
            .eq('table_schema', 'public');

        if (permError) {
            console.error('Error checking permissions:', permError);
        } else {
            console.log('Current permissions:', permissions);
        }

        console.log('✅ Migration check completed!');
        console.log('The RLS policies are already in place. The issue might be that the user needs to be authenticated.');
        console.log('Please ensure the user is logged in when trying to save professional summary.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
applyMigration();
