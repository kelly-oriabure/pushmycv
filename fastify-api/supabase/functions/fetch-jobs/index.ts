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
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );

        const { source = 'all', keywords = [], location = '' } = await req.json();

        // TODO: Integrate with job board APIs
        // Examples:
        // - LinkedIn Jobs API
        // - Indeed API
        // - GitHub Jobs
        // - Remote OK
        // - We Work Remotely

        // For now, we'll create sample job data
        const sampleJobs = [
            {
                title: 'Senior Full Stack Developer',
                company: 'Tech Corp',
                location: 'Remote',
                job_type: 'full-time',
                salary_min: 100000,
                salary_max: 150000,
                description: 'We are looking for an experienced Full Stack Developer...',
                requirements: ['5+ years experience', 'React', 'Node.js', 'TypeScript'],
                responsibilities: ['Build scalable applications', 'Mentor junior developers'],
                benefits: ['Health insurance', 'Remote work', '401k'],
                application_url: 'https://example.com/apply',
                source: 'linkedin',
                source_job_id: 'linkedin-12345',
                posted_date: new Date().toISOString(),
                status: 'active',
            },
            {
                title: 'Frontend Engineer',
                company: 'Startup Inc',
                location: 'San Francisco, CA',
                job_type: 'full-time',
                salary_min: 90000,
                salary_max: 130000,
                description: 'Join our fast-growing startup...',
                requirements: ['3+ years experience', 'React', 'CSS', 'JavaScript'],
                responsibilities: ['Build user interfaces', 'Collaborate with designers'],
                benefits: ['Equity', 'Flexible hours', 'Health insurance'],
                application_url: 'https://example.com/apply',
                source: 'indeed',
                source_job_id: 'indeed-67890',
                posted_date: new Date().toISOString(),
                status: 'active',
            },
        ];

        // Insert jobs into database (avoiding duplicates)
        const insertedJobs = [];
        for (const job of sampleJobs) {
            // Check if job already exists
            const { data: existing } = await supabaseClient
                .from('jobs')
                .select('id')
                .eq('source', job.source)
                .eq('source_job_id', job.source_job_id)
                .single();

            if (!existing) {
                const { data: inserted, error } = await supabaseClient
                    .from('jobs')
                    .insert(job)
                    .select()
                    .single();

                if (!error && inserted) {
                    insertedJobs.push(inserted);
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Fetched ${sampleJobs.length} jobs, inserted ${insertedJobs.length} new jobs`,
                jobs_fetched: sampleJobs.length,
                jobs_inserted: insertedJobs.length,
                source,
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
