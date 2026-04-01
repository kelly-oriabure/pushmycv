-- Create resume_analyses table for resume scoring feature
CREATE TABLE IF NOT EXISTS public.resume_analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    upload_id UUID,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    score_breakdown JSONB,
    suggestions JSONB,
    ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
    tone_score INTEGER CHECK (tone_score >= 0 AND tone_score <= 100),
    content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
    structure_score INTEGER CHECK (structure_score >= 0 AND structure_score <= 100),
    skills_score INTEGER CHECK (skills_score >= 0 AND skills_score <= 100),
    email_score INTEGER CHECK (email_score >= 0 AND email_score <= 100),
    length_score INTEGER CHECK (length_score >= 0 AND length_score <= 100),
    brevity_score INTEGER CHECK (brevity_score >= 0 AND brevity_score <= 100),
    ats_tips JSONB,
    tone_tips JSONB,
    content_tips JSONB,
    structure_tips JSONB,
    skills_tips JSONB,
    email_tips JSONB,
    length_tips JSONB,
    brevity_tips JSONB,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    image_url TEXT,
    pdf_url TEXT,
    extracted_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for resume_analyses
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resume_analyses' 
        AND policyname = 'Users can view own resume analyses'
    ) THEN
        CREATE POLICY "Users can view own resume analyses" ON public.resume_analyses
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resume_analyses' 
        AND policyname = 'Users can insert own resume analyses'
    ) THEN
        CREATE POLICY "Users can insert own resume analyses" ON public.resume_analyses
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resume_analyses' 
        AND policyname = 'Users can update own resume analyses'
    ) THEN
        CREATE POLICY "Users can update own resume analyses" ON public.resume_analyses
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resume_analyses' 
        AND policyname = 'Users can delete own resume analyses'
    ) THEN
        CREATE POLICY "Users can delete own resume analyses" ON public.resume_analyses
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Grant permissions
GRANT ALL PRIVILEGES ON public.resume_analyses TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_id ON public.resume_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_status ON public.resume_analyses(status);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_created_at ON public.resume_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_job_title ON public.resume_analyses(job_title);

-- Add updated_at trigger
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_updated_at_resume_analyses' 
        AND tgrelid = 'public.resume_analyses'::regclass
    ) THEN
        CREATE TRIGGER handle_updated_at_resume_analyses
            BEFORE UPDATE ON public.resume_analyses
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Add documentation comments
COMMENT ON TABLE public.resume_analyses IS 'Resume analysis results with detailed scoring and suggestions';
COMMENT ON COLUMN public.resume_analyses.upload_id IS 'Foreign key reference to resume_uploads table';
COMMENT ON COLUMN public.resume_analyses.ats_score IS 'ATS compatibility score (0-100)';
COMMENT ON COLUMN public.resume_analyses.tone_score IS 'Tone and style score (0-100)';
COMMENT ON COLUMN public.resume_analyses.content_score IS 'Content quality score (0-100)';
COMMENT ON COLUMN public.resume_analyses.structure_score IS 'Structure and formatting score (0-100)';
COMMENT ON COLUMN public.resume_analyses.skills_score IS 'Skills relevance score (0-100)';
COMMENT ON COLUMN public.resume_analyses.email_score IS 'Email format and professionalism score (0-100)';
COMMENT ON COLUMN public.resume_analyses.length_score IS 'Resume length appropriateness score (0-100)';
COMMENT ON COLUMN public.resume_analyses.brevity_score IS 'Brevity and conciseness score (0-100)';