import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { Database } from '../types/database.js';

type WorkExperienceInsert = Database['public']['Tables']['work_experiences']['Insert'];
type WorkExperienceUpdate = Database['public']['Tables']['work_experiences']['Update'];

export async function experienceRoutes(fastify: FastifyInstance): Promise<void> {
    // Get all work experiences for a user
    fastify.get<{ Querystring: { user_id: string } }>(
        '/experiences',
        {
            schema: {
                description: 'Get all work experiences for a user',
                tags: ['experiences'],
                querystring: {
                    type: 'object',
                    required: ['user_id'],
                    properties: {
                        user_id: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Querystring: { user_id: string } }>, reply: FastifyReply) => {
            try {
                const { user_id } = request.query;

                const { data, error } = await supabase
                    .from('work_experiences')
                    .select('*')
                    .eq('user_id', user_id)
                    .order('start_date', { ascending: false });

                if (error) throw error;

                return reply.send({ success: true, data });
            } catch (error) {
                logger.error('Failed to fetch work experiences', error);
                return reply.status(500).send({ success: false, message: 'Failed to fetch work experiences' });
            }
        }
    );

    // Create work experience
    fastify.post<{ Body: WorkExperienceInsert }>(
        '/experiences',
        {
            schema: {
                description: 'Create a new work experience',
                tags: ['experiences'],
                body: {
                    type: 'object',
                    required: ['user_id', 'company_name', 'position', 'start_date'],
                    properties: {
                        user_id: { type: 'string' },
                        company_name: { type: 'string' },
                        position: { type: 'string' },
                        location: { type: 'string' },
                        start_date: { type: 'string', format: 'date' },
                        end_date: { type: 'string', format: 'date' },
                        is_current: { type: 'boolean' },
                        description: { type: 'string' },
                        achievements: { type: 'array', items: { type: 'string' } }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: WorkExperienceInsert }>, reply: FastifyReply) => {
            try {
                const { data, error } = await supabase
                    .from('work_experiences')
                    .insert(request.body as any)
                    .select()
                    .single();

                if (error) throw error;

                logger.info('Work experience created', { experience_id: (data as any).id });
                return reply.status(201).send({ success: true, data });
            } catch (error) {
                logger.error('Failed to create work experience', error);
                return reply.status(500).send({ success: false, message: 'Failed to create work experience' });
            }
        }
    );

    // Update work experience
    fastify.put<{ Params: { id: string }; Body: WorkExperienceUpdate }>(
        '/experiences/:id',
        {
            schema: {
                description: 'Update a work experience',
                tags: ['experiences'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Params: { id: string }; Body: WorkExperienceUpdate }>, reply: FastifyReply) => {
            try {
                const { id } = request.params;

                const { data, error } = await supabase
                    .from('work_experiences')
                    .update(request.body as any)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;

                logger.info('Work experience updated', { experience_id: id });
                return reply.send({ success: true, data });
            } catch (error) {
                logger.error('Failed to update work experience', error);
                return reply.status(500).send({ success: false, message: 'Failed to update work experience' });
            }
        }
    );

    // Delete work experience
    fastify.delete<{ Params: { id: string } }>(
        '/experiences/:id',
        {
            schema: {
                description: 'Delete a work experience',
                tags: ['experiences'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const { id } = request.params;

                const { error } = await supabase
                    .from('work_experiences')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                logger.info('Work experience deleted', { experience_id: id });
                return reply.send({ success: true, message: 'Work experience deleted successfully' });
            } catch (error) {
                logger.error('Failed to delete work experience', error);
                return reply.status(500).send({ success: false, message: 'Failed to delete work experience' });
            }
        }
    );
}
