import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { Database } from '../types/database.js';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

type ResumeInsert = Database['public']['Tables']['resumes']['Insert'];
type ResumeUpdate = Database['public']['Tables']['resumes']['Update'];

// Initialize Jobeazy Supabase client (read-only for resume data)
const jobeazySupabase = createClient(
    process.env.JOBEAZY_SUPABASE_URL!,
    process.env.JOBEAZY_SUPABASE_KEY!
);

interface AnalyzeResumeRequest {
    resumeUploadId: string;
    userId: string;
    jobTitle?: string;
    jobDescription?: string;
    resumeUrl?: string;
    pdfUrl?: string;
    rawText?: string;
}

export async function resumeRoutes(fastify: FastifyInstance): Promise<void> {
    // Get all resumes for a user
    fastify.get<{ Querystring: { user_id: string } }>(
        '/resumes',
        {
            schema: {
                description: 'Get all resumes for a user',
                tags: ['resumes'],
                querystring: {
                    type: 'object',
                    required: ['user_id'],
                    properties: {
                        user_id: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Querystring: { user_id: string } }>, reply: FastifyReply) => {
            try {
                const { user_id } = request.query;

                const { data, error } = await supabase
                    .from('resumes')
                    .select('*')
                    .eq('user_id', user_id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                return reply.send({ success: true, data });
            } catch (error) {
                logger.error('Failed to fetch resumes', error);
                return reply.status(500).send({ success: false, message: 'Failed to fetch resumes' });
            }
        }
    );

    // Get resume by ID
    fastify.get<{ Params: { id: string } }>(
        '/resumes/:id',
        {
            schema: {
                description: 'Get a resume by ID',
                tags: ['resumes'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const { id } = request.params;

                const { data, error } = await supabase
                    .from('resumes')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                return reply.send({ success: true, data });
            } catch (error) {
                logger.error('Failed to fetch resume', error);
                return reply.status(404).send({ success: false, message: 'Resume not found' });
            }
        }
    );

    // Create resume
    fastify.post<{ Body: ResumeInsert }>(
        '/resumes',
        {
            schema: {
                description: 'Create a new resume',
                tags: ['resumes'],
                body: {
                    type: 'object',
                    required: ['user_id', 'title'],
                    properties: {
                        user_id: { type: 'string' },
                        title: { type: 'string' },
                        template: { type: 'string', default: 'modern' },
                        is_default: { type: 'boolean' },
                        file_url: { type: 'string' },
                        file_format: { type: 'string', default: 'pdf' },
                        status: { type: 'string', enum: ['draft', 'published', 'archived'] }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Body: ResumeInsert }>, reply: FastifyReply) => {
            try {
                const { data, error } = await supabase
                    .from('resumes')
                    .insert(request.body as any)
                    .select()
                    .single();

                if (error) throw error;

                logger.info('Resume created', { resume_id: (data as any).id });
                return reply.status(201).send({ success: true, data });
            } catch (error) {
                logger.error('Failed to create resume', error);
                return reply.status(500).send({ success: false, message: 'Failed to create resume' });
            }
        }
    );

    // Update resume
    fastify.put<{ Params: { id: string }; Body: ResumeUpdate }>(
        '/resumes/:id',
        {
            schema: {
                description: 'Update a resume',
                tags: ['resumes'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Params: { id: string }; Body: ResumeUpdate }>, reply: FastifyReply) => {
            try {
                const { id } = request.params;

                const { data, error } = await supabase
                    .from('resumes')
                    .update(request.body as any)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;

                logger.info('Resume updated', { resume_id: id });
                return reply.send({ success: true, data });
            } catch (error) {
                logger.error('Failed to update resume', error);
                return reply.status(500).send({ success: false, message: 'Failed to update resume' });
            }
        }
    );

    // Delete resume
    fastify.delete<{ Params: { id: string } }>(
        '/resumes/:id',
        {
            schema: {
                description: 'Delete a resume',
                tags: ['resumes'],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                }
            }
        },
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const { id } = request.params;

                const { error } = await supabase
                    .from('resumes')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                logger.info('Resume deleted', { resume_id: id });
                return reply.send({ success: true, message: 'Resume deleted successfully' });
            } catch (error) {
                logger.error('Failed to delete resume', error);
                return reply.status(500).send({ success: false, message: 'Failed to delete resume' });
            }
        }
    );

    // POST /v1/resumes/analyze - Start resume analysis (replaces Edge Function)
    fastify.post<{ Body: AnalyzeResumeRequest }>(
        '/v1/resumes/analyze',
        {
            schema: {
                description: 'Start resume analysis workflow via Agentic',
                tags: ['resumes'],
                body: {
                    type: 'object',
                    required: ['resumeUploadId', 'userId'],
                    properties: {
                        resumeUploadId: { type: 'string' },
                        userId: { type: 'string' },
                        jobTitle: { type: 'string' },
                        jobDescription: { type: 'string' },
                        resumeUrl: { type: 'string' },
                        pdfUrl: { type: 'string' },
                        rawText: { type: 'string' }
                    }
                }
            }
        },
        async (request, reply) => {
            try {
                const { resumeUploadId, userId, jobTitle, jobDescription, resumeUrl, pdfUrl, rawText } = request.body;
                
                logger.info('[Analyze] Starting analysis', { resumeUploadId, userId, hasText: !!rawText });
                
                // Use rawText from request body if provided, otherwise fetch from DB
                let extractedText = rawText;
                let fileName = 'unknown';
                
                if (!extractedText) {
                    const { data: uploadData, error: uploadError } = await jobeazySupabase
                        .from('resume_uploads')
                        .select('extracted_text, file_name')
                        .eq('id', resumeUploadId)
                        .eq('user_id', userId)
                        .single();
                    
                    if (uploadError || !uploadData) {
                        logger.error('[Analyze] Upload not found', { error: uploadError });
                        return reply.status(404).send({
                            error: 'Resume upload not found',
                            details: uploadError?.message
                        });
                    }
                    
                    extractedText = uploadData.extracted_text;
                    fileName = uploadData.file_name;
                    logger.info('[Analyze] Fetched text from DB', { fileName, hasText: !!extractedText });
                } else {
                    logger.info('[Analyze] Using rawText from request payload');
                }
                
                if (!extractedText) {
                    logger.error('[Analyze] No text available for analysis');
                    return reply.status(400).send({
                        error: 'No resume text available for analysis'
                    });
                }
                
                const workflowId = uuidv4();
                
                // Create queue job for agentic
                const jobPayload = {
                    workflow_id: workflowId,
                    resume_upload_id: resumeUploadId,
                    user_id: userId,
                    raw_text: extractedText,
                    file_name: fileName,
                    job_title: jobTitle,
                    job_description: jobDescription,
                    resume_url: resumeUrl,
                    pdf_url: pdfUrl
                };
                
                logger.info('[Analyze] Creating queue job', { workflowId });
                
                const { error: jobError, data: jobData } = await (supabase as any)
                    .from('queue_jobs')
                    .insert({
                        type: 'resume_analysis',
                        payload: jobPayload,
                        status: 'pending',
                        attempts: 0
                    })
                    .select()
                    .single();
                
                if (jobError) {
                    const errorDetails = typeof jobError === 'object' ? JSON.stringify(jobError, null, 2) : String(jobError);
                    logger.error('[Analyze] Failed to create job: ' + errorDetails);
                    return reply.status(500).send({
                        error: 'Failed to create queue job',
                        details: errorDetails
                    });
                }
                
                logger.info('[Analyze] Job created successfully', { workflowId });
                
                return reply.send({
                    success: true,
                    workflowId,
                    message: 'Resume analysis queued',
                    status: 'pending'
                });
            } catch (error) {
                logger.error('[Analyze] Failed to start analysis', error);
                return reply.status(500).send({
                    error: 'Internal server error'
                });
            }
        }
    );

    // GET /v1/workflows/:id - Get workflow status
    fastify.get<{ Params: { id: string } }>(
        '/v1/workflows/:id',
        {
            schema: {
                description: 'Get workflow status',
                tags: ['workflows']
            }
        },
        async (request, reply) => {
            try {
                const { id } = request.params;
                
                const { data: jobs, error } = await (supabase as any)
                    .from('queue_jobs')
                    .select('*')
                    .eq('type', 'resume_analysis')
                    .filter('payload->workflow_id', 'eq', id)
                    .limit(1);
                
                if (error || !jobs || jobs.length === 0) {
                    return reply.status(404).send({ error: 'Workflow not found' });
                }
                
                const job = jobs[0];
                
                return reply.send({
                    workflow_id: id,
                    status: job.status,
                    current_step: job.status === 'completed' ? 7 : (job.status === 'processing' ? 3 : 0),
                    total_steps: 7,
                    error: job.error_message
                });
            } catch (error) {
                logger.error('Failed to get workflow', error);
                return reply.status(500).send({ error: 'Internal server error' });
            }
        }
    );
}
