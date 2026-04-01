import type { SupabaseClient } from '@supabase/supabase-js';
import type { ResumeUploadCreateInput, ResumeUploadUpdateInput } from '../types/resume';

// Repository for resume_uploads table operations
// Keep thin and focused on DB I/O. Business logic stays in services.

export interface CreateResumeUploadResult {
  id: string;
}

export async function createResumeUpload(
  supabase: SupabaseClient,
  payload: ResumeUploadCreateInput
): Promise<{ data?: CreateResumeUploadResult; error?: string; code?: string }> {
  try {
    console.log('[Repo] Creating resume upload with payload:', {
      user_id: payload.user_id,
      file_name: payload.file_name,
      file_type: payload.file_type,
      file_size: payload.file_size,
      has_extracted_text: !!payload.extracted_text,
      text_length: payload.extracted_text?.length
    });
    
    const { data, error } = await supabase
      .from('resume_uploads')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error('[Repo] Supabase insert error:', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint
      });
      return { error: error.message, code: (error as any).code };
    }

    return { data: { id: (data as any).id } };
  } catch (e: any) {
    console.error('[Repo] Repository exception:', e);
    return { error: e?.message || 'Unknown repository error' };
  }
}

export async function updateResumeUpload(
  supabase: SupabaseClient,
  id: string,
  payload: ResumeUploadUpdateInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('resume_uploads')
      .update(payload)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Unknown repository error' };
  }
}
