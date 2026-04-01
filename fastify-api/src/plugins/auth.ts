import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            id: string;
            email: string;
            role?: string;
        };
    }
}

async function authPlugin(fastify: FastifyInstance): Promise<void> {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error('JWT_SECRET or SUPABASE_JWT_SECRET must be set in environment variables');
    }

    await fastify.register(jwt, {
        secret: jwtSecret,
        verify: {
            algorithms: ['HS256']
        }
    });

    fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
        try {
            const authHeader = request.headers.authorization;

            if (!authHeader) {
                return reply.status(401).send({
                    success: false,
                    message: 'Missing authorization header'
                });
            }

            const token = authHeader.replace('Bearer ', '');

            if (!token) {
                return reply.status(401).send({
                    success: false,
                    message: 'Invalid authorization format. Use: Bearer <token>'
                });
            }

            try {
                const { data: { user }, error } = await supabase.auth.getUser(token);

                if (error || !user) {
                    logger.warn('Invalid token', { error: error?.message });
                    return reply.status(401).send({
                        success: false,
                        message: 'Invalid or expired token'
                    });
                }

                request.user = {
                    id: user.id,
                    email: user.email || '',
                    role: user.role
                };

                logger.debug('User authenticated', { user_id: user.id, email: user.email });
            } catch (jwtError) {
                logger.error('JWT verification failed', jwtError);
                return reply.status(401).send({
                    success: false,
                    message: 'Token verification failed'
                });
            }
        } catch (error) {
            logger.error('Authentication error', error);
            return reply.status(500).send({
                success: false,
                message: 'Authentication error'
            });
        }
    });

    fastify.decorate('optionalAuth', async function (request: FastifyRequest, _reply: FastifyReply) {
        try {
            const authHeader = request.headers.authorization;

            if (!authHeader) {
                return;
            }

            const token = authHeader.replace('Bearer ', '');

            if (!token) {
                return;
            }

            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (!error && user) {
                request.user = {
                    id: user.id,
                    email: user.email || '',
                    role: user.role
                };
            }
        } catch (error) {
            logger.debug('Optional auth failed, continuing without user', error);
        }
    });
}

export default fp(authPlugin, {
    name: 'auth-plugin'
});
