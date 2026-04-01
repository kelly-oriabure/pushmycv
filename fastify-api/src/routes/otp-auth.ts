import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { generateOTP, storeOTP, verifyOTP, deleteOTP } from '../utils/otp.js';
import { sendOTPEmail, sendWelcomeEmail } from '../utils/email.js';

interface RequestOTPBody {
    email: string;
    full_name?: string;
    phone?: string;
    location?: string;
}

interface VerifyOTPBody {
    email: string;
    otp: string;
}

interface CompleteRegistrationBody {
    email: string;
    password: string;
}

export async function otpAuthRoutes(fastify: FastifyInstance): Promise<void> {
    // Step 1: Request OTP (Collect user information and send OTP)
    fastify.post<{ Body: RequestOTPBody }>(
        '/request-otp',
        {
            schema: {
                description: 'Request OTP for email verification (Step 1: Collect user info)',
                tags: ['otp-auth'],
                body: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        full_name: { type: 'string', minLength: 2 },
                        phone: { type: 'string' },
                        location: { type: 'string' }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' },
                            expires_in: { type: 'string' }
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: RequestOTPBody }>, reply: FastifyReply) => {
            try {
                const { email, full_name, phone, location } = request.body;

                const normalizedEmail = email.toLowerCase().trim();

                const { data: existingUser } = await supabase.auth.admin.listUsers();
                const userExists = existingUser?.users.some(u => u.email === normalizedEmail);

                if (userExists) {
                    return reply.status(400).send({
                        success: false,
                        message: 'An account with this email already exists. Please sign in instead.'
                    });
                }

                const otp = generateOTP();

                const userData = {
                    full_name,
                    phone,
                    location
                };

                const storeResult = await storeOTP(normalizedEmail, otp, userData);

                if (!storeResult.success) {
                    return reply.status(500).send({
                        success: false,
                        message: storeResult.error || 'Failed to generate OTP'
                    });
                }

                const emailResult = await sendOTPEmail(normalizedEmail, otp, full_name);

                if (!emailResult.success) {
                    logger.error('Failed to send OTP email', { email: normalizedEmail });
                }

                logger.info('OTP requested', { email: normalizedEmail, has_name: !!full_name });

                return reply.send({
                    success: true,
                    message: 'OTP sent to your email. Please check your inbox.',
                    expires_in: '10 minutes'
                });
            } catch (error) {
                logger.error('Request OTP error', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to send OTP'
                });
            }
        }
    );

    // Step 2: Verify OTP
    fastify.post<{ Body: VerifyOTPBody }>(
        '/verify-otp',
        {
            schema: {
                description: 'Verify OTP code (Step 2: Verify email)',
                tags: ['otp-auth'],
                body: {
                    type: 'object',
                    required: ['email', 'otp'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        otp: { type: 'string', minLength: 6, maxLength: 6 }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' },
                            verified: { type: 'boolean' }
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: VerifyOTPBody }>, reply: FastifyReply) => {
            try {
                const { email, otp } = request.body;

                const normalizedEmail = email.toLowerCase().trim();

                const result = await verifyOTP(normalizedEmail, otp);

                if (!result.success) {
                    return reply.status(400).send({
                        success: false,
                        message: result.error || 'Invalid OTP',
                        verified: false
                    });
                }

                logger.info('OTP verified successfully', { email: normalizedEmail });

                return reply.send({
                    success: true,
                    message: 'Email verified successfully. You can now complete your registration.',
                    verified: true
                });
            } catch (error) {
                logger.error('Verify OTP error', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to verify OTP',
                    verified: false
                });
            }
        }
    );

    // Step 3: Complete Registration (Create account with password)
    fastify.post<{ Body: CompleteRegistrationBody }>(
        '/complete-registration',
        {
            schema: {
                description: 'Complete registration after OTP verification (Step 3: Set password)',
                tags: ['otp-auth'],
                body: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 8 }
                    }
                },
                response: {
                    201: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' },
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
        async (request: FastifyRequest<{ Body: CompleteRegistrationBody }>, reply: FastifyReply) => {
            try {
                const { email, password } = request.body;

                const normalizedEmail = email.toLowerCase().trim();

                const { data: otpData } = await supabase
                    .from('otp_verifications')
                    .select('*')
                    .eq('email', normalizedEmail)
                    .eq('verified', true)
                    .single();

                if (!otpData) {
                    return reply.status(400).send({
                        success: false,
                        message: 'Email not verified. Please verify your email with OTP first.'
                    });
                }

                const userData = (otpData as any).user_data || {};

                const { data, error } = await supabase.auth.signUp({
                    email: normalizedEmail,
                    password,
                    options: {
                        data: {
                            full_name: userData.full_name || '',
                            phone: userData.phone || '',
                            location: userData.location || ''
                        },
                        emailRedirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`
                    }
                });

                if (error) {
                    logger.error('Registration failed', { email: normalizedEmail, error });
                    return reply.status(400).send({
                        success: false,
                        message: error.message
                    });
                }

                if (data.user) {
                    await supabase
                        .from('profiles')
                        .insert({
                            user_id: data.user.id,
                            email: normalizedEmail,
                            full_name: userData.full_name || '',
                            phone: userData.phone || null,
                            location: userData.location || null
                        } as any);

                    await deleteOTP(normalizedEmail);

                    if (userData.full_name) {
                        await sendWelcomeEmail(normalizedEmail, userData.full_name);
                    }
                }

                logger.info('User registered successfully', {
                    user_id: data.user?.id,
                    email: normalizedEmail
                });

                return reply.status(201).send({
                    success: true,
                    message: 'Registration completed successfully!',
                    data: {
                        user: data.user,
                        session: data.session,
                        access_token: data.session?.access_token
                    }
                });
            } catch (error) {
                logger.error('Complete registration error', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to complete registration'
                });
            }
        }
    );

    // Resend OTP
    fastify.post<{ Body: { email: string } }>(
        '/resend-otp',
        {
            schema: {
                description: 'Resend OTP to email',
                tags: ['otp-auth'],
                body: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string', format: 'email' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) => {
            try {
                const { email } = request.body;
                const normalizedEmail = email.toLowerCase().trim();

                const { data: existingOTP } = await supabase
                    .from('otp_verifications')
                    .select('user_data')
                    .eq('email', normalizedEmail)
                    .single();

                if (!existingOTP) {
                    return reply.status(404).send({
                        success: false,
                        message: 'No OTP request found for this email. Please request a new OTP.'
                    });
                }

                const userData = (existingOTP as any).user_data || {};
                const otp = generateOTP();

                await storeOTP(normalizedEmail, otp, userData);
                await sendOTPEmail(normalizedEmail, otp, userData.full_name);

                logger.info('OTP resent', { email: normalizedEmail });

                return reply.send({
                    success: true,
                    message: 'OTP resent successfully. Please check your email.'
                });
            } catch (error) {
                logger.error('Resend OTP error', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to resend OTP'
                });
            }
        }
    );
}
