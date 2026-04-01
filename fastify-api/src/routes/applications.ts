import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { Database } from '../types/database.js';

type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];
type ApplicationUpdate = Database['public']['Tables']['applications']['Update'];

export async function applicationRoutes(fastify: FastifyInstance): Promise<void> {
    // Get all applications for a user
    fastify.get<{ Querystring: { user_id: string } }>(
        '/applications',
        {
            schema: {
                description: 'Get all job applications for a user',
                tags: ['applications'],
                querystring: {
                    type: 'object',
                    required: ['user_id'],
                    properties: {
                        user_id: { type: 'string' },
                        status: { type: 'string', enum: ['pending', 'submitted', 'interviewing', 'rejected', 'accepted'] }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Querystring: { user_id: string; status?: string } }>, reply: FastifyReply) => {
            try {
                const { user_id, status } = request.query;

                let query = supabase
                    .from('applications')
                    .select(`
                        *,
                        jobs (*),
                        resumes (id, title),
                        cover_letters (id, title)
                    `)
                    .eq('user_id', user_id)
                    .order('created_at', { ascending: false });

                if (status) {
                    query = query.eq('status', status);
                }

                const { data, error } = await query;

                if (error) throw error;

                return reply.send({ success: true, data, count: data?.length || 0 });
            } catch (error) {
                logger.error('Failed to fetch applications', error);
                return reply.status(500).send({ success: false, message: 'Failed to fetch applications' });
            }
        }
    );

    // Get application by ID
    fastify.get<{ Params: { id: string } }>(
        '/applications/:id',
        {
            schema: {
                description: 'Get an application by ID',
                tags: ['applications'],
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

                const { data, error } = await supabase
                    .from('applications')
                    .select(`
                        *,
                        jobs (*),
                        resumes (id, title, file_url),
                        cover_letters (id, title, content)
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;

                return reply.send({ success: true, data });
            } catch (error) {
                logger.error('Failed to fetch application', error);
                return reply.status(404).send({ success: false, message: 'Application not found' });
            }
        }
    );

    // Create application
    fastify.post<{ Body: ApplicationInsert }>(
        '/applications',
        {
            schema: {
                description: 'Create a new job application',
                tags: ['applications'],
                body: {
                    type: 'object',
                    required: ['user_id', 'job_id'],
                    properties: {
                        user_id: { type: 'string' },
                        job_id: { type: 'string' },
                        resume_id: { type: 'string' },
                        cover_letter_id: { type: 'string' },
                        status: { type: 'string', enum: ['pending', 'submitted', 'interviewing', 'rejected', 'accepted'] },
                        notes: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: ApplicationInsert }>, reply: FastifyReply) => {
            try {
                const { data, error } = await supabase
                    .from('applications')
                    .insert({
                        ...request.body as any,
                        applied_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (error) throw error;

                logger.info('Application created', { application_id: (data as any).id });
                return reply.status(201).send({ success: true, data });
            } catch (error) {
                logger.error('Failed to create application', error);
                return reply.status(500).send({ success: false, message: 'Failed to create application' });
            }
        }
    );

    // Update application status
    fastify.put<{ Params: { id: string }; Body: ApplicationUpdate }>(
        '/applications/:id',
        {
            schema: {
                description: 'Update an application',
                tags: ['applications'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                },
                body: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['pending', 'submitted', 'interviewing', 'rejected', 'accepted'] },
                        notes: { type: 'string' },
                        response_date: { type: 'string', format: 'date-time' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Params: { id: string }; Body: ApplicationUpdate }>, reply: FastifyReply) => {
            try {
                const { id } = request.params;

                const { data, error } = await supabase
                    .from('applications')
                    .update(request.body as any)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;

                logger.info('Application updated', { application_id: id, status: (request.body as any).status });
                return reply.send({ success: true, data });
            } catch (error) {
                logger.error('Failed to update application', error);
                return reply.status(500).send({ success: false, message: 'Failed to update application' });
            }
        }
    );

    // Delete application
    fastify.delete<{ Params: { id: string } }>(
        '/applications/:id',
        {
            schema: {
                description: 'Delete an application',
                tags: ['applications'],
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
                    .from('applications')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                logger.info('Application deleted', { application_id: id });
                return reply.send({ success: true, message: 'Application deleted successfully' });
            } catch (error) {
                logger.error('Failed to delete application', error);
                return reply.status(500).send({ success: false, message: 'Failed to delete application' });
            }
        }
    );

    // Get application statistics for a user
    fastify.get<{ Querystring: { user_id: string } }>(
        '/applications/stats',
        {
            schema: {
                description: 'Get application statistics for a user',
                tags: ['applications'],
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
                    .from('applications')
                    .select('status')
                    .eq('user_id', user_id);

                if (error) throw error;

                const stats = {
                    total: data?.length || 0,
                    pending: data?.filter(a => a.status === 'pending').length || 0,
                    submitted: data?.filter(a => a.status === 'submitted').length || 0,
                    interviewing: data?.filter(a => a.status === 'interviewing').length || 0,
                    rejected: data?.filter(a => a.status === 'rejected').length || 0,
                    accepted: data?.filter(a => a.status === 'accepted').length || 0
                };

                return reply.send({ success: true, data: stats });
            } catch (error) {
                logger.error('Failed to fetch application stats', error);
                return reply.status(500).send({ success: false, message: 'Failed to fetch application stats' });
            }
        }
    );
}
