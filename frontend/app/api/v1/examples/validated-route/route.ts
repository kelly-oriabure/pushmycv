import { NextRequest, NextResponse } from 'next/server';
import { ApiValidator, requestSchemas, SqlInjectionPrevention } from '@/lib/validation/apiValidation';
import { StandardErrorHandler, StandardSuccessHandler, ErrorCode, ErrorUtils } from '@/lib/errors/standardErrors';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { applyRateLimit, rateLimit429, setRateLimitHeaders } from '@/app/lib/rateLimit';
import { z } from 'zod';

// Example: Comprehensive API route with all validation and error handling best practices

// Custom validation schema for this route
const exampleSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    email: z.string().email('Invalid email format'),
    age: z.number().min(18, 'Must be 18 or older').max(120, 'Invalid age'),
    file: z.object({
        name: z.string(),
        size: z.number(),
        type: z.string()
    }).optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // 1. AUTHENTICATION
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return StandardErrorHandler.createAuthError(ErrorCode.UNAUTHORIZED);
        }

        // 2. RATE LIMITING
        const rateLimitKey = `user:${user.id}:example`;
        const rl = applyRateLimit(rateLimitKey, {
            windowMs: 60_000, // 1 minute
            max: 10, // 10 requests per minute
            keyPrefix: 'example'
        });
        if (!rl.allowed) {
            return rateLimit429(rl);
        }

        // 3. INPUT VALIDATION
        const validation = await ApiValidator.validateBody(request, exampleSchema);
        if (!validation.success) {
            const response = NextResponse.json(validation.error, { status: 400 });
            setRateLimitHeaders(response, rl);
            return response;
        }

        const { name, email, age, file } = validation.data;

        // 4. SQL INJECTION PREVENTION
        const sanitizedName = SqlInjectionPrevention.sanitizeString(name);
        const sanitizedEmail = SqlInjectionPrevention.sanitizeString(email);

        // 5. FILE VALIDATION (if file provided)
        // Note: In a real implementation, you would parse the file from FormData
        // and validate it as a proper File object
        if (file) {
            // Basic file size validation (file is parsed as object from JSON)
            if (file.size > 5 * 1024 * 1024) { // 5MB
                const response = NextResponse.json({
                    error: 'File too large',
                    code: 'FILE_TOO_LARGE',
                    timestamp: new Date().toISOString()
                }, { status: 400 });
                setRateLimitHeaders(response, rl);
                return response;
            }
        }

        // 6. BUSINESS LOGIC WITH ERROR HANDLING
        const result = await ErrorUtils.handleAsync(async () => {
            // Example database operation
            const { data, error } = await supabase
                .from('example_table')
                .insert({
                    name: sanitizedName,
                    email: sanitizedEmail,
                    age,
                    user_id: user.id,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
        });

        if (result instanceof NextResponse) {
            // Error occurred in async operation
            setRateLimitHeaders(result, rl);
            return result;
        }

        // 7. SUCCESS RESPONSE
        const response = StandardSuccessHandler.createSuccessResponse(
            { id: result.id, name: result.name, email: result.email },
            'Example created successfully'
        );
        setRateLimitHeaders(response, rl);
        return response;

    } catch (error) {
        console.error('Example route error:', error);
        return StandardErrorHandler.createInternalError(
            error instanceof Error ? error.message : 'Unknown error',
            'Example operation failed'
        );
    }
}

// Example: GET route with query parameter validation
const querySchema = z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional()
});

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // 1. AUTHENTICATION
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return StandardErrorHandler.createAuthError(ErrorCode.UNAUTHORIZED);
        }

        // 2. QUERY PARAMETER VALIDATION
        const url = new URL(request.url);
        const validation = ApiValidator.validateQuery(url.searchParams, querySchema);
        if (!validation.success) {
            return NextResponse.json(validation.error, { status: 400 });
        }

        const { page, limit, search } = validation.data;

        // Convert string values to numbers
        const pageNum = parseInt(page || '1', 10);
        const limitNum = parseInt(limit || '10', 10);

        // 3. SQL INJECTION PREVENTION FOR SEARCH
        const sanitizedSearch = search ? SqlInjectionPrevention.sanitizeString(search) : undefined;

        // 4. DATABASE QUERY WITH ERROR HANDLING
        const result = await ErrorUtils.handleAsync(async () => {
            let query = supabase
                .from('example_table')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id)
                .range((pageNum - 1) * limitNum, pageNum * limitNum - 1)
                .order('created_at', { ascending: false });

            if (sanitizedSearch) {
                query = query.ilike('name', `%${sanitizedSearch}%`);
            }

            const { data, error, count } = await query;

            if (error) {
                throw error;
            }

            return { data, count };
        });

        if (result instanceof NextResponse) {
            return result;
        }

        // 5. SUCCESS RESPONSE
        return StandardSuccessHandler.createSuccessResponse({
            items: result.data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: result.count || 0,
                totalPages: Math.ceil((result.count || 0) / limitNum)
            }
        }, 'Examples retrieved successfully');

    } catch (error) {
        console.error('Example GET error:', error);
        return StandardErrorHandler.createInternalError(
            error instanceof Error ? error.message : 'Unknown error',
            'Failed to retrieve examples'
        );
    }
}

// Example: DELETE route with UUID validation
export async function DELETE(request: NextRequest) {
    try {
        // 1. AUTHENTICATION
        const supabase = await getSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return StandardErrorHandler.createAuthError(ErrorCode.UNAUTHORIZED);
        }

        // 2. URL PARAMETER VALIDATION
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();

        if (!id || !SqlInjectionPrevention.validateUuid(id)) {
            return StandardErrorHandler.createErrorResponse(
                ErrorCode.INVALID_FORMAT,
                { field: 'id' },
                'Invalid or missing ID'
            );
        }

        // 3. OWNERSHIP VERIFICATION
        const { data: existing, error: fetchError } = await supabase
            .from('example_table')
            .select('id, user_id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !existing) {
            return StandardErrorHandler.createErrorResponse(
                ErrorCode.RECORD_NOT_FOUND,
                undefined,
                'Example not found or access denied'
            );
        }

        // 4. DELETE OPERATION
        const result = await ErrorUtils.handleAsync(async () => {
            const { error } = await supabase
                .from('example_table')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) {
                throw error;
            }

            return { success: true };
        });

        if (result instanceof NextResponse) {
            return result;
        }

        // 5. SUCCESS RESPONSE
        return StandardSuccessHandler.createNoContentResponse();

    } catch (error) {
        console.error('Example DELETE error:', error);
        return StandardErrorHandler.createInternalError(
            error instanceof Error ? error.message : 'Unknown error',
            'Failed to delete example'
        );
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
