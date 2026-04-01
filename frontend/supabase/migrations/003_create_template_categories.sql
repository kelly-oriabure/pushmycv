-- Create template_categories table
CREATE TABLE IF NOT EXISTS public.template_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for template_categories
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'template_categories' 
        AND policyname = 'Anyone can view template categories'
    ) THEN
        CREATE POLICY "Anyone can view template categories" ON public.template_categories
            FOR SELECT USING (true);
    END IF;
END $$;

-- Grant permissions
GRANT SELECT ON public.template_categories TO anon, authenticated;

-- Create index
CREATE INDEX IF NOT EXISTS idx_template_categories_name ON public.template_categories(name);

-- Add updated_at trigger
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_updated_at_template_categories' 
        AND tgrelid = 'public.template_categories'::regclass
    ) THEN
        CREATE TRIGGER handle_updated_at_template_categories
            BEFORE UPDATE ON public.template_categories
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;