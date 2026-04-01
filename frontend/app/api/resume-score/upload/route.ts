import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { detectDuplicateResume } from '@/app/lib/duplicates/detection';
import { getPrimaryContact } from '@/app/lib/text-extraction/pdf';
import { processPdfUpload } from '@/app/lib/services/resumeUploadService';
import { createResumeUpload, updateResumeUpload } from '@/app/lib/repositories/resumeUploadsRepo';
import { startResumeAnalysisViaApi } from '@/app/lib/services/resumeAnalysisService';
import { withRateLimit, rateLimitKey } from '@/app/lib/rateLimit';

async function handlePOST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Upload PDF
    const fileName = `${uuidv4()}.pdf`;
    const filePath = `resume-pdfs/${user.id}/${fileName}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('resume-analyses')
      .upload(filePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('resume-analyses')
      .getPublicUrl(filePath);

    // Extract text
    let extractedData: any = null;
    let orchestration: any = null;

    try {
      orchestration = await processPdfUpload({
        supabase,
        userId: user.id,
        pdf: {
          bytes: fileBuffer,
          name: file.name,
          size: file.size,
          type: file.type,
        },
      });

      extractedData = {
        fullText: orchestration.extractedData?.fullText || '',
        contactInfo: {
          emails: orchestration.extractedData?.emails || [],
          phones: orchestration.extractedData?.phones || [],
        },
        contentHash: orchestration.extractedData?.contentHash || null,
        emailHash: orchestration.extractedData?.emailHash || null,
        phoneHash: orchestration.extractedData?.phoneHash || null,
        compositeHash: orchestration.extractedData?.compositeHash || null,
      };

      // Log extracted content for debugging
      console.log('\n=== EXTRACTED RESUME CONTENT ===');
      console.log('Text length:', extractedData.fullText.length);
      console.log('First 500 chars:', extractedData.fullText.substring(0, 500));
      console.log('Emails found:', extractedData.contactInfo.emails);
      console.log('Phones found:', extractedData.contactInfo.phones);
      console.log('Content hash:', extractedData.contentHash);
      console.log('=== END EXTRACTED CONTENT ===\n');
    } catch (e) {
      extractedData = {
        fullText: '',
        contactInfo: { emails: [], phones: [] },
        contentHash: null,
        emailHash: null,
        phoneHash: null,
        compositeHash: null,
      };
    }

    const { primaryEmail, primaryPhone } = getPrimaryContact(extractedData.contactInfo);

    // Duplicate detection
    const duplicateResult = orchestration
      ? {
        action: orchestration.action,
        existingRecord: orchestration.uploadId
          ? { id: orchestration.uploadId, pdf_url: orchestration.pdfUrl }
          : undefined,
        isDuplicate: orchestration.action === 'duplicate',
        shouldUpdate: orchestration.action === 'update',
        message: orchestration.message,
      }
      : await detectDuplicateResume(
        supabase,
        {
          contentHash: extractedData?.contentHash || '',
          emailHash: extractedData?.emailHash,
          phoneHash: extractedData?.phoneHash,
          compositeHash: extractedData?.compositeHash || '',
          fullText: extractedData?.fullText || '',
        },
        user.id
      );

    if (duplicateResult.action === 'duplicate') {
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        uploadId: duplicateResult.existingRecord?.id,
        pdfUrl: duplicateResult.existingRecord?.pdf_url,
        message: duplicateResult.message,
      });
    }

    if (duplicateResult.action === 'update' && duplicateResult.existingRecord) {
      await updateResumeUpload(supabase as any, duplicateResult.existingRecord.id, {
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        pdf_url: publicUrl,
        resume_url: publicUrl, // Required by DB constraint
        content_hash: extractedData?.contentHash || null,
        composite_hash: extractedData?.compositeHash || null,
        extracted_text: extractedData?.fullText || ''
      } as any);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        await startResumeAnalysisViaApi({
          resumeUploadId: duplicateResult.existingRecord.id,
          userId: user.id,
          pdfUrl: publicUrl,
          rawText: extractedData?.fullText || '',
        }, session?.access_token);
      } catch (e) {
        console.error('Analysis trigger error:', e);
      }

      return NextResponse.json({
        success: true,
        isUpdate: true,
        uploadId: duplicateResult.existingRecord.id,
        pdfUrl: publicUrl,
        message: duplicateResult.message,
      });
    }

    // Create new record
    const { data, error: repoError } = await createResumeUpload(supabase, {
      user_id: user.id,
      file_path: filePath,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      pdf_url: publicUrl,
      resume_url: publicUrl, // Required by DB constraint, using same as pdf_url
      content_hash: extractedData?.contentHash || null,
      email_hash: extractedData?.emailHash || null,
      phone_hash: extractedData?.phoneHash || null,
      composite_hash: extractedData?.compositeHash || null,
      extracted_email: primaryEmail,
      extracted_phone: primaryPhone,
      extracted_text: extractedData?.fullText || ''
    } as any);

    if (!data) {
      console.error('[Upload] Failed to create upload record:', repoError);
      return NextResponse.json({ error: 'Failed to create upload record', details: repoError }, { status: 500 });
    }

    // Trigger resume analysis
    try {
      console.log('[Upload] Triggering analysis for upload:', data.id);
      const { data: { session } } = await supabase.auth.getSession();
      const analysisResult = await startResumeAnalysisViaApi({
        resumeUploadId: data.id,
        userId: user.id,
        pdfUrl: publicUrl,
        rawText: extractedData?.fullText || '',
      }, session?.access_token);
      console.log('[Upload] Analysis triggered:', analysisResult);
    } catch (e) {
      console.error('[Upload] Analysis trigger error:', e);
    }

    return NextResponse.json({
      success: true,
      isNew: true,
      uploadId: data.id,
      pdfUrl: publicUrl,
      message: 'Resume uploaded successfully',
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePOST, {
  getKey: (req) => rateLimitKey(req, 'resume-score-upload', 'rl-score'),
  options: {
    windowMs: 60 * 1000,
    max: 5,
    keyPrefix: 'resume-score-upload',
  },
});
