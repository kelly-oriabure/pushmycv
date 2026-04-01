import type { SupabaseClient } from '@supabase/supabase-js';
import { invokeEdgeFunction, type InvokeOptions } from './invokeEdgeFunction';

// Types aligned with supabase/functions/resume-analysis/index.ts expectations
export type ResumeAnalysisRequest = {
  resumeUploadId?: string; // preferred in new flow
  analysisId?: string;     // backward compatibility
  jobTitle?: string;
  userId?: string;
  resumeUrl?: string;
  pdfUrl?: string;
};

export type ResumeAnalysisResponse = {
  success: boolean;
  analysisId: string;
  resumeUploadId: string | null;
  message: string;
  webhookResponse?: unknown;
};

// Start resume analysis via Edge Function
// Reason: Centralize payload building and validation for this specific function
export async function startResumeAnalysis(
  supabase: SupabaseClient,
  req: ResumeAnalysisRequest,
  opts?: InvokeOptions
): Promise<ResumeAnalysisResponse> {
  if (!req.resumeUploadId && !req.analysisId) {
    throw new Error('resumeUploadId or analysisId is required');
  }

  // Ensure idempotency header is present for downstream systems (e.g., n8n)
  const idempotencyKey = String(req.resumeUploadId || req.analysisId);
  const mergedOpts: InvokeOptions = {
    ...opts,
    headers: {
      ...(opts?.headers || {}),
      'Idempotency-Key': idempotencyKey,
    },
  };

  return invokeEdgeFunction<ResumeAnalysisRequest, ResumeAnalysisResponse>(
    supabase,
    'resume-analysis',
    req,
    mergedOpts
  );
}
