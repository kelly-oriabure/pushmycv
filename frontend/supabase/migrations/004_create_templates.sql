-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
    uuid UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    category_id UUID REFERENCES public.template_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for templates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'templates' 
        AND policyname = 'Anyone can view templates'
    ) THEN
        CREATE POLICY "Anyone can view templates" ON public.templates
            FOR SELECT USING (true);
    END IF;
END $$;

-- Grant permissions
GRANT SELECT ON public.templates TO anon, authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_category_id ON public.templates(category_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_premium ON public.templates(is_premium);

-- Add updated_at trigger
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_updated_at_templates' 
        AND tgrelid = 'public.templates'::regclass
    ) THEN
        CREATE TRIGGER handle_updated_at_templates
            BEFORE UPDATE ON public.templates
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;