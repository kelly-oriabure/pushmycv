import { supabase } from '../config/supabase.js';
import { EnqueueJobParams, QueueJob } from '../types/queue.js';
import { logger } from './logger.js';

export async function enqueueJob(params: EnqueueJobParams): Promise<QueueJob> {
    const { type, payload, priority = 0, max_attempts = 5 } = params;

    try {
        const { data, error } = await supabase
            .from('queue_jobs')
            .insert([
                {
                    type,
                    payload,
                    status: 'pending',
                    priority,
                    max_attempts,
                    attempts: 0
                }
            ])
            .select()
            .single();

        if (error) {
            logger.error('Failed to enqueue job', error, { type, payload });
            throw error;
        }

        logger.info('Job enqueued successfully', { job_id: data.id, type });
        return data as QueueJob;
    } catch (error) {
        logger.error('Error in enqueueJob', error);
        throw error;
    }
}

export async function updateJobStatus(
    jobId: number,
    status: 'processing' | 'done' | 'failed',
    additionalData?: Partial<QueueJob>
): Promise<void> {
    try {
        const updateData: any = {
            status,
            updated_at: new Date().toISOString(),
            ...additionalData
        };

        const { error } = await supabase
            .from('queue_jobs')
            .update(updateData)
            .eq('id', jobId);

        if (error) {
            logger.error('Failed to update job status', error, { job_id: jobId, status });
            throw error;
        }

        logger.info('Job status updated', { job_id: jobId, status });
    } catch (error) {
        logger.error('Error in updateJobStatus', error);
        throw error;
    }
}

export async function incrementJobAttempts(jobId: number, currentAttempts: number): Promise<void> {
    try {
        const { error } = await supabase
            .from('queue_jobs')
            .update({
                attempts: currentAttempts + 1,
                status: 'pending',
                locked_at: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId);

        if (error) {
            logger.error('Failed to increment job attempts', error, { job_id: jobId });
            throw error;
        }

        logger.info('Job attempts incremented', { job_id: jobId, attempts: currentAttempts + 1 });
    } catch (error) {
        logger.error('Error in incrementJobAttempts', error);
        throw error;
    }
}

export async function markJobAsFailed(jobId: number, errorMessage?: string): Promise<void> {
    try {
        const updateData: any = {
            status: 'failed',
            updated_at: new Date().toISOString()
        };

        if (errorMessage) {
            updateData.payload = {
                error: errorMessage
            };
        }

        const { error } = await supabase
            .from('queue_jobs')
            .update(updateData)
            .eq('id', jobId);

        if (error) {
            logger.error('Failed to mark job as failed', error, { job_id: jobId });
            throw error;
        }

        logger.warn('Job marked as failed', { job_id: jobId, error: errorMessage });
    } catch (error) {
        logger.error('Error in markJobAsFailed', error);
        throw error;
    }
}
