import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/integrations/supabase/server';

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    domain: request.headers.get('host'),
    userAgent: request.headers.get('user-agent'),
  };

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({
      ...results,
      error: 'Missing id parameter',
      usage: 'Add ?id=YOUR_UPLOAD_ID to test specific record'
    });
  }

  results.testId = id;

  try {
    // Test Supabase client creation
    const supabase = await getSupabaseServerClient();
    results.supabaseClientCreated = true;

    // Test authentication
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      results.authCheck = {
        hasUser: !!user,
        userId: user?.id,
        error: authError?.message
      };

      if (user) {
        // Test database connectivity with authenticated user
        try {
          const { data: uploadData, error: uploadError } = await supabase
            .from('resume_uploads')
            .select('id, user_id, file_name, created_at')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

          results.uploadQuery = {
            found: !!uploadData,
            data: uploadData,
            error: uploadError?.message
          };

          if (uploadData) {
            // Test analysis query
            const { data: analysisData, error: analysisError } = await supabase
              .from('resume_analyses')
              .select('id, upload_id, status, overall_score, created_at')
              .eq('upload_id', id)
              .eq('user_id', user.id)
              .single();

            results.analysisQuery = {
              found: !!analysisData,
              data: analysisData,
              error: analysisError?.message
            };
          }
        } catch (dbError) {
          results.databaseError = dbError instanceof Error ? dbError.message : 'Unknown database error';
        }
      }
    } catch (authError) {
      results.authError = authError instanceof Error ? authError.message : 'Unknown auth error';
    }
  } catch (supabaseError) {
    results.supabaseError = supabaseError instanceof Error ? supabaseError.message : 'Unknown Supabase error';
  }

  return NextResponse.json(results, { status: 200 });
}