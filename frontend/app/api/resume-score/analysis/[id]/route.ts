import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import type { ApiError } from '@/types/resume-score';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' } as ApiError, 
        { status: 400 }
      );
    }
    
    // First, try to fetch upload data from resume_uploads table
    const { data: uploadData, error: uploadError } = await supabase
      .from('resume_uploads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (uploadError) {
      console.error('Upload not found:', uploadError);
      return NextResponse.json(
        { error: 'Upload not found' } as ApiError, 
        { status: 404 }
      );
    }
    
    // Try to fetch analysis data if it exists (populated by n8n)
    const { data: analysisData, error: analysisError } = await supabase
      .from('resume_analyses')
      .select('*')
      .eq('upload_id', id)
      .eq('user_id', user.id)
      .single();
    
    // Combine upload data with analysis data if available
    const responseData = {
      ...uploadData,
      analysis: analysisData || null,
      hasAnalysis: !!analysisData,
      analysisStatus: analysisData ? 'completed' : 'pending'
    };
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' } as ApiError, 
      { status: 500 }
    );
  }
}