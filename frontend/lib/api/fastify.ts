/**
 * API Client for pushmycv-api (Fastify Backend)
 * 
 * This file documents the expected API interface from pushmycv-api.
 * When modifying these endpoints, check the corresponding routes in:
 * - pushmycv-api/src/routes/resumes.ts
 * - pushmycv-api/src/routes/queue.ts
 */

// Type definitions for API responses
// Corresponds to: pushmycv-agentic/models/resume.py (ResumeAnalysisResult, AnalysisScores)
interface ResumeAnalysisResult {
  upload_id: string;
  user_id: string;
  job_title?: string;
  scores: {
    overall_score: number;
    ats_score: number;
    tone_score: number;
    content_score: number;
    structure_score: number;
    skills_score: number;
    email_score: number;
  };
  suggestions: Array<{
    section: string;
    priority: 'high' | 'medium' | 'low';
    issue: string;
    recommendation: string;
    example?: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_FASTIFY_API_URL || 'http://localhost:3001';

/**
 * Start resume analysis workflow
 * Corresponds to: pushmycv-api/src/routes/resumes.ts
 * Queues job for: pushmycv-agentic/workflows/resume_analysis.py
 */
export async function startResumeAnalysis(
  uploadId: string,
  userId: string,
  jobTitle?: string,
  jobDescription?: string
): Promise<{ workflowId: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/resumes/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      upload_id: uploadId,
      user_id: userId,
      job_title: jobTitle,
      job_description: jobDescription,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start analysis: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get analysis results
 * Corresponds to: pushmycv-api/src/routes/resumes.ts
 * Data stored by: pushmycv-agentic (writes to job_matches table)
 */
export async function getResumeAnalysis(
  analysisId: string
): Promise<ResumeAnalysisResult | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/resumes/analysis/${analysisId}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to get analysis: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check workflow status
 * Corresponds to: pushmycv-api/src/routes/queue.ts
 * Status managed by: pushmycv-api queue system
 */
export async function getWorkflowStatus(
  workflowId: string
): Promise<{
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  current_step: number;
  total_steps: number;
  error?: string;
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workflows/${workflowId}`
  );

  if (!response.ok) {
    throw new Error(`Failed to get workflow status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get queue statistics
 * Corresponds to: pushmycv-api/src/routes/queue.ts
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  done: number;
  failed: number;
  total: number;
}> {
  const response = await fetch(`${API_BASE_URL}/queue/stats`);

  if (!response.ok) {
    throw new Error(`Failed to get queue stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Poll for analysis completion
 * Helper that polls until analysis is complete
 */
export async function pollForAnalysis(
  workflowId: string,
  onProgress?: (status: { current_step: number; total_steps: number }) => void,
  interval = 2000,
  maxAttempts = 60
): Promise<ResumeAnalysisResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getWorkflowStatus(workflowId);
    
    onProgress?.({
      current_step: status.current_step,
      total_steps: status.total_steps,
    });

    if (status.status === 'completed') {
      const result = await getResumeAnalysis(workflowId);
      if (result) return result;
      throw new Error('Workflow completed but result not found');
    }

    if (status.status === 'failed') {
      throw new Error(`Workflow failed: ${status.error || 'Unknown error'}`);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Polling timeout');
}
