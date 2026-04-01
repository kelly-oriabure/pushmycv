/**
 * Cleanup Script for Stuck Resume Analyses
 * 
 * This script marks analyses stuck in "processing" status for more than 30 minutes as failed.
 * Run this manually when needed or set up as a cron job.
 * 
 * Usage:
 *   npx tsx scripts/cleanup-stuck-analyses.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface StuckAnalysis {
  id: string;
  user_id: string;
  file_name: string;
  created_at: string;
}

async function cleanupStuckAnalyses() {
  console.log('🔍 Checking for stuck analyses...\n');

  // Find analyses stuck in "processing" for more than 30 minutes
  const cutoffTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
  
  const { data: stuckAnalyses, error: fetchError } = await supabase
    .from('resume_analyses')
    .select('id, user_id, file_name, created_at')
    .eq('status', 'processing')
    .lt('created_at', cutoffTime.toISOString());

  if (fetchError) {
    console.error('❌ Error fetching stuck analyses:', fetchError);
    process.exit(1);
  }

  if (!stuckAnalyses || stuckAnalyses.length === 0) {
    console.log('✅ No stuck analyses found. All good!');
    return;
  }

  console.log(`⚠️  Found ${stuckAnalyses.length} stuck analyses:\n`);
  
  stuckAnalyses.forEach((analysis: StuckAnalysis, index: number) => {
    const minutesStuck = Math.floor(
      (Date.now() - new Date(analysis.created_at).getTime()) / (1000 * 60)
    );
    console.log(`${index + 1}. ID: ${analysis.id}`);
    console.log(`   File: ${analysis.file_name}`);
    console.log(`   Stuck for: ${minutesStuck} minutes`);
    console.log(`   Created: ${analysis.created_at}\n`);
  });

  // Ask for confirmation (in production, you might want to auto-run this)
  console.log('🔄 Marking these analyses as failed...\n');

  const { data: updatedAnalyses, error: updateError } = await supabase
    .from('resume_analyses')
    .update({
      status: 'failed',
      error_message: 'Analysis timed out after 30 minutes - please retry',
      updated_at: new Date().toISOString()
    })
    .eq('status', 'processing')
    .lt('created_at', cutoffTime.toISOString())
    .select();

  if (updateError) {
    console.error('❌ Error updating stuck analyses:', updateError);
    process.exit(1);
  }

  console.log(`✅ Successfully marked ${updatedAnalyses?.length || 0} analyses as failed\n`);
  
  if (updatedAnalyses && updatedAnalyses.length > 0) {
    console.log('📋 Updated records:');
    updatedAnalyses.forEach((analysis: any, index: number) => {
      console.log(`${index + 1}. ID: ${analysis.id} - Status: ${analysis.status}`);
    });
  }

  console.log('\n✨ Cleanup complete!');
}

// Run the cleanup
cleanupStuckAnalyses().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
