-- Add image_url column to resume_uploads table
ALTER TABLE public.resume_uploads ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.resume_uploads.image_url IS 'URL of the resume image for preview';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_resume_uploads_image_url ON public.resume_uploads(image_url);
