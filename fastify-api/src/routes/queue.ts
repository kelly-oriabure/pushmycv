import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { getWorkerStatus } from '../workers/queueWorker.js';
import { getCronStatus } from '../cron/schedule.js';
import { enqueueJob } from '../utils/jobHelpers.js';
import { JobType } from '../types/queue.js';

// Request body type for job enqueue
interface EnqueueJobRequest {
    type: JobType;
    payload: Record<string, any>;
    priority?: number;
}

export async function queueRoutes(fastify: FastifyInstance): Promise<void> {
    // Enqueue a new job
    fastify.post(
        '/jobs',
        {
            schema: {
                description: 'Enqueue a new job',
                tags: ['queue'],
                body: {
                    type: 'object',
                    required: ['type', 'payload'],
                    properties: {
                        type: { type: 'string' },
                        payload: { type: 'object' },
                        priority: { type: 'number' }
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
                    },
                    500: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' }
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: EnqueueJobRequest }>, reply: FastifyReply) => {
            try {
                const { type, payload, priority = 5 } = request.body;

                logger.info('Enqueueing job', { type, priority });

                const job = await enqueueJob({
                    type,
                    payload,
                    priority
                });

                logger.info('Job enqueued successfully', { job_id: job.id });

                return reply.send({
                    success: true,
                    job_id: job.id,
                    message: 'Job enqueued successfully'
                });
            } catch (error) {
                logger.error('Failed to enqueue job', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to enqueue job'
                });
            }
        }
    );

    // Get queue statistics
    fastify.get(
        '/stats',
        {
            schema: {
                description: 'Get queue statistics',
                tags: ['queue'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            pending: { type: 'number' },
                            processing: { type: 'number' },
                            done: { type: 'number' },
                            failed: { type: 'number' },
                            total: { type: 'number' }
                        }
                    }
                }
            }
        },
        async (_request: FastifyRequest, reply: FastifyReply) => {
            try {
                // TODO: Implement actual queue statistics from Supabase
                // This is a placeholder
                logger.info('Queue statistics requested');

                return reply.send({
                    pending: 0,
                    processing: 0,
                    done: 0,
                    failed: 0,
                    total: 0
                });
            } catch (error) {
                logger.error('Failed to get queue statistics', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to retrieve queue statistics'
                });
            }
        }
    );

    // Get worker status
    fastify.get(
        '/worker/status',
        {
            schema: {
                description: 'Get worker status',
                tags: ['queue'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            running: { type: 'boolean' },
                            processing: { type: 'boolean' },
                            poll_interval: { type: 'number' }
                        }
                    }
                }
            }
        },
        async (_request: FastifyRequest, reply: FastifyReply) => {
            try {
                const status = await getWorkerStatus();
                logger.info('Worker status requested', status);
                return reply.send(status);
            } catch (error) {
                logger.error('Failed to get worker status', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to retrieve worker status'
                });
            }
        }
    );

    // Get cron status
    fastify.get(
        '/cron/status',
        {
            schema: {
                description: 'Get cron jobs status',
                tags: ['queue'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            total_jobs: { type: 'number' },
                            jobs: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        running: { type: 'boolean' }
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
                const status = getCronStatus();
                logger.info('Cron status requested', status);
                return reply.send(status);
            } catch (error) {
                logger.error('Failed to get cron status', error);
                return reply.status(500).send({
                    success: false,
                    message: 'Failed to retrieve cron status'
                });
            }
        }
    );
}
