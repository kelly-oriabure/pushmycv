/**
 * Resume Analysis Service
 * Replaces Edge Function calls with Fastify API calls
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const FASTIFY_API_URL = process.env.NEXT_PUBLIC_FASTIFY_API_URL || 'http://localhost:3001';

export interface ResumeAnalysisRequest {
  resumeUploadId: string;
  userId: string;
  jobTitle?: string;
  jobDescription?: string;
  resumeUrl?: string;
  pdfUrl?: string;
  rawText?: string;
}

export interface ResumeAnalysisResponse {
  success: boolean;
  workflowId: string;
  message: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

/**
 * Start resume analysis via Fastify API (replaces Edge Function)
 */
export async function startResumeAnalysisViaApi(
  request: ResumeAnalysisRequest,
  accessToken?: string
): Promise<ResumeAnalysisResponse> {
  console.log('[Analysis] Starting analysis via API:', request.resumeUploadId);
  
  const response = await fetch(`${FASTIFY_API_URL}/api/v1/resumes/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('[Analysis] Failed to start:', error);
    throw new Error(error.error || `Failed to start analysis: ${response.statusText}`);
  }

  const result = await response.json();
  console.log('[Analysis] Started successfully:', result);
  return result;
}

/**
 * Get analysis status from Fastify API
 */
export async function getAnalysisStatus(
  workflowId: string,
  accessToken?: string
): Promise<{
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  current_step: number;
  total_steps: number;
  result?: any;
  error?: string;
}> {
  const response = await fetch(`${FASTIFY_API_URL}/api/v1/workflows/${workflowId}`, {
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Failed to get status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Poll for analysis completion
 */
export async function pollForAnalysis(
  workflowId: string,
  accessToken?: string,
  onProgress?: (status: { current_step: number; total_steps: number }) => void,
  interval = 2000,
  maxAttempts = 60
): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getAnalysisStatus(workflowId, accessToken);

    onProgress?.({
      current_step: status.current_step,
      total_steps: status.total_steps,
    });

    if (status.status === 'completed') {
      return status.result;
    }

    if (status.status === 'failed') {
      throw new Error(`Analysis failed: ${status.error || 'Unknown error'}`);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Analysis timeout');
}
