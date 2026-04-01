// app/api/upload-to-supabase-analyses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { detectDuplicateResume } from '@/app/lib/duplicates/detection';
import { processPdfUpload } from '@/app/lib/services/resumeUploadService';
import { updateResumeUpload } from '@/app/lib/repositories/resumeUploadsRepo';
import { startResumeAnalysis } from '@/app/lib/edge/resumeAnalysis';
import { withRateLimit, rateLimitKey } from '@/app/lib/rateLimit';

async function handlePOST(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json(
            { error: 'Supabase is not configured' },
            { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
        );
    }

    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const formUserId = formData.get('userId') as string | null;

        if (!file) {
            return NextResponse.json(
                { error: 'Missing file' },
                {
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json',
                    }
                }
            );
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
            );
        }

        if (formUserId && formUserId !== user.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
            );
        }

        const userId = user.id;

        // Extract text and run duplicate detection via orchestrator
        let extractedData: any = null;
        let orchestration: any = null;
        try {
            const pdfArrayBuffer = await file.arrayBuffer();
            orchestration = await processPdfUpload({
                supabase,
                userId,
                pdf: {
                    bytes: pdfArrayBuffer,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                },
            });

            // Bridge orchestrator result to legacy shape
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
                error: undefined,
            } as any;

            console.log('=== PDF TEXT EXTRACTION RESULTS (orchestrator) ===');
            console.log('Extracted Text (first 500 chars):', extractedData.fullText.substring(0, 500));
            console.log('Full Text Length:', extractedData.fullText.length);
            console.log('Extracted Emails:', extractedData.contactInfo.emails);
            console.log('Extracted Phones:', extractedData.contactInfo.phones);
            console.log('Content Hash:', extractedData.contentHash);
            console.log('Email Hash:', extractedData.emailHash);
            console.log('Phone Hash:', extractedData.phoneHash);
            console.log('Composite Hash:', extractedData.compositeHash);
            console.log('=== END EXTRACTION RESULTS ===');
        } catch (extractError) {
            console.error('PDF text extraction failed:', extractError);
            extractedData = {
                fullText: '',
                contactInfo: { emails: [], phones: [] },
                contentHash: '',
                emailHash: null,
                phoneHash: null,
                compositeHash: '',
                error: `PDF extraction failed: ${extractError instanceof Error ? extractError.message : 'Unknown extraction error'}`
            };
        }

        // Perform comprehensive duplicate detection
        console.log('=== DUPLICATE DETECTION ===');
        const duplicateResult = await detectDuplicateResume(
            supabase,
            {
                contentHash: extractedData.contentHash,
                emailHash: extractedData.emailHash,
                phoneHash: extractedData.phoneHash,
                compositeHash: extractedData.compositeHash,
                fullText: extractedData.fullText
            },
            userId
        );

        console.log('Duplicate detection result:', {
            action: duplicateResult.action,
            isDuplicate: duplicateResult.isDuplicate,
            isPartialMatch: duplicateResult.isPartialMatch,
            shouldUpdate: duplicateResult.shouldUpdate,
            message: duplicateResult.message
        });
        console.log('=== END DUPLICATE DETECTION ===');

        // Handle duplicate detection results
        if (duplicateResult.action === 'duplicate') {
            // Return existing record without creating new one
            console.log('Returning existing duplicate record:', duplicateResult.existingRecord?.id);

            return NextResponse.json({
                success: true,
                isDuplicate: true,
                uploadId: duplicateResult.existingRecord?.id,
                publicUrl: duplicateResult.existingRecord?.resume_url,
                message: duplicateResult.message,
                existingUpload: {
                    id: duplicateResult.existingRecord?.id,
                    fileName: duplicateResult.existingRecord?.file_name,
                    uploadedAt: duplicateResult.existingRecord?.created_at
                },
                extractedData: {
                    emails: extractedData.contactInfo.emails,
                    phones: extractedData.contactInfo.phones,
                    primaryEmail: extractedData.contactInfo.emails[0] || null,
                    primaryPhone: extractedData.contactInfo.phones[0] || null,
                    textLength: extractedData.fullText.length
                }
            }, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                }
            });
        }

        if (duplicateResult.action === 'update' && duplicateResult.existingRecord) {
            // Update existing record with new content
            console.log('Updating existing record:', duplicateResult.existingRecord.id);

            // Generate file path for the update
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}.${fileExt}`;
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            // Upload new file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('resume-analyses')
                .upload(fileName, fileBuffer, {
                    contentType: file.type,
                    upsert: true,
                });

            if (uploadError) {
                console.error('Upload error during update:', uploadError);
                return NextResponse.json(
                    { error: 'Failed to upload updated file', details: uploadError.message },
                    {
                        status: 500,
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Content-Type': 'application/json',
                        }
                    }
                );
            }

            // Get public URL for updated file
            const { data: { publicUrl } } = supabase.storage
                .from('resume-analyses')
                .getPublicUrl(fileName);

            const updateResult = await updateResumeUpload(supabase as any, duplicateResult.existingRecord.id, {
                file_name: file.name,
                file_path: fileName,
                file_type: file.type,
                file_size: file.size,
                resume_url: publicUrl,
                pdf_url: publicUrl,
                content_hash: extractedData.contentHash || null,
                composite_hash: extractedData.compositeHash || null,
                extracted_text: extractedData.fullText || ''
            } as any);

            if (!updateResult.success) {
                console.error('Failed to update existing record:', updateResult.error);
                return NextResponse.json({
                    error: 'Failed to update existing record',
                    details: updateResult.error
                }, {
                    status: 500,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json',
                    }
                });
            }

            // Trigger resume-analysis Edge Function (best-effort)
            let analysisId: string | null = null;
            try {
                console.log('[analysis][update] Invoking resume-analysis', {
                    uploadId: duplicateResult.existingRecord.id,
                    hasAuthHeader: Boolean(authHeader),
                });
                const analysisRes = await startResumeAnalysis(supabase as any, {
                    resumeUploadId: duplicateResult.existingRecord.id,
                    userId,
                    resumeUrl: publicUrl,
                    pdfUrl: publicUrl,
                }, {
                    headers: authHeader ? { Authorization: authHeader } : undefined,
                });
                analysisId = analysisRes?.analysisId ?? null;
                console.log('[analysis][update] Edge function responded', { analysisId });
            } catch (e: any) {
                console.error('[analysis][update] startResumeAnalysis error:', e?.message || e);
                // Fallback: try direct HTTP call to functions endpoint for debuggability
                try {
                    const functionsUrl = `${supabaseUrl}/functions/v1/resume-analysis`;
                    const payload = {
                        resumeUploadId: duplicateResult.existingRecord.id,
                        userId,
                        resumeUrl: publicUrl,
                        pdfUrl: publicUrl,
                    };
                    console.log('[analysis][update] Fallback POST to functions URL');
                    const resp = await fetch(functionsUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(authHeader ? { Authorization: authHeader } : {}),
                            apikey: supabaseAnonKey,
                            'Idempotency-Key': String(duplicateResult.existingRecord.id),
                        },
                        body: JSON.stringify(payload),
                    });
                    const text = await resp.text();
                    console.error('[analysis][update] Fallback response', { status: resp.status, body: text.slice(0, 500) });
                    if (resp.ok) {
                        try {
                            const json = JSON.parse(text);
                            analysisId = json?.analysisId || analysisId;
                        } catch { }
                    }
                } catch (ef: any) {
                    console.error('[analysis][update] Fallback POST failed:', ef?.message || ef);
                }
            }

            return NextResponse.json({
                success: true,
                isUpdate: true,
                uploadId: duplicateResult.existingRecord.id,
                publicUrl: publicUrl,
                analysisId,
                message: duplicateResult.message,
                extractedData: {
                    emails: extractedData.contactInfo.emails,
                    phones: extractedData.contactInfo.phones,
                    primaryEmail: extractedData.contactInfo.emails[0] || null,
                    primaryPhone: extractedData.contactInfo.phones[0] || null,
                    textLength: extractedData.fullText.length
                }
            }, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                }
            });
        }

        // Generate a unique file path for resume analyses
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Upload to Supabase Storage - using 'resume-analyses' bucket
        const { error: uploadError } = await supabase.storage
            .from('resume-analyses')
            .upload(fileName, fileBuffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload file', details: uploadError.message },
                {
                    status: 500,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json',
                    }
                }
            );
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('resume-analyses')
            .getPublicUrl(fileName);

        // Insert extracted data into resume_uploads table
        const { data: uploadRecord, error: insertError } = await supabase
            .from('resume_uploads')
            .insert({
                user_id: userId,
                file_name: file.name,
                file_path: fileName,
                file_type: file.type,
                file_size: file.size,
                resume_url: publicUrl,
                pdf_url: publicUrl,
                content_hash: extractedData.contentHash,
                email_hash: extractedData.emailHash,
                phone_hash: extractedData.phoneHash,
                composite_hash: extractedData.compositeHash,
                extracted_email: extractedData.contactInfo.emails[0] || null,
                extracted_phone: extractedData.contactInfo.phones[0] || null,
                extracted_text: extractedData?.fullText || null
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('Database insert error:', insertError);
            // Clean up uploaded file if database insert fails
            await supabase.storage
                .from('resume-analyses')
                .remove([fileName]);

            return NextResponse.json(
                { error: 'Failed to save resume data', details: insertError.message },
                {
                    status: 500,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json',
                    }
                }
            );
        }

        // Log successful file upload and database insert
        console.log('Resume analysis file uploaded and processed successfully:', {
            userId,
            fileName,
            publicUrl,
            uploadId: uploadRecord.id,
            extractedEmails: extractedData.contactInfo.emails,
            extractedPhones: extractedData.contactInfo.phones,
            uploadedAt: new Date().toISOString()
        });

        // Trigger resume-analysis Edge Function (best-effort)
        let analysisId: string | null = null;
        try {
            console.log('[analysis][create] Invoking resume-analysis', {
                uploadId: uploadRecord.id,
                hasAuthHeader: Boolean(authHeader),
            });
            const analysisRes = await startResumeAnalysis(supabase as any, {
                resumeUploadId: uploadRecord.id,
                userId,
                resumeUrl: publicUrl,
                pdfUrl: publicUrl,
            }, {
                headers: authHeader ? { Authorization: authHeader } : undefined,
            });
            analysisId = analysisRes?.analysisId ?? null;
            console.log('[analysis][create] Edge function responded', { analysisId });
        } catch (e: any) {
            console.error('[analysis][create] startResumeAnalysis error:', e?.message || e);
            // Fallback: try direct HTTP call to functions endpoint for debuggability
            try {
                const functionsUrl = `${supabaseUrl}/functions/v1/resume-analysis`;
                const payload = {
                    resumeUploadId: uploadRecord.id,
                    userId,
                    resumeUrl: publicUrl,
                    pdfUrl: publicUrl,
                };
                console.log('[analysis][create] Fallback POST to functions URL');
                const resp = await fetch(functionsUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(authHeader ? { Authorization: authHeader } : {}),
                        apikey: supabaseAnonKey,
                        'Idempotency-Key': String(uploadRecord.id),
                    },
                    body: JSON.stringify(payload),
                });
                const text = await resp.text();
                console.error('[analysis][create] Fallback response', { status: resp.status, body: text.slice(0, 500) });
                if (resp.ok) {
                    try {
                        const json = JSON.parse(text);
                        analysisId = json?.analysisId || analysisId;
                    } catch { }
                }
            } catch (ef: any) {
                console.error('[analysis][create] Fallback POST failed:', ef?.message || ef);
            }
        }

        return NextResponse.json({
            success: true,
            isNew: true,
            uploadId: uploadRecord.id,
            path: fileName,
            publicUrl,
            analysisId,
            message: 'New resume record created successfully',
            extractedData: {
                emails: extractedData.contactInfo.emails,
                phones: extractedData.contactInfo.phones,
                primaryEmail: extractedData.contactInfo.emails[0] || null,
                primaryPhone: extractedData.contactInfo.phones[0] || null,
                textLength: extractedData.fullText.length
            },
            isDuplicate: false
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            }
        });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                }
            }
        );
    }
}

// Apply rate limiting: 5 uploads per minute per user/IP
export const POST = withRateLimit(handlePOST, {
    getKey: (req) => {
        const formData = req.formData();
        // Try to get userId from form data for better rate limiting
        // Fallback to IP-based rate limiting
        return rateLimitKey(req, 'upload-analyses', 'rl-upload');
    },
    options: {
        windowMs: 60 * 1000, // 1 minute
        max: 5, // 5 uploads per minute
        keyPrefix: 'upload-analyses',
    },
});

// Add CORS headers to all responses
export function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
