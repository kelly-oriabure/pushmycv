// app/api/process-resume-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { processPdfUpload } from '@/app/lib/services/resumeUploadService';
import { createResumeUpload } from '@/app/lib/repositories/resumeUploadsRepo';
import { applyRateLimit, rateLimitKey } from '@/lib/rateLimit';
// import { startResumeAnalysis } from '@/app/lib/edge/resumeAnalysis'; // Detached - resume analysis is now separate

function isSupportedResumeFile(file: File): { ok: boolean; kind?: 'pdf' | 'docx' } {
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    if (type === 'application/pdf' || name.endsWith('.pdf')) return { ok: true, kind: 'pdf' };
    if (
        type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        name.endsWith('.docx')
    ) {
        return { ok: true, kind: 'docx' };
    }
    return { ok: false };
}

export async function POST(request: NextRequest) {
    // Rate limiting: 3 uploads per minute per user
    const rateLimitResult = applyRateLimit(rateLimitKey(request, 'process-upload', 'upload'), {
        windowMs: 60 * 1000, // 1 minute
        max: 3
    });

    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            { error: 'Too many upload requests' },
            { status: 429 }
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        // userId is now retrieved from server authentication

        if (!file) {
            return NextResponse.json(
                { error: 'Missing file' },
                { status: 400 }
            );
        }

        const supported = isSupportedResumeFile(file);
        if (!supported.ok) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload a PDF or DOCX.' },
                { status: 400 }
            );
        }

        // Get Supabase client
        const supabase = await getSupabaseServerClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Use the authenticated user ID
        const authenticatedUserId = user.id;

        // Process upload using the orchestrator service (text extraction + duplicate detection)
        const pdfArrayBuffer = await file.arrayBuffer();
        const orchestration = await processPdfUpload({
            supabase,
            userId: authenticatedUserId,
            pdf: {
                bytes: pdfArrayBuffer,
                name: file.name,
                size: file.size,
                type: file.type,
            },
        });

        console.log('Orchestration result:', {
            action: orchestration.action,
            uploadId: orchestration.uploadId,
            imageUrl: orchestration.imageUrl,
            pdfUrl: orchestration.pdfUrl,
            message: orchestration.message
        });

        // Handle duplicate detection results
        if (orchestration.action === 'use_existing') {
            console.log('Existing analysis found, returning for immediate redirect:', orchestration.uploadId);
            return NextResponse.json({
                success: true,
                isDuplicate: true,
                hasAnalysis: true,
                uploadId: orchestration.uploadId,
                analysis: orchestration.existingAnalysis,
                publicUrl: orchestration.imageUrl,
                pdfUrl: orchestration.pdfUrl,
                message: orchestration.message || 'Existing analysis found - redirecting to results'
            });
        }

        if (orchestration.action === 'duplicate') {
            console.log('Duplicate detected, returning existing record:', orchestration.uploadId);
            let existingResumeId: string | null = null;
            if (orchestration.uploadId) {
                const { data: existingUpload } = await (supabase.from('resume_uploads') as any)
                    .select('resume_id')
                    .eq('id', orchestration.uploadId)
                    .maybeSingle();
                existingResumeId = existingUpload?.resume_id || null;
            }

            if (!existingResumeId) {
                const { data: latestResume } = await (supabase.from('resumes') as any)
                    .select('id')
                    .eq('user_id', authenticatedUserId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                existingResumeId = latestResume?.id || null;
            }

            return NextResponse.json({
                success: true,
                isDuplicate: true,
                hasAnalysis: false,
                uploadId: orchestration.uploadId,
                resumeId: existingResumeId,
                publicUrl: orchestration.imageUrl,
                pdfUrl: orchestration.pdfUrl,
                message: orchestration.message || 'Duplicate resume detected - analysis pending'
            });
        }

        if (orchestration.action === 'update') {
            console.log('Update detected, using existing record:', orchestration.uploadId);
            let existingResumeId: string | null = null;
            if (orchestration.uploadId) {
                const { data: existingUpload } = await (supabase.from('resume_uploads') as any)
                    .select('resume_id')
                    .eq('id', orchestration.uploadId)
                    .maybeSingle();
                existingResumeId = existingUpload?.resume_id || null;
            }

            if (!existingResumeId) {
                const { data: latestResume } = await (supabase.from('resumes') as any)
                    .select('id')
                    .eq('user_id', authenticatedUserId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                existingResumeId = latestResume?.id || null;
            }

            return NextResponse.json({
                success: true,
                isUpdate: true,
                uploadId: orchestration.uploadId,
                resumeId: existingResumeId,
                publicUrl: orchestration.imageUrl,
                pdfUrl: orchestration.pdfUrl,
                message: orchestration.message || 'Resume updated successfully'
            });
        }

        // Create or update corresponding resume record for the upload
        console.log('Creating or updating resume record for user:', authenticatedUserId);

        const { data: existingResume, error: checkError } = await supabase
            .from('resumes')
            .select('id')
            .eq('user_id', authenticatedUserId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        let resumeData;
        let resumeError;

        if (existingResume && !checkError) {
            console.log('Updating existing resume record:', existingResume.id);
            const { data: updatedResume, error: updateError } = await (supabase.from('resumes') as any)
                .update({
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingResume.id)
                .select('id')
                .single();

            resumeData = updatedResume;
            resumeError = updateError;
        } else {
            console.log('Creating new resume record for user:', authenticatedUserId);
            const { data: newResume, error: insertError } = await (supabase.from('resumes') as any)
                .insert({
                    title: 'Untitled Resume',
                    user_id: authenticatedUserId,
                    template_id: null,
                    template_name: null,
                    color: null,
                })
                .select('id')
                .single();

            resumeData = newResume;
            resumeError = insertError;
        }

        if (resumeError) {
            console.error('Failed to create resume record:', resumeError);
            return NextResponse.json(
                { error: 'Failed to create resume record', details: (resumeError as any)?.message || resumeError },
                { status: 500 }
            );
        }

        console.log('Resume record prepared successfully:', resumeData?.id);

        // Generate file path BEFORE creating the resume upload record
        const fileExt = file.name.split('.').pop();
        const folder = supported.kind === 'docx' ? 'resume-docs' : 'resume-pdfs';
        const fileName = `${folder}/${authenticatedUserId}/${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage FIRST to obtain public URL required by NOT NULL constraint
        const fileBuffer = Buffer.from(pdfArrayBuffer);
        const { error: uploadStorageError } = await supabase.storage
            .from('resume-analyses')
            .upload(fileName, fileBuffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadStorageError) {
            console.error('Failed to upload file to storage:', uploadStorageError);
            return NextResponse.json(
                { error: 'Failed to upload file', details: uploadStorageError.message },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('resume-analyses')
            .getPublicUrl(fileName);
        console.log('process-resume-upload: publicUrl from storage:', publicUrl);

        // Create resume upload record with all required fields (include resume_url and pdf_url at insert time)
        const insertPayload = {
            user_id: authenticatedUserId,
            resume_id: resumeData?.id,
            file_name: file.name,
            file_path: fileName,
            file_type: file.type,
            file_size: file.size,
            resume_url: publicUrl,
            pdf_url: publicUrl,
            content_hash: orchestration.extractedData?.contentHash || null,
            email_hash: orchestration.extractedData?.emailHash || null,
            phone_hash: orchestration.extractedData?.phoneHash || null,
            composite_hash: orchestration.extractedData?.compositeHash || null,
            extracted_text: orchestration.extractedData?.fullText || '',
            extracted_email: orchestration.extractedData?.primaryEmail || null,
            extracted_phone: orchestration.extractedData?.primaryPhone || null,
        } as const;
        console.log('process-resume-upload: insert payload preview (without text):', {
            ...insertPayload,
            extracted_text: `length:${(insertPayload.extracted_text || '').length}`
        });
        const { data: uploadData, error: uploadError } = await createResumeUpload(supabase, insertPayload);

        if (uploadError) {
            console.error('Failed to create resume upload record:', uploadError);
            // Best-effort cleanup of uploaded file to avoid orphaned storage objects
            try {
                await supabase.storage.from('resume-analyses').remove([fileName]);
            } catch (cleanupErr) {
                console.warn('Failed to cleanup storage after DB insert error:', cleanupErr);
            }
            return NextResponse.json(
                { error: 'Failed to create resume upload record', details: uploadError },
                { status: 500 }
            );
        }

        // Trigger extraction in background
        const baseUrl = request.nextUrl.origin;
        console.log('Triggering extraction for resume:', resumeData?.id, 'upload:', uploadData?.id);

        fetch(`${baseUrl}/api/extract-resume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resumeId: resumeData?.id,
                uploadId: uploadData?.id
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Extraction API returned ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Extraction completed successfully:', data);
            })
            .catch(err => {
                console.error('Extraction failed:', err);
                // Don't fail the upload if extraction fails
            });

        // Note: Resume analysis (n8n flow) is now completely separate from form extraction
        // It can be triggered separately when needed via the resume analysis page
        // This prevents timeouts from blocking the user experience

        const isUpdate = existingResume && !checkError;

        return NextResponse.json({
            success: true,
            uploadId: uploadData?.id,
            resumeId: resumeData?.id, // Return the resume ID for the frontend
            publicUrl,
            extractionStatus: 'processing',
            isUpdate: isUpdate,
            message: isUpdate
                ? 'Resume updated, extracting data...'
                : 'Resume uploaded, extracting data...'
        });

    } catch (error) {
        console.error('Error processing resume upload:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
