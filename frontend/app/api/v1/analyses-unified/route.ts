import { NextRequest, NextResponse } from 'next/server';
import { withAuth, validateResourceOwnership, parseJsonBody, createErrorResponse, createSuccessResponse, getRateLimitKey } from '@/lib/auth/unifiedAuth';
import { applyRateLimit, rateLimit429, setRateLimitHeaders } from '@/app/lib/rateLimit';
import { buildIdemKey, getIdempotent } from '@/app/lib/idempotency';
import type { AuthContext } from '@/lib/auth/unifiedAuth';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
    windowMs: 60_000, // 1 minute
    max: 30, // 30 requests per minute per user
    keyPrefix: 'v1'
};

async function handleAnalyses(context: AuthContext) {
    const { user, supabase, request } = context;

    // Rate limiting
    const rateLimitKey = getRateLimitKey(request, user, 'analyses-trigger');
    const rl = applyRateLimit(rateLimitKey, RATE_LIMIT_CONFIG);
    if (!rl.allowed) {
        return rateLimit429(rl);
    }

    // Parse request body
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
        const response = parseError;
        setRateLimitHeaders(response, rl);
        return response;
    }

    const { resumeUploadId, jobTitle } = (body || {}) as { resumeUploadId?: string; jobTitle?: string };
    if (!resumeUploadId || typeof resumeUploadId !== 'string') {
        const response = createErrorResponse('resumeUploadId is required', 400);
        setRateLimitHeaders(response, rl);
        return response;
    }

    // Idempotency check
    const idemHeader = request.headers.get('Idempotency-Key');
    if (!idemHeader) {
        const response = createErrorResponse('Idempotency-Key header is required', 400);
        setRateLimitHeaders(response, rl);
        return response;
    }

    const idemKey = buildIdemKey('analyses', user.id, idemHeader);
    const cached = getIdempotent(idemKey);
    if (cached) {
        const response = createSuccessResponse(cached.payload, cached.status);
        setRateLimitHeaders(response, rl);
        return response;
    }

    // Validate resource ownership
    const ownershipValidation = await validateResourceOwnership(
        supabase,
        user.id,
        'resume_uploads',
        resumeUploadId
    );

    if (!ownershipValidation.valid) {
        const response = createErrorResponse(ownershipValidation.error || 'Access denied', 403);
        setRateLimitHeaders(response, rl);
        return response;
    }

    // Get upload data
    const { data: uploadRow, error: uploadError } = await supabase
        .from('resume_uploads')
        .select('id, user_id, resume_url, pdf_url')
        .eq('id', resumeUploadId)
        .eq('user_id', user.id)
        .single();

    if (uploadError || !uploadRow) {
        const response = createErrorResponse('Upload not found', 404);
        setRateLimitHeaders(response, rl);
        return response;
    }

    // Create analysis record
    const { data: analysisData, error: analysisError } = await supabase
        .from('resume_analyses')
        .insert({
            upload_id: resumeUploadId,
            user_id: user.id,
            status: 'processing',
            job_title: jobTitle || 'General',
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (analysisError) {
        console.error('Analysis creation error:', analysisError);
        const response = createErrorResponse('Failed to create analysis', 500);
        setRateLimitHeaders(response, rl);
        return response;
    }

    // TODO: Trigger actual analysis process (n8n webhook, etc.)

    const response = createSuccessResponse({
        analysisId: analysisData.id,
        status: 'processing',
        message: 'Analysis started successfully'
    });

    setRateLimitHeaders(response, rl);
    return response;
}

// Export the route handler with authentication middleware
export const POST = withAuth(handleAnalyses, {
    requireAuth: true,
    allowBearerToken: true,
    allowCookies: true,
    customErrorMessage: 'Authentication required to start analysis'
});
