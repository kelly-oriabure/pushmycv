-- PushMyCV Database Schema
-- Queue Jobs Table for Job Queue System

CREATE TABLE IF NOT EXISTS queue_jobs (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- 'generate_resume', 'generate_cover_letter', 'apply_job', 'fetch_jobs'
    payload JSONB NOT NULL, -- user_id, job_id, other metadata
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'done', 'failed'
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    locked_at TIMESTAMP NULL,
    priority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_queue_jobs_status ON queue_jobs(status);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_priority ON queue_jobs(priority DESC);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_created_at ON queue_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_type ON queue_jobs(type);

-- Create composite index for worker queries
CREATE INDEX IF NOT EXISTS idx_queue_jobs_pending ON queue_jobs(status, priority DESC, created_at) 
WHERE status = 'pending';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_queue_jobs_updated_at 
    BEFORE UPDATE ON queue_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add Row Level Security (RLS) policies if needed
-- ALTER TABLE queue_jobs ENABLE ROW LEVEL SECURITY;

-- Example: Policy to allow service role to manage all jobs
-- CREATE POLICY "Service role can manage all jobs" ON queue_jobs
--     FOR ALL
--     TO service_role
--     USING (true)
--     WITH CHECK (true);
