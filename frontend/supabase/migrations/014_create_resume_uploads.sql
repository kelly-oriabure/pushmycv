-- Create resume_uploads table for duplicate detection and file management
CREATE TABLE IF NOT EXISTS public.resume_uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    resume_url TEXT NOT NULL,
    pdf_url TEXT,
    content_hash TEXT,
    email_hash TEXT,
    phone_hash TEXT,
    extracted_email TEXT,
    extracted_phone TEXT,
    composite_hash TEXT,
    upload_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.resume_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for resume_uploads
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resume_uploads' 
        AND policyname = 'Users can view own resume uploads'
    ) THEN
        CREATE POLICY "Users can view own resume uploads" ON public.resume_uploads
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resume_uploads' 
        AND policyname = 'Users can insert own resume uploads'
    ) THEN
        CREATE POLICY "Users can insert own resume uploads" ON public.resume_uploads
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resume_uploads' 
        AND policyname = 'Users can update own resume uploads'
    ) THEN
        CREATE POLICY "Users can update own resume uploads" ON public.resume_uploads
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'resume_uploads' 
        AND policyname = 'Users can delete own resume uploads'
    ) THEN
        CREATE POLICY "Users can delete own resume uploads" ON public.resume_uploads
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Grant permissions
GRANT ALL PRIVILEGES ON public.resume_uploads TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resume_uploads_user_id ON public.resume_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_content_hash ON public.resume_uploads(content_hash);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_email_hash ON public.resume_uploads(email_hash);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_phone_hash ON public.resume_uploads(phone_hash);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_composite_hash ON public.resume_uploads(composite_hash);

-- Add updated_at trigger
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_updated_at_resume_uploads' 
        AND tgrelid = 'public.resume_uploads'::regclass
    ) THEN
        CREATE TRIGGER handle_updated_at_resume_uploads
            BEFORE UPDATE ON public.resume_uploads
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Add documentation comments
COMMENT ON TABLE public.resume_uploads IS 'Stores resume upload information with duplicate detection capabilities';
COMMENT ON COLUMN public.resume_uploads.content_hash IS 'Hash of resume content for duplicate detection';
COMMENT ON COLUMN public.resume_uploads.email_hash IS 'Hash of extracted email for duplicate detection';
COMMENT ON COLUMN public.resume_uploads.phone_hash IS 'Hash of extracted phone for duplicate detection';
COMMENT ON COLUMN public.resume_uploads.composite_hash IS 'Composite hash for enhanced duplicate detection';