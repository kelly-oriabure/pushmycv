import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

interface SignUpBody {
    email: string;
    password: string;
    full_name?: string;
}

interface SignInBody {
    email: string;
    password: string;
}

interface ResetPasswordBody {
    email: string;
}

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
    // Sign up
    fastify.post<{ Body: SignUpBody }>(
        '/signup',
        {
            schema: {
                description: 'Register a new user',
                tags: ['auth'],
                body: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 },
                        full_name: { type: 'string' }
                    }
                },
                response: {
                    201: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: {
                                type: 'object',
                                properties: {
                                    user: { type: 'object' },
                                    session: { type: 'object' }
                                }
                            },
                            message: { type: 'string' }
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: SignUpBody }>, reply: FastifyReply) => {
            try {
                const { email, password, full_name } = request.body;

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: full_name || ''
                        }
                    }
                });

                if (error) {
                    logger.error('Sign up failed', error);
                    return reply.status(400).send({
                        success: false,
                        message: error.message
                    });
                }

                logger.info('User signed up', { user_id: data.user?.id, email });

                return reply.status(201).send({
                    success: true,
                    data: {
                        user: data.user,
                        session: data.session
                    },
                    message: 'User registered successfully. Please check your email for verification.'
                });
            } catch (error) {
                logger.error('Sign up error', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to register user'
                });
            }
        }
    );

    // Sign in
    fastify.post<{ Body: SignInBody }>(
        '/signin',
        {
            schema: {
                description: 'Sign in with email and password',
                tags: ['auth'],
                body: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string' }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: {
                                type: 'object',
                                properties: {
                                    user: { type: 'object' },
                                    session: { type: 'object' },
                                    access_token: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: SignInBody }>, reply: FastifyReply) => {
            try {
                const { email, password } = request.body;

                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    logger.warn('Sign in failed', { email, error: error.message });
                    return reply.status(401).send({
                        success: false,
                        message: 'Invalid credentials'
                    });
                }

                logger.info('User signed in', { user_id: data.user?.id, email });

                return reply.send({
                    success: true,
                    data: {
                        user: data.user,
                        session: data.session,
                        access_token: data.session?.access_token
                    }
                });
            } catch (error) {
                logger.error('Sign in error', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to sign in'
                });
            }
        }
    );

    // Sign out
    fastify.post(
        '/signout',
        {
            schema: {
                description: 'Sign out the current user',
                tags: ['auth'],
                security: [{ bearerAuth: [] }]
            },
            onRequest: [fastify.authenticate]
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const authHeader = request.headers.authorization;
                const token = authHeader?.replace('Bearer ', '');

                if (token) {
                    const { error } = await supabase.auth.signOut();

                    if (error) {
                        logger.error('Sign out failed', error);
                    }
                }

                logger.info('User signed out', { user_id: request.user?.id });

                return reply.send({
                    success: true,
                    message: 'Signed out successfully'
                });
            } catch (error) {
                logger.error('Sign out error', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to sign out'
                });
            }
        }
    );

    // Get current user
    fastify.get(
        '/me',
        {
            schema: {
                description: 'Get current authenticated user',
                tags: ['auth'],
                security: [{ bearerAuth: [] }],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    email: { type: 'string' },
                                    role: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            },
            onRequest: [fastify.authenticate]
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            return reply.send({
                success: true,
                data: request.user
            });
        }
    );

    // Request password reset
    fastify.post<{ Body: ResetPasswordBody }>(
        '/reset-password',
        {
            schema: {
                description: 'Request a password reset email',
                tags: ['auth'],
                body: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string', format: 'email' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: ResetPasswordBody }>, reply: FastifyReply) => {
            try {
                const { email } = request.body;

                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/reset-password`
                });

                if (error) {
                    logger.error('Password reset request failed', error);
                    return reply.status(400).send({
                        success: false,
                        message: error.message
                    });
                }

                logger.info('Password reset requested', { email });

                return reply.send({
                    success: true,
                    message: 'Password reset email sent. Please check your inbox.'
                });
            } catch (error) {
                logger.error('Password reset error', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to request password reset'
                });
            }
        }
    );

    // Refresh token
    fastify.post(
        '/refresh',
        {
            schema: {
                description: 'Refresh access token',
                tags: ['auth'],
                body: {
                    type: 'object',
                    required: ['refresh_token'],
                    properties: {
                        refresh_token: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: { refresh_token: string } }>, reply: FastifyReply) => {
            try {
                const { refresh_token } = request.body;

                const { data, error } = await supabase.auth.refreshSession({
                    refresh_token
                });

                if (error) {
                    logger.error('Token refresh failed', error);
                    return reply.status(401).send({
                        success: false,
                        message: 'Invalid refresh token'
                    });
                }

                return reply.send({
                    success: true,
                    data: {
                        session: data.session,
                        access_token: data.session?.access_token
                    }
                });
            } catch (error) {
                logger.error('Token refresh error', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to refresh token'
                });
            }
        }
    );
}
