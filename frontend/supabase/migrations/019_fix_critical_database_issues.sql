-- ============================================
-- Phase 1: Critical Database Fixes
-- Migration 019: Fix upload_id constraint, add unique constraint, add indexes
-- ============================================

-- PART 1: Make upload_id NOT NULL in resume_analyses
-- First, check if there are any null upload_ids and handle them

DO $$
DECLARE
    null_count INTEGER;
BEGIN
    -- Count null upload_ids
    SELECT COUNT(*) INTO null_count
    FROM public.resume_analyses
    WHERE upload_id IS NULL;

    IF null_count > 0 THEN
        RAISE NOTICE 'Found % records with null upload_id. These will be deleted.', null_count;
        
        -- Delete orphaned records (no upload_id reference)
        DELETE FROM public.resume_analyses WHERE upload_id IS NULL;
        
        RAISE NOTICE 'Deleted % orphaned records', null_count;
    ELSE
        RAISE NOTICE 'No null upload_ids found. Proceeding with constraint.';
    END IF;
END $$;

-- Add NOT NULL constraint to upload_id
ALTER TABLE public.resume_analyses 
ALTER COLUMN upload_id SET NOT NULL;

-- Add foreign key constraint (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_resume_analyses_upload_id'
    ) THEN
        ALTER TABLE public.resume_analyses
        ADD CONSTRAINT fk_resume_analyses_upload_id
        FOREIGN KEY (upload_id) 
        REFERENCES public.resume_uploads(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint on upload_id';
    END IF;
END $$;

-- PART 2: Add index on resume_analyses.upload_id
CREATE INDEX IF NOT EXISTS idx_resume_analyses_upload_id 
ON public.resume_analyses(upload_id);

-- PART 3: Add unique constraint on composite_hash per user
-- This prevents duplicate resumes from the same user

DO $$
BEGIN
    -- First, identify and handle existing duplicates
    -- Keep the most recent upload for each duplicate set
    WITH duplicates AS (
        SELECT 
            user_id,
            composite_hash,
            id,
            ROW_NUMBER() OVER (
                PARTITION BY user_id, composite_hash 
                ORDER BY created_at DESC
            ) as rn
        FROM public.resume_uploads
        WHERE composite_hash IS NOT NULL
    )
    DELETE FROM public.resume_uploads
    WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
    );

    -- Add unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_resume_hash'
    ) THEN
        ALTER TABLE public.resume_uploads
        ADD CONSTRAINT unique_user_resume_hash 
        UNIQUE (user_id, composite_hash);
        
        RAISE NOTICE 'Added unique constraint on (user_id, composite_hash)';
    END IF;
END $$;

-- PART 4: Add composite index for duplicate detection queries
-- This optimizes the common query pattern: WHERE user_id = ? AND composite_hash = ?
CREATE INDEX IF NOT EXISTS idx_resume_uploads_user_composite 
ON public.resume_uploads(user_id, composite_hash);

-- PART 5: Add n8n_response column for storing full webhook response
ALTER TABLE public.resume_analyses 
ADD COLUMN IF NOT EXISTS n8n_response JSONB;

COMMENT ON COLUMN public.resume_analyses.n8n_response IS 'Full n8n webhook response for debugging and audit trail';

-- PART 6: Add extracted_text column to resume_uploads (if not exists)
ALTER TABLE public.resume_uploads
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

COMMENT ON COLUMN public.resume_uploads.extracted_text IS 'Full text extracted from PDF for analysis';

-- Add extracted_email and extracted_phone columns (if not already present)
-- These are already in the schema but adding for completeness
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resume_uploads' 
        AND column_name = 'extracted_email'
    ) THEN
        ALTER TABLE public.resume_uploads ADD COLUMN extracted_email TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resume_uploads' 
        AND column_name = 'extracted_phone'
    ) THEN
        ALTER TABLE public.resume_uploads ADD COLUMN extracted_phone TEXT;
    END IF;
END $$;

-- PART 7: Add function to automatically cleanup stuck analyses
CREATE OR REPLACE FUNCTION cleanup_stuck_analyses()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Mark analyses stuck in "processing" for more than 30 minutes as failed
    UPDATE public.resume_analyses
    SET 
        status = 'failed',
        error_message = 'Analysis timed out after 30 minutes - please retry',
        updated_at = NOW()
    WHERE status = 'processing'
        AND created_at < NOW() - INTERVAL '30 minutes';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_stuck_analyses() IS 'Marks analyses stuck in processing status for >30 minutes as failed';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_stuck_analyses() TO authenticated;

-- PART 8: Verification queries
DO $$
DECLARE
    constraint_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Verify unique constraint
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint
    WHERE conname = 'unique_user_resume_hash';
    
    IF constraint_count > 0 THEN
        RAISE NOTICE '✅ Unique constraint verified';
    ELSE
        RAISE WARNING '⚠️  Unique constraint not found';
    END IF;

    -- Verify indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'resume_analyses' 
        AND indexname = 'idx_resume_analyses_upload_id';
    
    IF index_count > 0 THEN
        RAISE NOTICE '✅ Index on resume_analyses.upload_id verified';
    ELSE
        RAISE WARNING '⚠️  Index on resume_analyses.upload_id not found';
    END IF;

    RAISE NOTICE '✅ Migration 019 completed successfully';
END $$;
