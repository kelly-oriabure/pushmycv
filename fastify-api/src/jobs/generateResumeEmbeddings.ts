import { JobPayload } from '../types/queue.js';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';
import { generateResumeEmbedding, generateBatchResumeEmbeddings } from '../services/embeddingService.js';

export async function generateResumeEmbeddings(payload: JobPayload): Promise<void> {
    const { resume_upload_id, batch_size = 10 } = payload;

    logger.info('Starting resume embedding generation', { resume_upload_id, batch_size });

    try {
        // If specific resume_upload_id provided, process just that resume
        if (resume_upload_id) {
            await processSingleResume(resume_upload_id);
            return;
        }

        // Otherwise, batch process pending resumes
        await processPendingResumes(batch_size);

    } catch (error) {
        logger.error('Failed to generate resume embeddings', error, { resume_upload_id });
        throw error;
    }
}

async function processSingleResume(resumeUploadId: string): Promise<void> {
    logger.info('Processing single resume embedding', { resume_upload_id: resumeUploadId });

    // Fetch resume details
    const { data: resumeData, error: fetchError } = await supabase
        .from('resume_uploads')
        .select('*')
        .eq('id', resumeUploadId)
        .single();

    if (fetchError || !resumeData) {
        throw new Error(`Resume upload not found: ${resumeUploadId}`);
    }

    // Update status to processing
    await updateResumeEmbeddingStatus(resumeUploadId, 'processing');

    try {
        // Check if we have extracted text
        if (!resumeData.extracted_text || resumeData.extracted_text.trim().length === 0) {
            throw new Error('No extracted text available for embedding generation');
        }

        // Generate embedding
        const embedding = await generateResumeEmbedding({
            extracted_text: resumeData.extracted_text,
            file_name: resumeData.file_name
        });

        // Store embedding in database
        const { error: updateError } = await supabase
            .from('resume_uploads')
            .update({
                embedding,
                embedding_status: 'completed',
                embedded_at: new Date().toISOString()
            })
            .eq('id', resumeUploadId);

        if (updateError) {
            throw updateError;
        }

        logger.info('Resume embedding generated successfully', { resume_upload_id: resumeUploadId });

    } catch (error) {
        await updateResumeEmbeddingStatus(resumeUploadId, 'failed');
        throw error;
    }
}

async function processPendingResumes(batchSize: number): Promise<void> {
    logger.info('Batch processing pending resume embeddings', { batch_size: batchSize });

    // Fetch resumes pending embedding
    const { data: resumesData, error: fetchError } = await supabase
        .from('resume_uploads')
        .select('*')
        .eq('embedding_status', 'pending')
        .not('extracted_text', 'is', null)
        .limit(batchSize);

    if (fetchError) {
        throw fetchError;
    }

    if (!resumesData || resumesData.length === 0) {
        logger.info('No pending resumes for embedding generation');
        return;
    }

    logger.info(`Found ${resumesData.length} resumes pending embedding`);

    // Mark resumes as processing
    for (const resume of resumesData) {
        await updateResumeEmbeddingStatus(resume.id, 'processing');
    }

    try {
        // Generate batch embeddings
        const embeddings = await generateBatchResumeEmbeddings(
            resumesData.map(resume => ({
                id: resume.id,
                extracted_text: resume.extracted_text,
                file_name: resume.file_name
            }))
        );

        // Update resumes with embeddings
        for (const { id, embedding } of embeddings) {
            const { error: updateError } = await supabase
                .from('resume_uploads')
                .update({
                    embedding,
                    embedding_status: 'completed',
                    embedded_at: new Date().toISOString()
                })
                .eq('id', id);

            if (updateError) {
                logger.error('Failed to update resume embedding', updateError, { resume_upload_id: id });
                await updateResumeEmbeddingStatus(id, 'failed');
            }
        }

        logger.info('Batch resume embedding generation completed', {
            processed: embeddings.length,
            total: resumesData.length
        });

    } catch (error) {
        // Mark all resumes as failed
        for (const resume of resumesData) {
            await updateResumeEmbeddingStatus(resume.id, 'failed');
        }
        throw error;
    }
}

async function updateResumeEmbeddingStatus(
    resumeUploadId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<void> {
    const { error } = await supabase
        .from('resume_uploads')
        .update({ embedding_status: status })
        .eq('id', resumeUploadId);

    if (error) {
        logger.error('Failed to update resume embedding status', error, { resume_upload_id: resumeUploadId, status });
    }
}
