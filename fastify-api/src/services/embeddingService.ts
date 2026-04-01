import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS) || 768;

/**
 * Generate embedding for job description using Gemini
 */
export async function generateJobEmbedding(job: {
    title: string;
    description?: string;
    requirements?: string;
    company_name?: string;
    location?: string;
    job_type?: string;
}): Promise<number[]> {
    try {
        const textToEmbed = [
            job.title,
            job.company_name,
            job.description,
            job.requirements,
            job.location,
            job.job_type
        ].filter(Boolean).join('\n\n');

        if (!textToEmbed.trim()) {
            throw new Error('No content available to generate embedding');
        }

        const model = genAI.getGenerativeModel({ model: `models/${EMBEDDING_MODEL}` });
        const result = await model.embedContent({
            content: { parts: [{ text: textToEmbed }] },
            taskType: 'retrieval_document'
        });

        const embedding = result.embedding.values.slice(0, EMBEDDING_DIMENSIONS);

        logger.info('Generated job embedding with Gemini', {
            model: EMBEDDING_MODEL,
            dimensions: embedding.length
        });

        return embedding;
    } catch (error) {
        logger.error('Failed to generate job embedding', error);
        throw error;
    }
}

/**
 * Generate embedding for resume text using Gemini
 */
export async function generateResumeEmbedding(resume: {
    extracted_text: string;
    file_name?: string;
}): Promise<number[]> {
    try {
        const textToEmbed = [resume.file_name, resume.extracted_text]
            .filter(Boolean).join('\n\n');

        if (!textToEmbed.trim()) {
            throw new Error('No resume content available');
        }

        const model = genAI.getGenerativeModel({ model: `models/${EMBEDDING_MODEL}` });
        const result = await model.embedContent({
            content: { parts: [{ text: textToEmbed }] },
            taskType: 'retrieval_document'
        });

        return result.embedding.values.slice(0, EMBEDDING_DIMENSIONS);
    } catch (error) {
        logger.error('Failed to generate resume embedding', error);
        throw error;
    }
}

/**
 * Generate embedding for user profile using Gemini
 */
export async function generateProfileEmbedding(profile: {
    skills?: string[];
    experience?: string;
    preferences?: string;
    bio?: string;
    target_roles?: string[];
}): Promise<number[]> {
    try {
        const textToEmbed = [
            profile.bio,
            profile.experience,
            profile.preferences,
            profile.skills?.join(', '),
            profile.target_roles?.join(', ')
        ].filter(Boolean).join('\n\n');

        if (!textToEmbed.trim()) {
            throw new Error('No profile content available');
        }

        const model = genAI.getGenerativeModel({ model: `models/${EMBEDDING_MODEL}` });
        const result = await model.embedContent({
            content: { parts: [{ text: textToEmbed }] },
            taskType: 'retrieval_query'
        });

        return result.embedding.values.slice(0, EMBEDDING_DIMENSIONS);
    } catch (error) {
        logger.error('Failed to generate profile embedding', error);
        throw error;
    }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
        throw new Error(`Dimension mismatch: ${embedding1.length} vs ${embedding2.length}`);
    }

    let dotProduct = 0, norm1 = 0, norm2 = 0;
    for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
    }

    return Math.max(0, Math.min(1, dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))));
}

/**
 * Convert similarity score to percentage
 */
export function similarityToPercentage(similarity: number): number {
    return Math.round(similarity * 100);
}

/**
 * Batch generate embeddings for jobs using Gemini
 */
export async function generateBatchEmbeddings(
    jobs: Array<{ id: string; title: string; description?: string; requirements?: string; company_name?: string; location?: string; job_type?: string; }>
): Promise<Array<{ id: string; embedding: number[] }>> {
    if (jobs.length === 0) return [];

    const model = genAI.getGenerativeModel({ model: `models/${EMBEDDING_MODEL}` });
    const results: Array<{ id: string; embedding: number[] }> = [];

    // Process in batches of 100
    for (let i = 0; i < jobs.length; i += 100) {
        const batch = jobs.slice(i, i + 100);
        const requests = batch.map(job => ({
            content: {
                parts: [{
                    text: [job.title, job.company_name, job.description, job.requirements, job.location, job.job_type]
                        .filter(Boolean).join('\n\n')
                }]
            },
            taskType: 'retrieval_document' as const
        }));

        const batchResult = await model.batchEmbedContents({ requests });

        batch.forEach((job, index) => {
            results.push({
                id: job.id,
                embedding: batchResult.embeddings[index].values.slice(0, EMBEDDING_DIMENSIONS)
            });
        });
    }

    return results;
}

/**
 * Batch generate embeddings for resumes using Gemini
 */
export async function generateBatchResumeEmbeddings(
    resumes: Array<{ id: string; extracted_text: string; file_name?: string; }>
): Promise<Array<{ id: string; embedding: number[] }>> {
    if (resumes.length === 0) return [];

    const model = genAI.getGenerativeModel({ model: `models/${EMBEDDING_MODEL}` });
    const results: Array<{ id: string; embedding: number[] }> = [];

    for (let i = 0; i < resumes.length; i += 100) {
        const batch = resumes.slice(i, i + 100);
        const requests = batch.map(resume => ({
            content: {
                parts: [{
                    text: [resume.file_name, resume.extracted_text].filter(Boolean).join('\n\n')
                }]
            },
            taskType: 'retrieval_document' as const
        }));

        const batchResult = await model.batchEmbedContents({ requests });

        batch.forEach((resume, index) => {
            results.push({
                id: resume.id,
                embedding: batchResult.embeddings[index].values.slice(0, EMBEDDING_DIMENSIONS)
            });
        });
    }

    return results;
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };
