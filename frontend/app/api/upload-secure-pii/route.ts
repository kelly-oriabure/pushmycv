import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createErrorResponse, createSuccessResponse, createSupabaseServerClient } from '@/lib/auth/unifiedAuth';
import { extractTextFromPdfSecure } from '@/lib/text-extraction/securePdfExtractor';
import { applyRateLimit } from '@/lib/rateLimit';
import { detectDuplicateResume, updateExistingResume } from '@/app/lib/duplicateDetection';
import { createResumeUpload, updateResumeUpload } from '@/app/lib/repositories/resumeUploadsRepo';

/**
 * Secure PII Upload API Route
 * 
 * This route handles file uploads with encrypted PII storage and secure hashing.
 * It replaces the old upload routes that stored PII in plain text.
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const rateLimitResult = applyRateLimit(`upload:${ip}`, {
            windowMs: 60 * 1000, // 1 minute
            max: 10
        });

        if (!rateLimitResult.allowed) {
            return createErrorResponse('Too many upload requests', 429);
        }

        // Authentication
        const { user, error: authError } = await authenticateUser(request, {
            requireAuth: true,
            allowBearerToken: true
        });

        if (authError || !user) {
            return createErrorResponse(authError || 'User not found', 401);
        }

        // Create Supabase client
        const supabase = await createSupabaseServerClient();

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const jobTitle = formData.get('jobTitle') as string | null;

        if (!file) {
            return createErrorResponse('No file provided', 400);
        }

        if (file.type !== 'application/pdf') {
            return createErrorResponse('Only PDF files are allowed', 400);
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            return createErrorResponse('File size too large (max 10MB)', 400);
        }

        // Convert file to buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Extract text and contact info with secure hashing
        const extractionResult = await extractTextFromPdfSecure(fileBuffer);

        if (extractionResult.error) {
            return createErrorResponse(`PDF processing failed: ${extractionResult.error}`, 400);
        }

        const duplicateResult = await detectDuplicateResume(
            supabase as any,
            {
                contentHash: extractionResult.contentHash || '',
                emailHash: extractionResult.emailHash,
                phoneHash: extractionResult.phoneHash,
                compositeHash: extractionResult.compositeHash || '',
                fullText: extractionResult.fullText || ''
            },
            user.id
        );

        if (duplicateResult.action === 'duplicate') {
            return createSuccessResponse({
                success: true,
                isDuplicate: true,
                uploadId: duplicateResult.existingRecord?.id,
                message: 'Duplicate resume detected',
                extractedData: {
                    hasText: extractionResult.fullText.length > 0,
                    emailCount: extractionResult.contactInfo.emails.length,
                    phoneCount: extractionResult.contactInfo.phones.length,
                    contentHash: extractionResult.contentHash,
                    error: null
                }
            });
        }

        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `resume-pdfs/${user.id}/${Date.now()}.${fileExt}`;

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('resume-analyses')
            .upload(fileName, fileBuffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return createErrorResponse(`File upload failed: ${uploadError.message}`, 500);
        }

        // Get public URLs
        const { data: resumeUrlData } = supabase.storage
            .from('resume-analyses')
            .getPublicUrl(fileName);

        const { data: pdfUrlData } = supabase.storage
            .from('resume-analyses')
            .getPublicUrl(fileName);

        if (!resumeUrlData?.publicUrl || !pdfUrlData?.publicUrl) {
            return createErrorResponse('Failed to get file URLs', 500);
        }

        if (duplicateResult.action === 'update' && duplicateResult.existingRecord?.id) {
            const updated = await updateResumeUpload(
                supabase as any,
                duplicateResult.existingRecord.id,
                {
                    file_name: file.name,
                    file_path: fileName,
                    file_type: file.type,
                    file_size: file.size,
                    resume_url: resumeUrlData.publicUrl,
                    pdf_url: pdfUrlData.publicUrl,
                    content_hash: extractionResult.contentHash || null,
                    composite_hash: extractionResult.compositeHash || null,
                    extracted_text: extractionResult.fullText || '',
                } as any
            );

            if (!updated.success) {
                return createErrorResponse(`Failed to update existing record: ${updated.error}`, 500);
            }

            return createSuccessResponse({
                success: true,
                isDuplicate: false,
                isUpdate: true,
                uploadId: duplicateResult.existingRecord.id,
                resumeUrl: resumeUrlData.publicUrl,
                pdfUrl: pdfUrlData.publicUrl,
                message: duplicateResult.message,
                extractedData: {
                    hasText: extractionResult.fullText.length > 0,
                    emailCount: extractionResult.contactInfo.emails.length,
                    phoneCount: extractionResult.contactInfo.phones.length,
                    contentHash: extractionResult.contentHash,
                    error: null
                }
            });
        }

        const insertPayload = {
            user_id: user.id,
            file_name: file.name,
            file_path: fileName,
            file_type: file.type,
            file_size: file.size,
            resume_url: resumeUrlData.publicUrl,
            pdf_url: pdfUrlData.publicUrl,
            content_hash: extractionResult.contentHash || null,
            email_hash: extractionResult.emailHash || null,
            phone_hash: extractionResult.phoneHash || null,
            composite_hash: extractionResult.compositeHash || null,
            extracted_text: extractionResult.fullText || '',
        } as const;

        const { data: created, error: createError } = await createResumeUpload(supabase as any, insertPayload as any);

        if (createError || !created?.id) {
            return createErrorResponse(`Failed to create upload record: ${createError || 'Unknown error'}`, 500);
        }

        // Return success response
        return createSuccessResponse({
            success: true,
            isDuplicate: false,
            uploadId: created.id,
            resumeUrl: resumeUrlData.publicUrl,
            pdfUrl: pdfUrlData.publicUrl,
            message: 'Resume uploaded and processed securely',
            extractedData: {
                hasText: extractionResult.fullText.length > 0,
                emailCount: extractionResult.contactInfo.emails.length,
                phoneCount: extractionResult.contactInfo.phones.length,
                contentHash: extractionResult.contentHash,
                error: null
            }
        });

    } catch (error) {
        console.error('Secure upload API error:', error);
        return createErrorResponse('Internal server error', 500);
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
