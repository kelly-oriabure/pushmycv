import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/unifiedAuth';
import { createSupabaseAdminClient } from '@/lib/config/supabase';
import type { AuthContext } from '@/lib/auth/unifiedAuth';

/**
 * Secure file upload endpoint
 * Replaces the hardcoded key versions with proper authentication and environment variables
 */

async function handleUpload(context: AuthContext) {
    const { user, request } = context;

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

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const userId = formData.get('userId') as string | null;

        // Validate inputs
        if (!file) {
            return createErrorResponse('File is required', 400);
        }

        if (!userId) {
            return createErrorResponse('userId is required', 400);
        }

        // Validate that the userId matches the authenticated user
        if (userId !== user.id) {
            return createErrorResponse('User ID mismatch', 403);
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return createErrorResponse('Only PDF files are allowed', 400);
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return createErrorResponse('File size must be less than 10MB', 400);
        }

        // Create secure Supabase admin client
        const supabase = createSupabaseAdminClient();

        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `resume-pdfs/${userId}/${Date.now()}.${fileExt}`;
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('resume-analyses')
            .upload(fileName, fileBuffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return createErrorResponse('Failed to upload file', 500);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('resume-analyses')
            .getPublicUrl(fileName);

        // Create database record
        const { data: dbData, error: dbError } = await supabase
            .from('resume_uploads')
            .insert({
                user_id: userId,
                file_name: file.name,
                file_path: fileName,
                file_size: file.size,
                file_type: file.type,
                resume_url: urlData.publicUrl,
                pdf_url: urlData.publicUrl,
                upload_time: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            // Try to clean up uploaded file
            await supabase.storage.from('resume-analyses').remove([fileName]);
            return createErrorResponse('Failed to save file record', 500);
        }

        return createSuccessResponse({
            success: true,
            uploadId: dbData.id,
            fileName: file.name,
            fileUrl: urlData.publicUrl,
            fileSize: file.size,
            message: 'File uploaded successfully'
        });

    } catch (error) {
        console.error('Upload error:', error);
        return createErrorResponse('Internal server error', 500);
    }
}

// Export with authentication middleware
export const POST = withAuth(handleUpload, {
    requireAuth: true,
    allowBearerToken: true,
    allowCookies: true,
    customErrorMessage: 'Authentication required to upload files'
});

// Handle OPTIONS for CORS
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
