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

async function fixProfessionalSummariesPermissions() {
    try {
        console.log('🔧 Applying professional_summaries permissions fix...');

        // Apply the SQL fix directly
        const { error } = await supabase.rpc('sql', {
            query: `
                -- Grant all privileges to authenticated users for professional_summaries table
                GRANT ALL PRIVILEGES ON public.professional_summaries TO authenticated;
                
                -- Grant usage on sequences
                GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
                
                -- Update table comment
                COMMENT ON TABLE public.professional_summaries IS 'Professional summaries for resumes - permissions granted to authenticated users';
                
                -- Verify the fix by checking grants
                SELECT 
                    grantee, 
                    table_name, 
                    privilege_type 
                FROM information_schema.table_privileges 
                WHERE table_name = 'professional_summaries' 
                AND table_schema = 'public' 
                AND grantee = 'authenticated';
            `
        });

        if (error) {
            console.error('❌ SQL execution failed:', error);
            
            // Try alternative approach using individual operations
            console.log('🔄 Trying alternative fix...');
            
            // Check if we can at least verify the table exists
            const { data: tableCheck, error: tableError } = await supabase
                .from('professional_summaries')
                .select('count')
                .limit(1);
                
            if (tableError) {
                console.error('❌ Table access failed:', tableError);
                console.log('📋 MANUAL STEPS REQUIRED:');
                console.log('1. Go to your Supabase SQL Editor');
                console.log('2. Run this SQL command:');
                console.log('   GRANT ALL PRIVILEGES ON public.professional_summaries TO authenticated;');
                console.log('3. Try saving the professional summary again');
                return;
            } else {
                console.log('✅ Table is accessible');
                console.log('❌ But permissions issue remains - manual SQL fix needed');
            }
        } else {
            console.log('✅ Permissions fix applied successfully!');
            console.log('✅ You can now try saving the professional summary again');
        }

    } catch (error) {
        console.error('❌ Fix failed:', error);
        console.log('');
        console.log('📋 MANUAL FIX REQUIRED:');
        console.log('1. Open Supabase Dashboard → SQL Editor');
        console.log('2. Run this command:');
        console.log('   GRANT ALL PRIVILEGES ON public.professional_summaries TO authenticated;');
        console.log('3. Try saving the professional summary again');
    }
}

// Run the fix
fixProfessionalSummariesPermissions();
