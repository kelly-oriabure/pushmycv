export type JobType =
    | 'generate_resume'
    | 'generate_cover_letter'
    | 'apply_job'
    | 'fetch_jobs'
    | 'generate_embeddings'
    | 'generate_resume_embeddings'
    | 'fetch_jobs_api';

export type JobStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface QueueJob {
    id: number;
    type: JobType;
    payload: Record<string, any>;
    status: JobStatus;
    attempts: number;
    max_attempts: number;
    locked_at: string | null;
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface JobPayload {
    user_id?: string;
    job_id?: string;
    source?: string;
    [key: string]: any;
}

export interface EnqueueJobParams {
    type: JobType;
    payload: JobPayload;
    priority?: number;
    max_attempts?: number;
}

export interface JobHandler {
    (payload: JobPayload): Promise<void>;
}

export interface Job {
    id: string;
    title: string;
    company?: string;
    location?: string;
    description?: string;
    requirements?: any[];
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    job_type?: string;
    work_mode?: string;
    experience_level?: string;
    application_url?: string;
    source?: string;
    source_job_id?: string;
    posted_date?: string;
    deadline?: string;
    status?: string;
    embedding?: number[];
    embedding_status?: 'pending' | 'processing' | 'completed' | 'failed';
    embedding_model?: string;
    embedded_at?: string;
    created_at?: string;
    updated_at?: string;
}
