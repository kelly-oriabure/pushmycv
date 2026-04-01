import { JobHandler, JobType } from '../types/queue.js';
import { generateResume } from './generateResume.js';
import { generateCoverLetter } from './generateCoverLetter.js';
import { applyJob } from './applyJob.js';
import { fetchJobs } from './fetchJobs.js';
import { generateJobEmbeddings } from './generateEmbeddings.js';
import { generateResumeEmbeddings } from './generateResumeEmbeddings.js';

export const jobHandlers: Record<JobType, JobHandler> = {
    generate_resume: generateResume,
    generate_cover_letter: generateCoverLetter,
    apply_job: applyJob,
    fetch_jobs: fetchJobs,
    generate_embeddings: generateJobEmbeddings,
    generate_resume_embeddings: generateResumeEmbeddings
};

export { generateResume, generateCoverLetter, applyJob, fetchJobs, generateJobEmbeddings, generateResumeEmbeddings };
