import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';
import { calculateSimilarity } from './embeddingService.js';

export interface JobMatch {
    job_id: string;
    title: string;
    company: string;
    location?: string;
    job_type?: string;
    similarity_score: number;
    salary_min?: number;
    salary_max?: number;
    match_details?: {
        vector_similarity: number;
        keyword_matches?: string[];
    };
}

export interface ResumeMatchResult {
    resume_upload_id: string;
    user_id: string;
    matches: JobMatch[];
    total_matches: number;
    generated_at: string;
}

/**
 * Find matching jobs for a resume using vector similarity
 * Uses the database function match_jobs_for_resume for efficient querying
 */
export async function findMatchingJobsForResume(
    resumeUploadId: string,
    options: {
        match_threshold?: number;
        max_matches?: number;
        min_salary?: number;
        max_salary?: number;
        location?: string;
        job_type?: string;
    } = {}
): Promise<ResumeMatchResult> {
    const {
        match_threshold = 0.7,
        max_matches = 20,
        min_salary,
        max_salary,
        location,
        job_type
    } = options;

    logger.info('Finding matching jobs for resume', {
        resume_upload_id: resumeUploadId,
        match_threshold,
        max_matches
    });

    try {
        // Get resume embedding
        const { data: resumeData, error: resumeError } = await supabase
            .from('resume_uploads')
            .select('id, user_id, embedding, embedding_status')
            .eq('id', resumeUploadId)
            .single();

        if (resumeError || !resumeData) {
            throw new Error(`Resume not found: ${resumeUploadId}`);
        }

        if (resumeData.embedding_status !== 'completed' || !resumeData.embedding) {
            throw new Error(`Resume embedding not available: ${resumeUploadId}`);
        }

        // Use database function for efficient vector search
        const { data: matches, error: matchError } = await supabase.rpc(
            'match_jobs_for_resume',
            {
                resume_embedding: resumeData.embedding,
                match_threshold,
                match_count: max_matches
            }
        );

        if (matchError) {
            throw matchError;
        }

        // Filter results if additional criteria specified
        let filteredMatches = matches || [];

        if (min_salary !== undefined) {
            filteredMatches = filteredMatches.filter(m => 
                m.salary_max === null || m.salary_max === undefined || m.salary_max >= min_salary
            );
        }

        if (max_salary !== undefined) {
            filteredMatches = filteredMatches.filter(m => 
                m.salary_min === null || m.salary_min === undefined || m.salary_min <= max_salary
            );
        }

        if (location) {
            filteredMatches = filteredMatches.filter(m => 
                m.location?.toLowerCase().includes(location.toLowerCase())
            );
        }

        if (job_type) {
            filteredMatches = filteredMatches.filter(m => 
                m.job_type?.toLowerCase() === job_type.toLowerCase()
            );
        }

        // Transform to JobMatch format
        const jobMatches: JobMatch[] = filteredMatches.map(match => ({
            job_id: match.job_id,
            title: match.title,
            company: match.company,
            location: match.location,
            job_type: match.job_type,
            similarity_score: Math.round(match.similarity_score * 100),
            salary_min: match.salary_min,
            salary_max: match.salary_max,
            match_details: {
                vector_similarity: match.similarity_score
            }
        }));

        const result: ResumeMatchResult = {
            resume_upload_id: resumeUploadId,
            user_id: resumeData.user_id,
            matches: jobMatches,
            total_matches: jobMatches.length,
            generated_at: new Date().toISOString()
        };

        logger.info('Found matching jobs for resume', {
            resume_upload_id: resumeUploadId,
            total_matches: jobMatches.length
        });

        return result;

    } catch (error) {
        logger.error('Failed to find matching jobs for resume', error, {
            resume_upload_id: resumeUploadId
        });
        throw error;
    }
}

/**
 * Find matching jobs using direct vector comparison (fallback if DB function not available)
 * More flexible but less efficient than using the database function
 */
export async function findMatchingJobsDirect(
    resumeEmbedding: number[],
    options: {
        match_threshold?: number;
        max_matches?: number;
    } = {}
): Promise<JobMatch[]> {
    const { match_threshold = 0.7, max_matches = 20 } = options;

    try {
        // Fetch all jobs with embeddings
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('id, title, company, location, job_type, salary_min, salary_max, embedding')
            .eq('embedding_status', 'completed')
            .not('embedding', 'is', null)
            .eq('status', 'active');

        if (error) {
            throw error;
        }

        if (!jobs || jobs.length === 0) {
            return [];
        }

        // Calculate similarity for each job
        const scoredJobs = jobs
            .map(job => {
                const similarity = calculateSimilarity(resumeEmbedding, job.embedding!);
                return {
                    job_id: job.id,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    job_type: job.job_type,
                    salary_min: job.salary_min,
                    salary_max: job.salary_max,
                    similarity_score: similarity
                };
            })
            .filter(job => job.similarity_score >= match_threshold)
            .sort((a, b) => b.similarity_score - a.similarity_score)
            .slice(0, max_matches);

        return scoredJobs.map(job => ({
            ...job,
            similarity_score: Math.round(job.similarity_score * 100),
            match_details: {
                vector_similarity: job.similarity_score
            }
        }));

    } catch (error) {
        logger.error('Failed to find matching jobs directly', error);
        throw error;
    }
}

/**
 * Batch process resumes to find matches
 * Efficient for processing multiple users at once
 */
export async function batchFindMatchingJobs(
    resumeUploadIds: string[],
    options: {
        match_threshold?: number;
        max_matches_per_resume?: number;
    } = {}
): Promise<ResumeMatchResult[]> {
    const { match_threshold = 0.7, max_matches_per_resume = 10 } = options;

    logger.info('Batch finding matching jobs', {
        resume_count: resumeUploadIds.length,
        match_threshold
    });

    const results: ResumeMatchResult[] = [];

    for (const resumeUploadId of resumeUploadIds) {
        try {
            const result = await findMatchingJobsForResume(resumeUploadId, {
                match_threshold,
                max_matches: max_matches_per_resume
            });
            results.push(result);
        } catch (error) {
            logger.error('Failed to find matches for resume in batch', error, {
                resume_upload_id: resumeUploadId
            });
            // Continue processing other resumes
        }
    }

    logger.info('Batch matching completed', {
        processed: results.length,
        total: resumeUploadIds.length
    });

    return results;
}

/**
 * Store job matches in the job_matches table
 * For persisting match results for later review
 */
export async function storeJobMatches(
    userId: string,
    resumeUploadId: string,
    matches: JobMatch[]
): Promise<void> {
    try {
        // Prepare match records
        const matchRecords = matches.map(match => ({
            user_id: userId,
            job_id: match.job_id,
            match_score: match.similarity_score,
            matching_skills: [], // Could extract from analysis
            missing_skills: [],
            ai_analysis: JSON.stringify({
                match_source: 'vector_similarity',
                vector_score: match.match_details?.vector_similarity,
                generated_at: new Date().toISOString()
            }),
            created_at: new Date().toISOString()
        }));

        // Insert matches (upsert to avoid duplicates)
        const { error } = await supabase
            .from('job_matches')
            .upsert(matchRecords, {
                onConflict: 'user_id,job_id',
                ignoreDuplicates: false
            });

        if (error) {
            throw error;
        }

        logger.info('Stored job matches', {
            user_id: userId,
            resume_upload_id: resumeUploadId,
            matches_stored: matchRecords.length
        });

    } catch (error) {
        logger.error('Failed to store job matches', error, {
            user_id: userId,
            resume_upload_id: resumeUploadId
        });
        throw error;
    }
}
