import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';
import { cleanupExpiredOTPs } from '../utils/otp.js';
import { enqueueJob } from '../utils/jobHelpers.js';

const scheduledTasks: cron.ScheduledTask[] = [];

export function scheduleCronJobs(): void {
    logger.info('Scheduling cron jobs...');

    // Daily job fetch at 1:00 AM
    const dailyJobFetch = cron.schedule('0 1 * * *', async () => {
        logger.info('Running daily job ingestion cron');
        try {
            await enqueueJob({
                type: 'fetch_jobs',
                payload: { source: 'job_board_api' },
                priority: 5
            });
            logger.info('Daily job fetch task enqueued successfully');
        } catch (error) {
            logger.error('Failed to enqueue daily job fetch', error);
        }
    });

    scheduledTasks.push(dailyJobFetch);

    // Embedding generation every 30 minutes
    const embeddingGeneration = cron.schedule('*/30 * * * *', async () => {
        logger.info('Running embedding generation cron');
        try {
            await enqueueJob({
                type: 'generate_embeddings',
                payload: { batch_size: 20 },
                priority: 3
            });
            logger.info('Embedding generation task enqueued successfully');
        } catch (error) {
            logger.error('Failed to enqueue embedding generation', error);
        }
    });

    scheduledTasks.push(embeddingGeneration);

    // Resume embedding generation every 30 minutes (offset from job embeddings)
    const resumeEmbeddingGeneration = cron.schedule('15,45 * * * *', async () => {
        logger.info('Running resume embedding generation cron');
        try {
            await enqueueJob({
                type: 'generate_resume_embeddings',
                payload: { batch_size: 10 },
                priority: 3
            });
            logger.info('Resume embedding generation task enqueued successfully');
        } catch (error) {
            logger.error('Failed to enqueue resume embedding generation', error);
        }
    });

    scheduledTasks.push(resumeEmbeddingGeneration);

    // Job fetch from APIs every 6 hours
    const jobFetchFromAPIs = cron.schedule('0 */6 * * *', async () => {
        logger.info('Running job fetch from APIs cron');
        try {
            await enqueueJob({
                type: 'fetch_jobs_api',
                payload: { sources: ['remoteok', 'arbeitnow'], limit: 100 },
                priority: 2
            });
            logger.info('Job fetch from APIs task enqueued successfully');
        } catch (error) {
            logger.error('Failed to enqueue job fetch from APIs', error);
        }
    });

    scheduledTasks.push(jobFetchFromAPIs);

    // Example: Check for scheduled applications every hour
    const hourlyApplicationCheck = cron.schedule('0 * * * *', async () => {
        logger.info('Running hourly scheduled application check');
        try {
            // TODO: Query database for scheduled applications
            // and enqueue apply_job tasks
            logger.info('Hourly application check completed');
        } catch (error) {
            logger.error('Failed to process hourly application check', error);
        }
    });

    scheduledTasks.push(hourlyApplicationCheck);

    // Example: Generate weekly resume updates on Sunday at 2:00 AM
    const weeklyResumeUpdate = cron.schedule('0 2 * * 0', async () => {
        logger.info('Running weekly resume update cron');
        try {
            // TODO: Query active users and enqueue resume generation tasks
            logger.info('Weekly resume update tasks enqueued');
        } catch (error) {
            logger.error('Failed to enqueue weekly resume updates', error);
        }
    });

    scheduledTasks.push(weeklyResumeUpdate);

    logger.info('Cron jobs scheduled successfully', {
        total_jobs: scheduledTasks.length
    });
}

export function stopCronJobs(): void {
    logger.info('Stopping all cron jobs...');
    scheduledTasks.forEach(task => task.stop());
    scheduledTasks.length = 0;
    logger.info('All cron jobs stopped');
}

export function getCronStatus(): {
    total_jobs: number;
    jobs: Array<{ running: boolean }>;
} {
    return {
        total_jobs: scheduledTasks.length,
        jobs: scheduledTasks.map(() => ({ running: true }))
    };
}
