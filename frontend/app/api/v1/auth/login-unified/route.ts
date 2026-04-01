import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseClient } from '@/lib/config/supabase';
import { validateContentType, parseJsonBody, createErrorResponse, createSuccessResponse } from '@/lib/auth/unifiedAuth';

// Request validation schema
const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

export async function POST(request: NextRequest) {
    try {
        // Validate content type
        const contentTypeValidation = validateContentType(request);
        if (!contentTypeValidation.valid) {
            return contentTypeValidation.error!;
        }

        // Parse JSON body
        const { data: body, error: parseError } = await parseJsonBody(request);
        if (parseError) {
            return parseError;
        }

        if (!body || (typeof body === 'object' && body !== null && Object.keys(body as Record<string, unknown>).length === 0)) {
            return createErrorResponse('Request body cannot be empty', 400);
        }

        // Validate request body
        const validation = loginSchema.safeParse(body);
        if (!validation.success) {
            return createErrorResponse('Validation failed', 400, validation.error.errors);
        }

        const { email, password } = validation.data;

        // Create Supabase client using unified configuration
        const supabase = createSupabaseClient();

        // Authenticate user
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return createErrorResponse('Authentication failed', 401, { message: error.message });
        }

        if (!data.user || !data.session) {
            return createErrorResponse('Authentication failed', 401);
        }

        // Return success response
        return createSuccessResponse({
            success: true,
            user: {
                id: data.user.id,
                email: data.user.email,
                created_at: data.user.created_at
            },
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
                token_type: data.session.token_type
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return createErrorResponse('Internal server error', 500);
    }
}

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
