import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Analysis history item for dashboard display
 */
export interface AnalysisHistoryItem {
  analysis_id: string;
  upload_id: string;
  file_name: string;
  overall_score: number;
  status: 'completed' | 'processing' | 'failed';
  created_at: string;
  job_title?: string;
}

/**
 * Full analysis data with upload details
 */
export interface AnalysisWithUpload {
  id: string;
  user_id: string;
  upload_id: string;
  job_title?: string;
  overall_score: number;
  ats_score?: number;
  content_score?: number;
  tone_score?: number;
  structure_score?: number;
  skills_score?: number;
  email_score?: number;
  score_breakdown?: any;
  suggestions?: string[];
  status: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  // Joined from resume_uploads
  upload?: {
    file_name: string;
    file_path?: string;
    pdf_url?: string;
    image_url?: string;
  };
}

/**
 * Get user's analysis history for dashboard display
 */
export async function getUserAnalysisHistory(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 10
): Promise<AnalysisHistoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('resume_analyses')
      .select(`
        id,
        upload_id,
        overall_score,
        status,
        created_at,
        job_title,
        resume_uploads!inner(file_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching analysis history:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      analysis_id: item.id,
      upload_id: item.upload_id,
      file_name: item.resume_uploads?.file_name || 'Unknown file',
      overall_score: item.overall_score || 0,
      status: item.status,
      created_at: item.created_at,
      job_title: item.job_title,
    }));
  } catch (error) {
    console.error('Unexpected error in getUserAnalysisHistory:', error);
    return [];
  }
}

/**
 * Get full analysis data by upload ID
 */
export async function getAnalysisByUploadId(
  supabase: SupabaseClient,
  uploadId: string,
  userId: string
): Promise<AnalysisWithUpload | null> {
  try {
    const { data, error } = await supabase
      .from('resume_analyses')
      .select(`
        *,
        resume_uploads(file_name, file_path, pdf_url, image_url)
      `)
      .eq('upload_id', uploadId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No analysis found
      }
      console.error('Error fetching analysis by upload ID:', error);
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      upload: data.resume_uploads,
    } as AnalysisWithUpload;
  } catch (error) {
    console.error('Unexpected error in getAnalysisByUploadId:', error);
    return null;
  }
}

/**
 * Quick check if analysis exists for an upload
 */
export async function getAnalysisForDuplicateCheck(
  supabase: SupabaseClient,
  uploadId: string,
  userId: string
): Promise<{ exists: boolean; isComplete: boolean; analysis?: any }> {
  try {
    const { data, error } = await supabase
      .from('resume_analyses')
      .select('id, status, overall_score')
      .eq('upload_id', uploadId)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { exists: false, isComplete: false };
      }
      throw error;
    }

    return {
      exists: true,
      isComplete: data?.status === 'completed',
      analysis: data,
    };
  } catch (error) {
    console.error('Error checking analysis for duplicate:', error);
    return { exists: false, isComplete: false };
  }
}

/**
 * Get count of analyses by status
 */
export async function getAnalysisStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  total: number;
  completed: number;
  processing: number;
  failed: number;
  averageScore: number;
}> {
  try {
    const { data, error } = await supabase
      .from('resume_analyses')
      .select('status, overall_score')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching analysis stats:', error);
      return { total: 0, completed: 0, processing: 0, failed: 0, averageScore: 0 };
    }

    const analyses = data || [];
    const completed = analyses.filter((a: any) => a.status === 'completed');
    const totalScore = completed.reduce((sum: number, a: any) => sum + (a.overall_score || 0), 0);

    return {
      total: analyses.length,
      completed: completed.length,
      processing: analyses.filter((a: any) => a.status === 'processing').length,
      failed: analyses.filter((a: any) => a.status === 'failed').length,
      averageScore: completed.length > 0 ? Math.round(totalScore / completed.length) : 0,
    };
  } catch (error) {
    console.error('Unexpected error in getAnalysisStats:', error);
    return { total: 0, completed: 0, processing: 0, failed: 0, averageScore: 0 };
  }
}
