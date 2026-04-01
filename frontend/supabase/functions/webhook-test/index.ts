import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Make POST request to the n8n webhook with sample resume data
    const webhookUrl = 'https://agents.flowsyntax.com/webhook/ff6d33b5-6184-4814-a945-efb3c5ac1052';
    
    // Sample resume data for testing
    const sampleData = {
      fileName: 'sample-resume.pdf',
      jobTitle: 'Software Developer',
      resumeUrl: 'https://example.com/sample-resume.pdf',
      pdfUrl: 'https://example.com/sample-resume.pdf',
      timestamp: new Date().toISOString(),
      analysisId: 'test-analysis-123',
      userId: 'test-user-456'
    };
    
    console.log('Making POST request to:', webhookUrl);
    console.log('Sample data:', JSON.stringify(sampleData, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sampleData)
    });

    const responseText = await response.text();
    console.log('Webhook response status:', response.status);
    console.log('Webhook response:', responseText);

    // Parse response as JSON if possible
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    // Return the webhook response
    return new Response(JSON.stringify({
      success: true,
      webhookUrl,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      timestamp: new Date().toISOString()
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
      success: false,
      error: 'Failed to call webhook',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});