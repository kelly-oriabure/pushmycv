import { supabase } from '../config/supabase.js';
import { QueueJob } from '../types/queue.js';
import { logger } from '../utils/logger.js';
import { updateJobStatus, incrementJobAttempts, markJobAsFailed } from '../utils/jobHelpers.js';
import { jobHandlers } from '../jobs/index.js';

const POLL_INTERVAL = Number(process.env.WORKER_POLL_INTERVAL) || 5000;
const MAX_RETRIES = Number(process.env.WORKER_MAX_RETRIES) || 5;

let workerInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

export async function startWorker(): Promise<void> {
    logger.info('Worker loop starting...', { poll_interval: POLL_INTERVAL });

    if (workerInterval) {
        logger.warn('Worker already running, skipping start');
        return;
    }

    workerInterval = setInterval(async () => {
        if (isProcessing) {
            logger.debug('Worker still processing previous job, skipping this cycle');
            return;
        }

        try {
            isProcessing = true;
            await processNextJob();
        } catch (error) {
            logger.error('Error in worker loop', error);
        } finally {
            isProcessing = false;
        }
    }, POLL_INTERVAL);

    logger.info('Worker loop started successfully');
}

export async function stopWorker(): Promise<void> {
    if (workerInterval) {
        clearInterval(workerInterval);
        workerInterval = null;
        logger.info('Worker loop stopped');
    }
}

async function processNextJob(): Promise<void> {
    try {
        // Fetch the next pending job with highest priority
        const { data: jobs, error } = await supabase
            .from('queue_jobs')
            .select('*')
            .eq('status', 'pending')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(1);

        if (error) {
            logger.error('Failed to fetch jobs from queue', error);
            return;
        }

        if (!jobs || jobs.length === 0) {
            logger.debug('No pending jobs in queue');
            return;
        }

        const job = jobs[0] as unknown as QueueJob;

        // Check if job has exceeded max attempts
        if (job.attempts >= job.max_attempts) {
            logger.warn('Job exceeded max attempts, marking as failed', {
                job_id: job.id,
                attempts: job.attempts,
                max_attempts: job.max_attempts
            });
            await markJobAsFailed(job.id, 'Max retry attempts exceeded');
            return;
        }

        await processJob(job);
    } catch (error) {
        logger.error('Error processing next job', error);
    }
}

async function processJob(job: QueueJob): Promise<void> {
    logger.info('Processing job', {
        job_id: job.id,
        type: job.type,
        attempt: job.attempts + 1,
        max_attempts: job.max_attempts
    });

    try {
        // Mark job as processing and lock it
        await updateJobStatus(job.id, 'processing', {
            locked_at: new Date().toISOString()
        });

        // Get the appropriate job handler
        const handler = jobHandlers[job.type];

        if (!handler) {
            throw new Error(`No handler found for job type: ${job.type}`);
        }

        // Execute the job handler
        await handler(job.payload);

        // Mark job as done
        await updateJobStatus(job.id, 'done');

        logger.info('Job completed successfully', {
            job_id: job.id,
            type: job.type
        });

    } catch (error) {
        logger.error('Job processing failed', error, {
            job_id: job.id,
            type: job.type,
            attempt: job.attempts + 1
        });

        // Increment attempts and reset to pending for retry
        if (job.attempts + 1 < job.max_attempts) {
            await incrementJobAttempts(job.id, job.attempts);
            logger.info('Job will be retried', {
                job_id: job.id,
                next_attempt: job.attempts + 2,
                max_attempts: job.max_attempts
            });
        } else {
            // Max attempts reached, mark as failed
            const errorMessage = error instanceof Error ? error.message : String(error);
            await markJobAsFailed(job.id, errorMessage);
            logger.error('Job failed permanently after max attempts', error, {
                job_id: job.id,
                attempts: job.attempts + 1
            });
        }
    }
}

export async function getWorkerStatus(): Promise<{
    running: boolean;
    processing: boolean;
    poll_interval: number;
}> {
    return {
        running: workerInterval !== null,
        processing: isProcessing,
        poll_interval: POLL_INTERVAL
    };
}
