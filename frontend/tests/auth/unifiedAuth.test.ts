import { NextRequest } from 'next/server';
import {
    authenticateUser,
    withAuth,
    withOptionalAuth,
    validateResourceOwnership,
    createErrorResponse,
    createSuccessResponse,
    extractBearerToken
} from '@/lib/auth/unifiedAuth';
import { createSupabaseServerClient } from '@/lib/auth/unifiedAuth';

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
    createServerClient: jest.fn(() => ({
        auth: {
            getUser: jest.fn()
        },
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn()
                }))
            }))
        }))
    }))
}));

jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn()
    }))
}));

describe('Unified Authentication System', () => {
    const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
    };

    describe('authenticateUser', () => {
        it('should authenticate user with valid Bearer token', async () => {
            const request = new NextRequest('http://localhost/api/test', {
                headers: { 'Authorization': 'Bearer valid-token' }
            });

            // Mock successful token validation
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: mockUser },
                        error: null
                    })
                }
            };

            jest.doMock('@supabase/supabase-js', () => ({
                createClient: jest.fn(() => mockSupabase)
            }));

            const result = await authenticateUser(request, {
                requireAuth: true,
                allowBearerToken: true
            });

            expect(result.user).toEqual(mockUser);
            expect(result.error).toBeNull();
            expect(result.status).toBe(200);
        });

        it('should return error for invalid Bearer token', async () => {
            const request = new NextRequest('http://localhost/api/test', {
                headers: { 'Authorization': 'Bearer invalid-token' }
            });

            // Mock failed token validation
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: null },
                        error: { message: 'Invalid token' }
                    })
                }
            };

            jest.doMock('@supabase/supabase-js', () => ({
                createClient: jest.fn(() => mockSupabase)
            }));

            const result = await authenticateUser(request, {
                requireAuth: true,
                allowBearerToken: true
            });

            expect(result.user).toBeNull();
            expect(result.error).toBe('Unauthorized');
            expect(result.status).toBe(401);
        });

        it('should return null user when auth is not required', async () => {
            const request = new NextRequest('http://localhost/api/test');

            const result = await authenticateUser(request, {
                requireAuth: false
            });

            expect(result.user).toBeNull();
            expect(result.error).toBeNull();
            expect(result.status).toBe(200);
        });
    });

    describe('withAuth middleware', () => {
        it('should call handler with authenticated context', async () => {
            const mockHandler = jest.fn().mockResolvedValue(
                new Response(JSON.stringify({ success: true }), { status: 200 })
            );

            const request = new NextRequest('http://localhost/api/test', {
                headers: { 'Authorization': 'Bearer valid-token' }
            });

            // Mock successful authentication
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: mockUser },
                        error: null
                    })
                }
            };

            jest.doMock('@supabase/supabase-js', () => ({
                createClient: jest.fn(() => mockSupabase)
            }));

            const wrappedHandler = withAuth(mockHandler);
            await wrappedHandler(request);

            expect(mockHandler).toHaveBeenCalledWith(
                expect.objectContaining({
                    user: mockUser,
                    request
                })
            );
        });

        it('should return 401 for unauthenticated requests', async () => {
            const mockHandler = jest.fn();

            const request = new NextRequest('http://localhost/api/test');

            const wrappedHandler = withAuth(mockHandler, { requireAuth: true });
            const response = await wrappedHandler(request);

            expect(response.status).toBe(401);
            expect(mockHandler).not.toHaveBeenCalled();
        });
    });

    describe('withOptionalAuth middleware', () => {
        it('should call handler with null context when no auth', async () => {
            const mockHandler = jest.fn().mockResolvedValue(
                new Response(JSON.stringify({ success: true }), { status: 200 })
            );

            const request = new NextRequest('http://localhost/api/test');

            const wrappedHandler = withOptionalAuth(mockHandler);
            await wrappedHandler(request);

            expect(mockHandler).toHaveBeenCalledWith(null, request);
        });

        it('should call handler with context when auth is available', async () => {
            const mockHandler = jest.fn().mockResolvedValue(
                new Response(JSON.stringify({ success: true }), { status: 200 })
            );

            const request = new NextRequest('http://localhost/api/test', {
                headers: { 'Authorization': 'Bearer valid-token' }
            });

            // Mock successful authentication
            const mockSupabase = {
                auth: {
                    getUser: jest.fn().mockResolvedValue({
                        data: { user: mockUser },
                        error: null
                    })
                }
            };

            jest.doMock('@supabase/supabase-js', () => ({
                createClient: jest.fn(() => mockSupabase)
            }));

            const wrappedHandler = withOptionalAuth(mockHandler);
            await wrappedHandler(request);

            expect(mockHandler).toHaveBeenCalledWith(
                expect.objectContaining({
                    user: mockUser,
                    request
                })
            );
        });
    });

    describe('validateResourceOwnership', () => {
        it('should validate user owns resource', async () => {
            const mockSupabase = {
                from: jest.fn(() => ({
                    select: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            single: jest.fn().mockResolvedValue({
                                data: { id: 'resource-id' },
                                error: null
                            })
                        }))
                    }))
                }))
            };

            const result = await validateResourceOwnership(
                mockSupabase as any,
                'user-id',
                'resume_uploads',
                'resource-id'
            );

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should reject when user does not own resource', async () => {
            const mockSupabase = {
                from: jest.fn(() => ({
                    select: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: { message: 'Not found' }
                            })
                        }))
                    }))
                }))
            };

            const result = await validateResourceOwnership(
                mockSupabase as any,
                'user-id',
                'resume_uploads',
                'resource-id'
            );

            expect(result.valid).toBe(false);
            expect(result.error).toBe('Resource not found or access denied');
        });
    });

    describe('Response helpers', () => {
        it('should create error response', () => {
            const response = createErrorResponse('Test error', 400, { details: 'test' });

            expect(response.status).toBe(400);
        });

        it('should create success response', () => {
            const response = createSuccessResponse({ data: 'test' }, 200);

            expect(response.status).toBe(200);
        });
    });

    describe('extractBearerToken', () => {
        it('should extract Bearer token from Authorization header', () => {
            const request = new NextRequest('http://localhost/api/test', {
                headers: { 'Authorization': 'Bearer test-token' }
            });

            const token = extractBearerToken(request);
            expect(token).toBe('test-token');
        });

        it('should return null for invalid Authorization header', () => {
            const request = new NextRequest('http://localhost/api/test', {
                headers: { 'Authorization': 'Invalid test-token' }
            });

            const token = extractBearerToken(request);
            expect(token).toBeNull();
        });

        it('should return null for missing Authorization header', () => {
            const request = new NextRequest('http://localhost/api/test');

            const token = extractBearerToken(request);
            expect(token).toBeNull();
        });
    });
});
