const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (same config as the app)
const supabaseUrl = "https://embugkjoeyfukdotmgyg.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtYnVna2pvZXlmdWtkb3RtZ3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzMyMTIsImV4cCI6MjA3MDA0OTIxMn0.2YYCNwn3Z8SyQSzfFQBrLK1f6y8onokC_8mtaIi5Zfc";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProfessionalSummaryAccess() {
    try {
        console.log('Testing professional_summaries table access...');
        console.log('Note: This test requires a logged-in user context to work properly.');

        // Test basic table access (should work even without auth)
        const { data: count, error: countError } = await supabase
            .from('professional_summaries')
            .select('count', { count: 'exact', head: true });
            
        if (countError) {
            console.log('Table access test failed:', countError.message);
        } else {
            console.log('✅ Table exists and is accessible');
        }

        // Test authentication state
        const { data: authData } = await supabase.auth.getSession();
        if (authData?.session) {
            console.log('✅ User is authenticated:', authData.session.user.id);
            
            // Test actual access to professional summaries
            const { data: summaries, error: summariesError } = await supabase
                .from('professional_summaries')
                .select('*')
                .limit(1);
                
            if (summariesError) {
                console.log('❌ Professional summaries access failed:', summariesError.message);
            } else {
                console.log('✅ Professional summaries accessible, count:', summaries?.length || 0);
            }
        } else {
            console.log('❌ No authenticated user session found');
            console.log('This is expected when running from command line.');
            console.log('The RLS error occurs because the user must be logged in through the web app.');
        }

        console.log('\n📋 SOLUTION:');
        console.log('1. Ensure the user is logged in to the web application');
        console.log('2. The error occurs because RLS requires authentication context');
        console.log('3. Professional summaries can only be created for resumes owned by the authenticated user');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testProfessionalSummaryAccess();