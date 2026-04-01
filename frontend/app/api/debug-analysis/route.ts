import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/integrations/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || 'c44fd15f-da82-4861-87bd-fb4fb330ea26';
    
    // For debugging, we'll use service role to bypass auth
    const results: any = {
      searchId: id,
      timestamp: new Date().toISOString()
    };

    // Check resume_uploads table
    const { data: uploadData, error: uploadError } = await supabase
      .from('resume_uploads')
      .select('*')
      .eq('id', id);
    
    results.resume_uploads = {
      found: uploadData && uploadData.length > 0,
      count: uploadData?.length || 0,
      data: uploadData,
      error: uploadError
    };

    // Check resume_analyses table by ID
    const { data: analysisData, error: analysisError } = await supabase
      .from('resume_analyses')
      .select('*')
      .eq('id', id);
    
    results.resume_analyses_by_id = {
      found: analysisData && analysisData.length > 0,
      count: analysisData?.length || 0,
      data: analysisData,
      error: analysisError
    };

    // Check resume_analyses table by upload_id
    const { data: analysisUploadData, error: analysisUploadError } = await supabase
      .from('resume_analyses')
      .select('*')
      .eq('upload_id', id);
    
    results.resume_analyses_by_upload_id = {
      found: analysisUploadData && analysisUploadData.length > 0,
      count: analysisUploadData?.length || 0,
      data: analysisUploadData,
      error: analysisUploadError
    };

    // Get all resume_uploads (limited to 10)
    const { data: allUploads, error: allUploadsError } = await supabase
      .from('resume_uploads')
      .select('id, file_name, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    results.all_user_uploads = {
      count: allUploads?.length || 0,
      data: allUploads,
      error: allUploadsError
    };

    // Get all resume_analyses (limited to 10)
    const { data: allAnalyses, error: allAnalysesError } = await supabase
      .from('resume_analyses')
      .select('id, upload_id, user_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    results.all_user_analyses = {
      count: allAnalyses?.length || 0,
      data: allAnalyses,
      error: allAnalysesError
    };

    return NextResponse.json(results, { status: 200 });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}