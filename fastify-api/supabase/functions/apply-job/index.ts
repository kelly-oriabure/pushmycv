import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        );

        const { user_id, job_id, resume_id, cover_letter_id } = await req.json();

        if (!user_id || !job_id) {
            throw new Error('user_id and job_id are required');
        }

        // Fetch job details
        const { data: job, error: jobError } = await supabaseClient
            .from('jobs')
            .select('*')
            .eq('id', job_id)
            .single();

        if (jobError) throw jobError;

        // Fetch user profile
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('user_id', user_id)
            .single();

        if (profileError) throw profileError;

        // Fetch resume if provided
        let resume = null;
        if (resume_id) {
            const { data: resumeData, error: resumeError } = await supabaseClient
                .from('resumes')
                .select('*')
                .eq('id', resume_id)
                .eq('user_id', user_id)
                .single();

            if (!resumeError) {
                resume = resumeData;
            }
        }

        // Fetch cover letter if provided
        let coverLetter = null;
        if (cover_letter_id) {
            const { data: coverLetterData, error: coverLetterError } = await supabaseClient
                .from('cover_letters')
                .select('*')
                .eq('id', cover_letter_id)
                .eq('user_id', user_id)
                .single();

            if (!coverLetterError) {
                coverLetter = coverLetterData;
            }
        }

        // Check if already applied
        const { data: existingApplication } = await supabaseClient
            .from('applications')
            .select('id')
            .eq('user_id', user_id)
            .eq('job_id', job_id)
            .single();

        if (existingApplication) {
            throw new Error('You have already applied to this job');
        }

        // TODO: Integrate with ATS (Applicant Tracking System) API
        // This would involve:
        // 1. Parsing the application_url from the job
        // 2. Submitting application data to the ATS
        // 3. Handling different ATS formats (Greenhouse, Lever, Workday, etc.)
        // For now, we'll just create the application record

        // Create application record
        const { data: application, error: applicationError } = await supabaseClient
            .from('applications')
            .insert({
                user_id,
                job_id,
                resume_id,
                cover_letter_id,
                status: 'submitted',
                applied_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (applicationError) throw applicationError;

        // Create application event
        await supabaseClient
            .from('application_events')
            .insert({
                application_id: application.id,
                event_type: 'application_submitted',
                event_data: {
                    job_title: job.title,
                    company: job.company,
                    application_url: job.application_url,
                },
                notes: 'Application submitted successfully',
            });

        // TODO: Send confirmation email to user
        // TODO: Set up follow-up reminders

        return new Response(
            JSON.stringify({
                success: true,
                application_id: application.id,
                message: `Successfully applied to ${job.title} at ${job.company}`,
                application: {
                    id: application.id,
                    job_title: job.title,
                    company: job.company,
                    status: application.status,
                    applied_at: application.applied_at,
                },
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
