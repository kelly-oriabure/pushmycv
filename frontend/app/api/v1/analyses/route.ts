import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { applyRateLimit, rateLimit429, setRateLimitHeaders } from '@/app/lib/rateLimit';
import { startResumeAnalysis } from '@/app/lib/edge/resumeAnalysis';
import { buildIdemKey, getIdempotent, setIdempotent } from '@/app/lib/idempotency';
import { ApiValidator, requestSchemas } from '@/lib/validation/apiValidation';
import { StandardErrorHandler, StandardSuccessHandler, ErrorCode } from '@/lib/errors/standardErrors';

function getIp(req: NextRequest) {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Auth
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return StandardErrorHandler.createAuthError(ErrorCode.UNAUTHORIZED);
    }

    // Rate limit: 30/min/user
    const key = `u:${user.id}:trigger`;
    const rl = applyRateLimit(key, { windowMs: 60_000, max: 30, keyPrefix: 'v1' });
    if (!rl.allowed) {
      return rateLimit429(rl);
    }

    // Validate request body using standardized validation
    const validation = await ApiValidator.validateBody(request, requestSchemas.resumeAnalysis);
    if (!validation.success) {
      const response = NextResponse.json(validation.error, { status: 400 });
      setRateLimitHeaders(response, rl);
      return response;
    }

    const { resumeUploadId, jobTitle } = validation.data;

    // Idempotency: require header and serve cached response if exists
    const idemHeader = request.headers.get('Idempotency-Key');
    if (!idemHeader) {
      const response = StandardErrorHandler.createErrorResponse(
        ErrorCode.MISSING_REQUIRED_FIELD,
        { field: 'Idempotency-Key header' },
        'Idempotency-Key header is required'
      );
      setRateLimitHeaders(response, rl);
      return response;
    }
    const idemKey = buildIdemKey('analyses', user.id, idemHeader);
    const cached = getIdempotent(idemKey);
    if (cached) {
      const res = NextResponse.json(cached.payload, { status: cached.status });
      setRateLimitHeaders(res, rl);
      return res;
    }

    // Ownership check: ensure upload belongs to current user
    const { data: uploadRow, error: uploadError } = await supabase
      .from('resume_uploads')
      .select('id, user_id, resume_url, pdf_url')
      .eq('id', resumeUploadId)
      .eq('user_id', user.id)
      .single();

    if (uploadError || !uploadRow) {
      const response = StandardErrorHandler.createErrorResponse(
        ErrorCode.RECORD_NOT_FOUND,
        undefined,
        'Upload not found'
      );
      setRateLimitHeaders(response, rl);
      return response;
    }

    // Trigger analysis via Edge Function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const analysisRes = await startResumeAnalysis(
        supabase as any,
        {
          resumeUploadId,
          userId: user.id,
          jobTitle,
          resumeUrl: (uploadRow as any).resume_url ?? undefined,
          pdfUrl: (uploadRow as any).pdf_url ?? undefined,
        },
        accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined
      );

      const response = StandardSuccessHandler.createSuccessResponse(analysisRes, 'Analysis triggered successfully');
      // store idempotent success response
      setIdempotent(idemKey, analysisRes, 200);
      setRateLimitHeaders(response, rl);
      return response;
    } catch (err: any) {
      console.error('[v1][analyses][POST] startResumeAnalysis error:', err?.message || err);
      const response = StandardErrorHandler.createErrorResponse(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        { message: err?.message || 'Unknown error' },
        'Failed to trigger analysis'
      );
      setRateLimitHeaders(response, rl);
      return response;
    }
  } catch (error) {
    console.error('[v1][analyses][POST] unexpected error:', error);
    return StandardErrorHandler.createInternalError(
      error instanceof Error ? error.message : 'Unknown error',
      'Analysis request failed'
    );
  }
}
