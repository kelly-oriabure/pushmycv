import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { Database } from '../types/database.js';

type Job = Database['public']['Tables']['jobs']['Row'];
type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type JobUpdate = Database['public']['Tables']['jobs']['Update'];

export async function jobRoutes(fastify: FastifyInstance): Promise<void> {
    // Get all active jobs
    fastify.get(
        '/jobs',
        {
            schema: {
                description: 'Get all active job listings',
                tags: ['jobs'],
                querystring: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['active', 'closed', 'filled'] },
                        location: { type: 'string' },
                        job_type: { type: 'string' },
                        limit: { type: 'integer', default: 50 }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Querystring: { status?: string; location?: string; job_type?: string; limit?: number } }>, reply: FastifyReply) => {
            try {
                const { status = 'active', location, job_type, limit = 50 } = request.query;

                let query = supabase
                    .from('jobs')
                    .select('*')
                    .eq('status', status)
                    .order('posted_date', { ascending: false })
                    .limit(limit);

                if (location) {
                    query = query.ilike('location', `%${location}%`);
                }

                if (job_type) {
                    query = query.eq('job_type', job_type);
                }

                const { data, error } = await query;

                if (error) throw error;

                return reply.send({ success: true, data, count: data?.length || 0 });
            } catch (error) {
                logger.error('Failed to fetch jobs', error);
                return reply.status(500).send({ success: false, message: 'Failed to fetch jobs' });
            }
        }
    );

    // Get job by ID
    fastify.get<{ Params: { id: string } }>(
        '/jobs/:id',
        {
            schema: {
                description: 'Get a job listing by ID',
                tags: ['jobs'],
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
                    .from('jobs')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                return reply.send({ success: true, data });
            } catch (error) {
                logger.error('Failed to fetch job', error);
                return reply.status(404).send({ success: false, message: 'Job not found' });
            }
        }
    );

    // Create job listing
    fastify.post<{ Body: JobInsert }>(
        '/jobs',
        {
            schema: {
                description: 'Create a new job listing',
                tags: ['jobs'],
                body: {
                    type: 'object',
                    required: ['title', 'company'],
                    properties: {
                        title: { type: 'string' },
                        company: { type: 'string' },
                        company_logo_url: { type: 'string' },
                        location: { type: 'string' },
                        job_type: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'remote'] },
                        salary_min: { type: 'integer' },
                        salary_max: { type: 'integer' },
                        salary_currency: { type: 'string', default: 'USD' },
                        description: { type: 'string' },
                        requirements: { type: 'array', items: { type: 'string' } },
                        responsibilities: { type: 'array', items: { type: 'string' } },
                        benefits: { type: 'array', items: { type: 'string' } },
                        application_url: { type: 'string' },
                        source: { type: 'string' },
                        source_job_id: { type: 'string' },
                        posted_date: { type: 'string', format: 'date-time' },
                        deadline: { type: 'string', format: 'date-time' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: JobInsert }>, reply: FastifyReply) => {
            try {
                const { data, error } = await supabase
                    .from('jobs')
                    .insert(request.body)
                    .select()
                    .single();

                if (error) throw error;

                logger.info('Job created', { job_id: data.id });
                return reply.status(201).send({ success: true, data });
            } catch (error) {
                logger.error('Failed to create job', error);
                return reply.status(500).send({ success: false, message: 'Failed to create job' });
            }
        }
    );

    // Update job
    fastify.put<{ Params: { id: string }; Body: JobUpdate }>(
        '/jobs/:id',
        {
            schema: {
                description: 'Update a job listing',
                tags: ['jobs'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Params: { id: string }; Body: JobUpdate }>, reply: FastifyReply) => {
            try {
                const { id } = request.params;

                const { data, error } = await supabase
                    .from('jobs')
                    .update(request.body)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;

                logger.info('Job updated', { job_id: id });
                return reply.send({ success: true, data });
            } catch (error) {
                logger.error('Failed to update job', error);
                return reply.status(500).send({ success: false, message: 'Failed to update job' });
            }
        }
    );

    // Delete job
    fastify.delete<{ Params: { id: string } }>(
        '/jobs/:id',
        {
            schema: {
                description: 'Delete a job listing',
                tags: ['jobs'],
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
                    .from('jobs')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                logger.info('Job deleted', { job_id: id });
                return reply.send({ success: true, message: 'Job deleted successfully' });
            } catch (error) {
                logger.error('Failed to delete job', error);
                return reply.status(500).send({ success: false, message: 'Failed to delete job' });
            }
        }
    );
}
