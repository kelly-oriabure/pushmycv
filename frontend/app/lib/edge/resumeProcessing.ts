import type { SupabaseClient } from '@supabase/supabase-js';
import { invokeEdgeFunction, type InvokeOptions } from './invokeEdgeFunction';

// Types for resume processing request
export type ResumeProcessingRequest = {
  resumeUploadId: string;
  userId?: string;
  // Add any other fields needed for processing
};

export type ResumeProcessingResponse = {
  success: boolean;
  message: string;
  // Add any response fields you expect from the processing webhook
};

// Start resume processing via n8n webhook
export async function startResumeProcessing(
  supabase: SupabaseClient,
  req: ResumeProcessingRequest,
  opts?: InvokeOptions
): Promise<ResumeProcessingResponse> {
  if (!req.resumeUploadId) {
    throw new Error('resumeUploadId is required');
  }

  // For now, we'll call the processing webhook directly
  // In production, you might want to create a dedicated edge function
  const processingWebhookUrl = 'https://agents.flowsyntax.com/webhook-test/6168a9d5-4c0f-4022-abff-82604a4fd013';
  
  try {
    // Get resume upload data to send with the webhook
    const { data: resumeUpload, error: fetchError } = await supabase
      .from('resume_uploads')
      .select('*')
      .eq('id', req.resumeUploadId)
      .single();

    if (fetchError || !resumeUpload) {
      throw new Error('Resume upload not found');
    }

    // Prepare payload for n8n processing webhook
    const webhookPayload = {
      resumeUploadId: req.resumeUploadId,
      userId: req.userId || 'anonymous',
      resumeData: {
        fileName: resumeUpload.file_name,
        fileType: resumeUpload.file_type,
        fileSize: resumeUpload.file_size,
        resumeUrl: resumeUpload.resume_url,
        pdfUrl: resumeUpload.pdf_url,
        extractedText: resumeUpload.extracted_text,
        // Add any other fields needed for processing
      },
      timestamp: new Date().toISOString()
    };

    console.log('Calling n8n processing webhook with payload:', webhookPayload);
    
    const webhookResponse = await fetch(processingWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Idempotency key so downstream (n8n) can dedupe retried requests
        'Idempotency-Key': String(req.resumeUploadId)
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Processing webhook call failed:', webhookResponse.status, errorText);
      throw new Error(`Processing webhook call failed with status ${webhookResponse.status}: ${errorText}`);
    }

    const result = await webhookResponse.json();
    console.log('Processing webhook response:', result);

    return {
      success: true,
      message: 'Resume processing initiated successfully',
      // Include any relevant response data
    };

  } catch (error) {
    console.error('Failed to start resume processing:', error);
    throw error;
  }
}
