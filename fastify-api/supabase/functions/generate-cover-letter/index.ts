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

        const { user_id, job_id } = await req.json();

        if (!user_id || !job_id) {
            throw new Error('user_id and job_id are required');
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('user_id', user_id)
            .single();

        if (profileError) throw profileError;

        // Fetch job details
        const { data: job, error: jobError } = await supabaseClient
            .from('jobs')
            .select('*')
            .eq('id', job_id)
            .single();

        if (jobError) throw jobError;

        // Fetch user's most relevant work experience
        const { data: experiences, error: expError } = await supabaseClient
            .from('work_experiences')
            .select('*')
            .eq('user_id', user_id)
            .order('start_date', { ascending: false })
            .limit(3);

        if (expError) throw expError;

        // Fetch user's skills
        const { data: skills, error: skillsError } = await supabaseClient
            .from('skills')
            .select('*')
            .eq('user_id', user_id);

        if (skillsError) throw skillsError;

        // TODO: Integrate with AI service (OpenAI, Anthropic, etc.) to generate personalized cover letter
        // For now, we'll create a template-based cover letter
        const coverLetterContent = `Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With my background and experience, I am confident that I would be a valuable addition to your team.

${profile.bio || 'I am a passionate professional with extensive experience in my field.'}

Throughout my career at ${experiences[0]?.company_name || 'previous companies'}, I have developed strong skills in ${skills.slice(0, 3).map(s => s.name).join(', ')}. I am particularly excited about this opportunity because it aligns perfectly with my career goals and expertise.

I would welcome the opportunity to discuss how my skills and experience can contribute to ${job.company}'s success. Thank you for considering my application.

Best regards,
${profile.full_name}`;

        // Create cover letter record
        const { data: coverLetter, error: coverLetterError } = await supabaseClient
            .from('cover_letters')
            .insert({
                user_id,
                job_id,
                title: `Cover Letter for ${job.title} at ${job.company}`,
                content: coverLetterContent,
            })
            .select()
            .single();

        if (coverLetterError) throw coverLetterError;

        return new Response(
            JSON.stringify({
                success: true,
                cover_letter_id: coverLetter.id,
                message: 'Cover letter generated successfully',
                content: coverLetterContent,
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
