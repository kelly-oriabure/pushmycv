import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { Database } from '../types/database.js';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export async function profileRoutes(fastify: FastifyInstance): Promise<void> {
    // Get all profiles (admin only - for demo purposes, no auth check)
    fastify.get(
        '/profiles',
        {
            schema: {
                description: 'Get all user profiles',
                tags: ['profiles'],
                security: [{ bearerAuth: [] }],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        user_id: { type: 'string' },
                                        email: { type: 'string' },
                                        full_name: { type: 'string' },
                                        phone: { type: 'string', nullable: true },
                                        location: { type: 'string', nullable: true },
                                        linkedin_url: { type: 'string', nullable: true },
                                        github_url: { type: 'string', nullable: true },
                                        portfolio_url: { type: 'string', nullable: true },
                                        bio: { type: 'string', nullable: true },
                                        avatar_url: { type: 'string', nullable: true },
                                        created_at: { type: 'string' },
                                        updated_at: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        async (_request: FastifyRequest, reply: FastifyReply) => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                return reply.send({ success: true, data });
            } catch (error) {
                logger.error('Failed to fetch profiles', error);
                return reply.status(500).send({ success: false, message: 'Failed to fetch profiles' });
            }
        }
    );

    // Get profile by user_id
    fastify.get<{ Params: { user_id: string } }>(
        '/profiles/:user_id',
        {
            schema: {
                description: 'Get a user profile by user_id',
                tags: ['profiles'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        user_id: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Params: { user_id: string } }>, reply: FastifyReply) => {
            try {
                const { user_id } = request.params;

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user_id)
                    .single();

                if (error) throw error;

                return reply.send({ success: true, data });
            } catch (error) {
                logger.error('Failed to fetch profile', error);
                return reply.status(404).send({ success: false, message: 'Profile not found' });
            }
        }
    );

    // Create profile
    fastify.post<{ Body: ProfileInsert }>(
        '/profiles',
        {
            schema: {
                description: 'Create a new user profile',
                tags: ['profiles'],
                security: [{ bearerAuth: [] }],
                body: {
                    type: 'object',
                    required: ['user_id', 'email', 'full_name'],
                    properties: {
                        user_id: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        full_name: { type: 'string' },
                        phone: { type: 'string' },
                        location: { type: 'string' },
                        linkedin_url: { type: 'string' },
                        github_url: { type: 'string' },
                        portfolio_url: { type: 'string' },
                        bio: { type: 'string' },
                        avatar_url: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: ProfileInsert }>, reply: FastifyReply) => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .insert(request.body)
                    .select()
                    .single();

                if (error) throw error;

                logger.info('Profile created', { profile_id: data.id });
                return reply.status(201).send({ success: true, data });
            } catch (error) {
                logger.error('Failed to create profile', error);
                return reply.status(500).send({ success: false, message: 'Failed to create profile' });
            }
        }
    );

    // Update profile
    fastify.put<{ Params: { user_id: string }; Body: ProfileUpdate }>(
        '/profiles/:user_id',
        {
            schema: {
                description: 'Update a user profile',
                tags: ['profiles'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        user_id: { type: 'string' }
                    }
                },
                body: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', format: 'email' },
                        full_name: { type: 'string' },
                        phone: { type: 'string' },
                        location: { type: 'string' },
                        linkedin_url: { type: 'string' },
                        github_url: { type: 'string' },
                        portfolio_url: { type: 'string' },
                        bio: { type: 'string' },
                        avatar_url: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Params: { user_id: string }; Body: ProfileUpdate }>, reply: FastifyReply) => {
            try {
                const { user_id } = request.params;

                const { data, error } = await supabase
                    .from('profiles')
                    .update(request.body)
                    .eq('user_id', user_id)
                    .select()
                    .single();

                if (error) throw error;

                logger.info('Profile updated', { user_id });
                return reply.send({ success: true, data });
            } catch (error) {
                logger.error('Failed to update profile', error);
                return reply.status(500).send({ success: false, message: 'Failed to update profile' });
            }
        }
    );

    // Delete profile
    fastify.delete<{ Params: { user_id: string } }>(
        '/profiles/:user_id',
        {
            schema: {
                description: 'Delete a user profile',
                tags: ['profiles'],
                security: [{ bearerAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        user_id: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Params: { user_id: string } }>, reply: FastifyReply) => {
            try {
                const { user_id } = request.params;

                const { error } = await supabase
                    .from('profiles')
                    .delete()
                    .eq('user_id', user_id);

                if (error) throw error;

                logger.info('Profile deleted', { user_id });
                return reply.send({ success: true, message: 'Profile deleted successfully' });
            } catch (error) {
                logger.error('Failed to delete profile', error);
                return reply.status(500).send({ success: false, message: 'Failed to delete profile' });
            }
        }
    );
}
