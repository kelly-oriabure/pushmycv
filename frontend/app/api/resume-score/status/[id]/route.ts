import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import type { AnalysisStatusResponse, ApiError } from '@/types/resume-score';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient();

    // Support both cookie-based and Bearer token auth
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const { data: { user }, error: authError } = accessToken
      ? await supabase.auth.getUser(accessToken)
      : await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiError,
        { status: 401 }
      );
    }

    // Await params before accessing properties
    const resolvedParams = await params;

    // Validate ID format
    const id = resolvedParams.id;
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid ID' } as ApiError,
        { status: 400 }
      );
    }

    console.log(`[Status API] Checking status for ID: ${id}, User: ${user.id}`);

    // Try to get analysis data by analysis ID first
    let { data: analysis, error } = await supabase
      .from('resume_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    // If not found, try to fetch by upload_id (for new structure)
    if (error && error.code === 'PGRST116') {
      const { data: uploadAnalysis, error: uploadError } = await supabase
        .from('resume_analyses')
        .select('*')
        .eq('upload_id', id)
        .eq('user_id', user.id)
        .single();

      analysis = uploadAnalysis;
      error = uploadError;
    }

    if (error || !analysis) {
      // Check if upload exists - if so, return a processing status even if analysis record is missing
      // This handles the race condition where Edge Function hasn't created the analysis record yet
      if (error?.code === 'PGRST116') {
        const { data: upload, error: uploadCheckError } = await supabase
          .from('resume_uploads')
          .select('id')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (upload) {
          console.log('[Status API] Upload found, returning processing status');
          // Upload exists, so we return a "processing" placeholder
          return NextResponse.json({
            id: 'pending',
            user_id: user.id,
            status: 'processing',
            overall_score: 0,
            ats_score: 0,
            error_message: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as AnalysisStatusResponse);
        } else {
          console.log('[Status API] Upload NOT found for this user');
        }
      }

      console.error('Analysis fetch error:', error);
      return NextResponse.json(
        { error: 'Analysis not found' } as ApiError,
        { status: 404 }
      );
    }

    const { data: upload } = await supabase
      .from('resume_uploads')
      .select('file_path, file_name, image_url, resume_url')
      .eq('id', analysis.upload_id)
      .eq('user_id', user.id)
      .maybeSingle();

    // Transform the data to match our TypeScript interface
    // Include all score fields for the ScoreDashboard
    const scoreBreakdown = analysis.score_breakdown || {};

    const response = {
      id: analysis.id,
      user_id: analysis.user_id,
      upload_id: analysis.upload_id,
      file_path: upload?.file_path || '',
      file_name: upload?.file_name || '',
      job_title: analysis.job_title,
      overall_score: analysis.overall_score,
      score_breakdown: analysis.score_breakdown,
      suggestions: analysis.suggestions,
      status: analysis.status,
      error_message: analysis.error_message,
      image_url: upload?.image_url || upload?.resume_url || '',
      created_at: analysis.created_at,
      updated_at: analysis.updated_at,
      // Individual score fields needed by ScoreDashboard
      ats_score: analysis.ats_score,
      content_score: analysis.content_score,
      tone_score: analysis.tone_score,
      structure_score: analysis.structure_score,
      skills_score: analysis.skills_score,
      email_score: analysis.email_score,
      length_score: analysis.length_score,
      brevity_score: analysis.brevity_score,
      // Explanations from score_breakdown (not top-level columns)
      ats_explanation: scoreBreakdown.ats_analysis || scoreBreakdown.ats_explanation,
      content_explanation: scoreBreakdown.content_analysis || scoreBreakdown.content_explanation,
      structure_explanation: scoreBreakdown.structure_analysis || scoreBreakdown.structure_explanation,
      skills_explanation: scoreBreakdown.skills_analysis || scoreBreakdown.skills_explanation,
      email_explanation: scoreBreakdown.email_analysis || scoreBreakdown.email_explanation,
      length_explanation: scoreBreakdown.length_analysis || scoreBreakdown.length_explanation,
      brevity_explanation: scoreBreakdown.brevity_analysis || scoreBreakdown.brevity_explanation,
      // Tips/priority improvements from score_breakdown
      ats_tips_tip: scoreBreakdown.priority_improvements || scoreBreakdown.ats_tips,
      content_tips_tip: scoreBreakdown.content_tips,
      structure_tips_tip: scoreBreakdown.structure_tips,
      skills_tips_tip: scoreBreakdown.skills_tips,
      email_tips_tip: scoreBreakdown.email_tips,
      length_tips_tip: scoreBreakdown.length_tips,
      brevity_tips_tip: scoreBreakdown.brevity_tips
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' } as ApiError,
      { status: 500 }
    );
  }
}
