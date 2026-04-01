import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

/**
 * Unified Authentication System
 * 
 * This module provides a consistent authentication interface across all API routes.
 * It handles multiple authentication methods and provides standardized error responses.
 */

export interface AuthResult {
    user: User | null;
    error: string | null;
    status: number;
}

export interface AuthContext {
    user: User;
    supabase: ReturnType<typeof createServerClient>;
    request: NextRequest;
}

export interface AuthOptions {
    requireAuth?: boolean;
    allowBearerToken?: boolean;
    allowCookies?: boolean;
    customErrorMessage?: string;
}

/**
 * Creates a Supabase server client with proper cookie handling
 */
export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(all) {
                    all.forEach(({ name, value, options }) => {
                        cookieStore.set({ name, value, ...(options as CookieOptions) });
                    });
                },
            },
        }
    );
}

/**
 * Creates a Supabase admin client for server-side operations
 * Uses environment variables for security
 */
export function createSupabaseAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing required Supabase environment variables');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

/**
 * Extracts Bearer token from Authorization header
 */
function extractBearerToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7).trim();
}

/**
 * Authenticates user using multiple methods (cookies, Bearer tokens)
 */
export async function authenticateUser(
    request: NextRequest,
    options: AuthOptions = {}
): Promise<AuthResult> {
    const {
        requireAuth = true,
        allowBearerToken = true,
        allowCookies = true,
        customErrorMessage = 'Unauthorized'
    } = options;

    try {
        // Try Bearer token authentication first
        if (allowBearerToken) {
            const bearerToken = extractBearerToken(request);
            if (bearerToken) {
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );

                const { data: { user }, error } = await supabase.auth.getUser(bearerToken);

                if (!error && user) {
                    return { user, error: null, status: 200 };
                }
            }
        }

        // Try cookie-based authentication
        if (allowCookies) {
            const supabase = await createSupabaseServerClient();
            const { data: { user }, error } = await supabase.auth.getUser();

            if (!error && user) {
                return { user, error: null, status: 200 };
            }
        }

        // No valid authentication found
        if (requireAuth) {
            return {
                user: null,
                error: customErrorMessage,
                status: 401
            };
        }

        return { user: null, error: null, status: 200 };

    } catch (error) {
        console.error('Authentication error:', error);
        return {
            user: null,
            error: 'Authentication failed',
            status: 500
        };
    }
}

/**
 * Higher-order function that wraps API route handlers with authentication
 */
export function withAuth<T extends any[]>(
    handler: (context: AuthContext, ...args: T) => Promise<NextResponse>,
    options: AuthOptions = {}
) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
        const authResult = await authenticateUser(request, options);

        if (authResult.error) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        if (!authResult.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const supabase = await createSupabaseServerClient();
        const context: AuthContext = {
            user: authResult.user,
            supabase,
            request
        };

        return handler(context, ...args);
    };
}

/**
 * Middleware for optional authentication (doesn't require auth but provides user if available)
 */
export function withOptionalAuth<T extends any[]>(
    handler: (context: AuthContext | null, ...args: T) => Promise<NextResponse>
) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
        const authResult = await authenticateUser(request, { requireAuth: false });

        if (authResult.error && authResult.status !== 200) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        let context: AuthContext | null = null;

        if (authResult.user) {
            const supabase = await createSupabaseServerClient();
            context = {
                user: authResult.user,
                supabase,
                request
            };
        }

        return handler(context, ...args);
    };
}

/**
 * Validates that a user owns a specific resource
 */
export async function validateResourceOwnership(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    table: string,
    resourceId: string,
    idColumn: string = 'id'
): Promise<{ valid: boolean; error?: string }> {
    try {
        const { data, error } = await supabase
            .from(table)
            .select('id')
            .eq(idColumn, resourceId)
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return { valid: false, error: 'Resource not found or access denied' };
        }

        return { valid: true };
    } catch (error) {
        console.error('Resource ownership validation error:', error);
        return { valid: false, error: 'Validation failed' };
    }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
    message: string,
    status: number = 400,
    details?: any
): NextResponse {
    const response: any = { error: message };
    if (details) {
        response.details = details;
    }
    return NextResponse.json(response, { status });
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(
    data: any,
    status: number = 200
): NextResponse {
    return NextResponse.json(data, { status });
}

/**
 * Validates request content type
 */
export function validateContentType(
    request: NextRequest,
    expectedType: string = 'application/json'
): { valid: boolean; error?: NextResponse } {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.toLowerCase().includes(expectedType)) {
        return {
            valid: false,
            error: NextResponse.json(
                {
                    error: 'Unsupported Media Type',
                    message: `Content-Type must be ${expectedType}`
                },
                { status: 415 }
            )
        };
    }

    return { valid: true };
}

/**
 * Safely parses JSON from request body
 */
export async function parseJsonBody<T = any>(
    request: NextRequest
): Promise<{ data: T | null; error: NextResponse | null }> {
    try {
        const body = await request.json();
        return { data: body, error: null };
    } catch (error) {
        return {
            data: null,
            error: NextResponse.json(
                {
                    error: 'Invalid JSON',
                    message: 'Request body must be valid JSON'
                },
                { status: 400 }
            )
        };
    }
}

/**
 * Rate limiting helper with user identification
 */
export function getRateLimitKey(
    request: NextRequest,
    user: User | null,
    operation: string
): string {
    if (user) {
        return `user:${user.id}:${operation}`;
    }

    const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';
    return `ip:${ip}:${operation}`;
}
