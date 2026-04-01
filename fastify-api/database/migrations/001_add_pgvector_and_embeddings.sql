-- Migration: Add pgvector extension and embedding support for job matching
-- Created: 2026-02-05

-- ============================================================================
-- Enable pgvector extension
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Add embedding columns to jobs table
-- ============================================================================
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS embedding_status TEXT DEFAULT 'pending' 
CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'text-embedding-3-small';

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- Create index for efficient similarity search
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_jobs_embedding 
ON jobs 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================================================
-- Add comments for documentation
-- ============================================================================
COMMENT ON COLUMN jobs.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic job matching';
COMMENT ON COLUMN jobs.embedding_status IS 'Tracks embedding generation state: pending/processing/completed/failed';
COMMENT ON COLUMN jobs.embedding_model IS 'Version of embedding model used for reproducibility';
COMMENT ON COLUMN jobs.embedded_at IS 'Timestamp when embedding was generated';

-- ============================================================================
-- Create function to find similar jobs using cosine similarity
-- ============================================================================
CREATE OR REPLACE FUNCTION find_similar_jobs(
    query_embedding vector(1536),
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    company_name TEXT,
    location TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        j.id,
        j.title,
        j.company_name,
        j.location,
        1 - (j.embedding <=> query_embedding) AS similarity
    FROM jobs j
    WHERE j.embedding_status = 'completed'
        AND j.embedding IS NOT NULL
        AND 1 - (j.embedding <=> query_embedding) > match_threshold
    ORDER BY j.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Create index for filtering by embedding status
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_jobs_embedding_status 
ON jobs(embedding_status) 
WHERE embedding_status IN ('pending', 'processing');
