/**
 * Test Edge Function - Diagnostic Script
 * 
 * This script tests if the resume-analysis edge function is working
 * 
 * Usage:
 *   npx tsx scripts/test-edge-function.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://embugkjoeyfukdotmgyg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  console.error('   Please set it in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEdgeFunction() {
  console.log('🧪 Testing resume-analysis edge function...\n');
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('🔑 Using anon key:', supabaseAnonKey?.substring(0, 20) + '...\n');

  try {
    console.log('📤 Calling edge function with test payload...');
    
    const testPayload = {
      resumeUploadId: 'test-upload-id-' + Date.now(),
      userId: 'test-user-id',
      jobTitle: 'Test Job Title',
      resumeUrl: 'https://example.com/test-resume.pdf',
      pdfUrl: 'https://example.com/test-resume.pdf'
    };

    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    console.log('');

    const { data, error } = await supabase.functions.invoke('resume-analysis', {
      body: testPayload
    });

    if (error) {
      console.error('❌ Edge function returned error:');
      console.error('   Status:', error.status);
      console.error('   Message:', error.message);
      console.error('   Context:', error.context);
      console.error('\nFull error:', JSON.stringify(error, null, 2));
      
      // Analyze the error
      if (error.message?.includes('not found')) {
        console.error('\n💡 Suggestion: Edge function might not be deployed');
        console.error('   Run: supabase functions deploy resume-analysis --project-ref embugkjoeyfukdotmgyg');
      } else if (error.message?.includes('timeout')) {
        console.error('\n💡 Suggestion: Function timed out - check n8n webhook');
      } else if (error.message?.includes('auth')) {
        console.error('\n💡 Suggestion: Authentication issue - check anon key');
      }
      
      return;
    }

    console.log('✅ Edge function responded successfully!');
    console.log('\nResponse data:');
    console.log(JSON.stringify(data, null, 2));
    
    // Expected: Should fail because test upload ID doesn't exist
    // But this proves the function is callable
    if (data && typeof data === 'object') {
      const response = data as any;
      if (response.error?.includes('not found')) {
        console.log('\n✅ Function is working! (Expected error: upload not found)');
      } else if (response.success) {
        console.log('\n✅ Function executed successfully!');
        console.log('   Analysis ID:', response.analysisId);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

// Run the test
console.log('═══════════════════════════════════════════════════');
console.log('  Resume Analysis Edge Function Test');
console.log('═══════════════════════════════════════════════════\n');

testEdgeFunction()
  .then(() => {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Test Complete');
    console.log('═══════════════════════════════════════════════════');
  })
  .catch((error) => {
    console.error('\n❌ Test failed with unexpected error:', error);
    process.exit(1);
  });
