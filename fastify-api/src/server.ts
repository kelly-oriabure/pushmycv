import 'dotenv/config.js';
import { buildApp } from './app.js';
import { scheduleCronJobs, stopCronJobs } from './cron/schedule.js';
import { startWorker, stopWorker } from './workers/queueWorker.js';
import { logger } from './utils/logger.js';

const start = async (): Promise<void> => {
    try {
        const app = await buildApp();
        const port = Number(process.env.PORT) || 3000;
        const host = process.env.HOST || '0.0.0.0';

        // Start the Fastify server
        await app.listen({ port, host });
        logger.info(`Server is running on http://${host}:${port}`);
        logger.info(`Swagger documentation available at http://${host}:${port}/docs`);

        // Start TypeScript queue worker for embeddings and other jobs
        await startWorker();
        logger.info('TypeScript queue worker started');

        // Schedule cron jobs
        scheduleCronJobs();
        logger.info('Cron jobs scheduled');

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`Received ${signal}, shutting down gracefully...`);

            stopCronJobs();
            await stopWorker();
            await app.close();

            logger.info('Server shut down successfully');
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (err) {
        logger.error('Failed to start server', err);
        process.exit(1);
    }
};

start();
