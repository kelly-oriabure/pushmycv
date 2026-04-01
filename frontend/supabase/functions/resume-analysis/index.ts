import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Parse request body
    const { resumeUploadId, analysisId, resumeUrl, pdfUrl, jobTitle = 'General', userId } = await req.json();

    // Support both old (analysisId) and new (resumeUploadId) formats for backward compatibility
    if (!resumeUploadId && !analysisId) {
      return new Response(JSON.stringify({
        error: 'Missing required field: resumeUploadId or analysisId'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    let finalAnalysisId = analysisId;

    // If using new structure with resumeUploadId, create a new analysis record
    if (resumeUploadId) {
      // Get resume upload data
      const { data: resumeUpload, error: fetchError } = await supabase
        .from('resume_uploads')
        .select('*')
        .eq('id', resumeUploadId)
        .single();

      if (fetchError || !resumeUpload) {
        return new Response(JSON.stringify({
          error: 'Resume upload not found'
        }), {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // Idempotency: if an analysis already exists for this upload, reuse it
      const { data: existingAnalysis, error: existingError } = await supabase
        .from('resume_analyses')
        .select('id')
        .eq('upload_id', resumeUploadId)
        .maybeSingle();

      let newAnalysis = existingAnalysis as { id: string } | null;
      let insertError = null as unknown as Error | null;

      // Create new analysis record linked to resume upload only if not found
      if (!newAnalysis) {
        const insertRes = await supabase
          .from('resume_analyses')
          .insert({
            upload_id: resumeUploadId,
            user_id: resumeUpload.user_id,
            job_title: jobTitle,
            status: 'processing',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        newAnalysis = insertRes.data as { id: string } | null;
        insertError = insertRes.error as any;
      }

      if (insertError || !newAnalysis) {
        console.error('Error creating analysis record:', insertError);
        return new Response(JSON.stringify({
          error: 'Failed to create analysis record'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      finalAnalysisId = newAnalysis.id;
    }
    // Update analysis status to 'processing' (only if using old format)
    if (!resumeUploadId) {
      const { error: updateError } = await supabase.from('resume_analyses').update({
        status: 'processing',
        updated_at: new Date().toISOString()
      }).eq('id', finalAnalysisId);

      if (updateError) {
        console.error('Error updating analysis status:', updateError);
        return new Response(JSON.stringify({
          error: 'Failed to update analysis status'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // Prepare payload for n8n webhook
    const webhookPayload = {
      analysisId: finalAnalysisId,
      resumeUploadId: resumeUploadId || null,
      resumeUrl,
      pdfUrl,
      jobTitle,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString()
    };
    // Call n8n webhook with 30-second timeout
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL') || 'https://agents.flowsyntax.com/webhook/9cd7d433-2d2d-4f55-8853-8b7b4f621841';
    console.log('Calling n8n webhook with payload:', webhookPayload);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds
    
    let webhookResponse;
    let webhookResult;
    
    try {
      webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Idempotency key so downstream (n8n) can dedupe retried requests
          'Idempotency-Key': String(resumeUploadId || finalAnalysisId || '')
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!webhookResponse.ok) {
        console.error('Webhook call failed:', webhookResponse.status, await webhookResponse.text());
        // Update analysis status to 'failed'
        await supabase.from('resume_analyses').update({
          status: 'failed',
          error_message: `Webhook call failed with status ${webhookResponse.status}`,
          updated_at: new Date().toISOString()
        }).eq('id', finalAnalysisId);
        
        return new Response(JSON.stringify({
          error: 'Failed to process resume analysis'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      
      webhookResult = await webhookResponse.json();
      console.log('Webhook response:', webhookResult);

      await supabase.from('resume_analyses').update({
        status: 'completed',
        error_message: null,
        updated_at: new Date().toISOString()
      }).eq('id', finalAnalysisId);
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Check if error is due to timeout
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Webhook call timed out after 30 seconds');
        
        // Update analysis status to 'failed' with timeout message
        await supabase.from('resume_analyses').update({
          status: 'failed',
          error_message: 'Analysis timed out after 30 seconds - please retry',
          updated_at: new Date().toISOString()
        }).eq('id', finalAnalysisId);
        
        return new Response(JSON.stringify({
          error: 'Resume analysis timed out',
          message: 'The analysis took too long to complete. Please try again.',
          analysisId: finalAnalysisId
        }), {
          status: 504, // Gateway Timeout
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Re-throw other errors to be caught by outer catch block
      throw error;
    }
    // Return success response
    return new Response(JSON.stringify({
      success: true,
      analysisId: finalAnalysisId,
      resumeUploadId: resumeUploadId || null,
      message: 'Resume analysis initiated successfully',
      webhookResponse: webhookResult
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
