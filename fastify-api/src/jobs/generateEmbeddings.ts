import { JobPayload, Job } from '../types/queue.js';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';
import { generateJobEmbedding, generateBatchEmbeddings } from '../services/embeddingService.js';

export async function generateJobEmbeddings(payload: JobPayload): Promise<void> {
    const { job_id, batch_size = 10 } = payload;

    logger.info('Starting job embedding generation', { job_id, batch_size });

    try {
        // If specific job_id provided, process just that job
        if (job_id) {
            await processSingleJob(job_id);
            return;
        }

        // Otherwise, batch process pending jobs
        await processPendingJobs(batch_size);

    } catch (error) {
        logger.error('Failed to generate job embeddings', error, { job_id });
        throw error;
    }
}

async function processSingleJob(jobId: string): Promise<void> {
    logger.info('Processing single job embedding', { job_id: jobId });

    // Fetch job details
    const { data: jobData, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

    const job = jobData as Job | null;

    if (fetchError || !job) {
        throw new Error(`Job not found: ${jobId}`);
    }

    // Update status to processing
    await updateEmbeddingStatus(jobId, 'processing');

    try {
        // Generate embedding
        const requirementsText = Array.isArray(job.requirements)
            ? job.requirements.join(', ')
            : job.requirements;
        const embedding = await generateJobEmbedding({
            title: job.title,
            description: job.description,
            requirements: requirementsText,
            company_name: job.company,
            location: job.location,
            job_type: job.job_type
        });

        // Store embedding in database
        const { error: updateError } = await supabase
            .from('jobs')
            .update({
                embedding,
                embedding_status: 'completed',
                embedded_at: new Date().toISOString()
            })
            .eq('id', jobId);

        if (updateError) {
            throw updateError;
        }

        logger.info('Job embedding generated successfully', { job_id: jobId });

    } catch (error) {
        await updateEmbeddingStatus(jobId, 'failed');
        throw error;
    }
}

async function processPendingJobs(batchSize: number): Promise<void> {
    logger.info('Batch processing pending job embeddings', { batch_size: batchSize });

    // Fetch jobs pending embedding
    const { data: jobsData, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('embedding_status', 'pending')
        .limit(batchSize);

    const jobs = jobsData as Job[] | null;

    if (fetchError) {
        throw fetchError;
    }

    if (!jobs || jobs.length === 0) {
        logger.info('No pending jobs for embedding generation');
        return;
    }

    logger.info(`Found ${jobs.length} jobs pending embedding`);

    // Mark jobs as processing
    for (const job of jobs) {
        await updateEmbeddingStatus(job.id, 'processing');
    }

    try {
        // Generate batch embeddings
        const embeddings = await generateBatchEmbeddings(
            jobs.map(job => {
                const reqText = Array.isArray(job.requirements)
                    ? job.requirements.join(', ')
                    : job.requirements;
                return {
                    id: job.id,
                    title: job.title,
                    description: job.description,
                    requirements: reqText,
                    company_name: job.company,
                    location: job.location,
                    job_type: job.job_type
                };
            })
        );

        // Update jobs with embeddings
        for (const { id, embedding } of embeddings) {
            const { error: updateError } = await supabase
                .from('jobs')
                .update({
                    embedding,
                    embedding_status: 'completed',
                    embedded_at: new Date().toISOString()
                })
                .eq('id', id);

            if (updateError) {
                logger.error('Failed to update job embedding', updateError, { job_id: id });
                await updateEmbeddingStatus(id, 'failed');
            }
        }

        logger.info('Batch embedding generation completed', {
            processed: embeddings.length,
            total: jobs.length
        });

    } catch (error) {
        // Mark all jobs as failed
        for (const job of jobs) {
            await updateEmbeddingStatus(job.id, 'failed');
        }
        throw error;
    }
}

async function updateEmbeddingStatus(jobId: string, status: 'pending' | 'processing' | 'completed' | 'failed'): Promise<void> {
    const { error } = await supabase
        .from('jobs')
        .update({ embedding_status: status })
        .eq('id', jobId);

    if (error) {
        logger.error('Failed to update embedding status', error, { job_id: jobId, status });
    }
}
