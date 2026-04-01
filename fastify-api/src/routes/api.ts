import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { enqueueJob } from '../utils/jobHelpers.js';
import { logger } from '../utils/logger.js';
import { JobType } from '../types/queue.js';

interface ApplyJobBody {
    user_id: string;
    job_id: string;
}

interface GenerateResumeBody {
    user_id: string;
    job_id?: string;
}

interface GenerateCoverLetterBody {
    user_id: string;
    job_id: string;
}

export async function apiRoutes(fastify: FastifyInstance): Promise<void> {
    // Apply for a job
    fastify.post<{ Body: ApplyJobBody }>(
        '/apply-job',
        {
            schema: {
                description: 'Enqueue a job application task',
                tags: ['jobs'],
                body: {
                    type: 'object',
                    required: ['user_id', 'job_id'],
                    properties: {
                        user_id: { type: 'string' },
                        job_id: { type: 'string' }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            job_id: { type: 'number' },
                            message: { type: 'string' }
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: ApplyJobBody }>, reply: FastifyReply) => {
            try {
                const { user_id, job_id } = request.body;

                const result = await enqueueJob({
                    type: 'apply_job',
                    payload: { user_id, job_id },
                    priority: 10
                });

                logger.info('Job application enqueued', { user_id, job_id, queue_job_id: result.id });

                return reply.send({
                    success: true,
                    job_id: result.id,
                    message: 'Job application task enqueued successfully'
                });
            } catch (error) {
                logger.error('Failed to enqueue job application', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to enqueue job application'
                });
            }
        }
    );

    // Generate resume
    fastify.post<{ Body: GenerateResumeBody }>(
        '/generate-resume',
        {
            schema: {
                description: 'Enqueue a resume generation task',
                tags: ['jobs'],
                body: {
                    type: 'object',
                    required: ['user_id'],
                    properties: {
                        user_id: { type: 'string' },
                        job_id: { type: 'string' }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            job_id: { type: 'number' },
                            message: { type: 'string' }
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: GenerateResumeBody }>, reply: FastifyReply) => {
            try {
                const { user_id, job_id } = request.body;

                const result = await enqueueJob({
                    type: 'generate_resume',
                    payload: { user_id, job_id },
                    priority: 5
                });

                logger.info('Resume generation enqueued', { user_id, queue_job_id: result.id });

                return reply.send({
                    success: true,
                    job_id: result.id,
                    message: 'Resume generation task enqueued successfully'
                });
            } catch (error) {
                logger.error('Failed to enqueue resume generation', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to enqueue resume generation'
                });
            }
        }
    );

    // Generate cover letter
    fastify.post<{ Body: GenerateCoverLetterBody }>(
        '/generate-cover-letter',
        {
            schema: {
                description: 'Enqueue a cover letter generation task',
                tags: ['jobs'],
                body: {
                    type: 'object',
                    required: ['user_id', 'job_id'],
                    properties: {
                        user_id: { type: 'string' },
                        job_id: { type: 'string' }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            job_id: { type: 'number' },
                            message: { type: 'string' }
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: GenerateCoverLetterBody }>, reply: FastifyReply) => {
            try {
                const { user_id, job_id } = request.body;

                const result = await enqueueJob({
                    type: 'generate_cover_letter',
                    payload: { user_id, job_id },
                    priority: 5
                });

                logger.info('Cover letter generation enqueued', { user_id, job_id, queue_job_id: result.id });

                return reply.send({
                    success: true,
                    job_id: result.id,
                    message: 'Cover letter generation task enqueued successfully'
                });
            } catch (error) {
                logger.error('Failed to enqueue cover letter generation', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to enqueue cover letter generation'
                });
            }
        }
    );

    // Get job status
    fastify.get<{ Params: { id: string } }>(
        '/job/:id',
        {
            schema: {
                description: 'Get the status of a queued job',
                tags: ['jobs'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            id: { type: 'number' },
                            type: { type: 'string' },
                            status: { type: 'string' },
                            attempts: { type: 'number' },
                            created_at: { type: 'string' },
                            updated_at: { type: 'string' }
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const { id } = request.params;

                // TODO: Implement actual job status retrieval from Supabase
                // This is a placeholder
                logger.info('Job status requested', { job_id: id });

                return reply.send({
                    id: parseInt(id),
                    type: 'pending',
                    status: 'pending',
                    attempts: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            } catch (error) {
                logger.error('Failed to get job status', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to retrieve job status'
                });
            }
        }
    );
}
