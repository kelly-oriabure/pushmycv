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

        const { user_id, job_id, template = 'modern' } = await req.json();

        if (!user_id) {
            throw new Error('user_id is required');
        }

        // Fetch user profile data
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('user_id', user_id)
            .single();

        if (profileError) throw profileError;

        // Fetch work experiences
        const { data: experiences, error: expError } = await supabaseClient
            .from('work_experiences')
            .select('*')
            .eq('user_id', user_id)
            .order('start_date', { ascending: false });

        if (expError) throw expError;

        // Fetch education
        const { data: education, error: eduError } = await supabaseClient
            .from('education')
            .select('*')
            .eq('user_id', user_id)
            .order('start_date', { ascending: false });

        if (eduError) throw eduError;

        // Fetch skills
        const { data: skills, error: skillsError } = await supabaseClient
            .from('skills')
            .select('*')
            .eq('user_id', user_id)
            .order('proficiency', { ascending: false });

        if (skillsError) throw skillsError;

        // Fetch certifications
        const { data: certifications, error: certsError } = await supabaseClient
            .from('certifications')
            .select('*')
            .eq('user_id', user_id)
            .order('issue_date', { ascending: false });

        if (certsError) throw certsError;

        // Fetch projects
        const { data: projects, error: projectsError } = await supabaseClient
            .from('projects')
            .select('*')
            .eq('user_id', user_id)
            .order('start_date', { ascending: false });

        if (projectsError) throw projectsError;

        // Fetch job details if job_id is provided
        let jobDetails = null;
        if (job_id) {
            const { data: job, error: jobError } = await supabaseClient
                .from('jobs')
                .select('*')
                .eq('id', job_id)
                .single();

            if (!jobError) {
                jobDetails = job;
            }
        }

        // TODO: Integrate with AI service (OpenAI, Anthropic, etc.) to tailor resume
        // For now, we'll create a structured resume object
        const resumeData = {
            profile,
            experiences,
            education,
            skills,
            certifications,
            projects,
            jobDetails,
            template,
            generatedAt: new Date().toISOString(),
        };

        // TODO: Generate PDF/DOCX using a document generation service
        // For now, we'll store the structured data

        // Create resume record
        const { data: resume, error: resumeError } = await supabaseClient
            .from('resumes')
            .insert({
                user_id,
                title: jobDetails ? `Resume for ${jobDetails.title}` : 'General Resume',
                template,
                status: 'published',
                // file_url will be added after PDF generation
            })
            .select()
            .single();

        if (resumeError) throw resumeError;

        return new Response(
            JSON.stringify({
                success: true,
                resume_id: resume.id,
                message: 'Resume generated successfully',
                data: resumeData,
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
