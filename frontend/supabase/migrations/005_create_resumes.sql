-- Create resumes table (main entity)
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT DEFAULT 'Untitled Resume',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.templates(uuid) ON DELETE SET NULL,
    template_name TEXT,
    color TEXT,
    custom_sections JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Create user_owns_resume function for RLS
CREATE OR REPLACE FUNCTION public.user_owns_resume(resume_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.resumes 
        WHERE id = resume_uuid 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for resumes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resumes' 
        AND policyname = 'Users can view own resumes'
    ) THEN
        CREATE POLICY "Users can view own resumes" ON public.resumes
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resumes' 
        AND policyname = 'Users can insert own resumes'
    ) THEN
        CREATE POLICY "Users can insert own resumes" ON public.resumes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resumes' 
        AND policyname = 'Users can update own resumes'
    ) THEN
        CREATE POLICY "Users can update own resumes" ON public.resumes
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resumes' 
        AND policyname = 'Users can delete own resumes'
    ) THEN
        CREATE POLICY "Users can delete own resumes" ON public.resumes
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Grant permissions
GRANT ALL PRIVILEGES ON public.resumes TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_template_id ON public.resumes(template_id);

-- Add updated_at trigger
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_updated_at_resumes' 
        AND tgrelid = 'public.resumes'::regclass
    ) THEN
        CREATE TRIGGER handle_updated_at_resumes
            BEFORE UPDATE ON public.resumes
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;