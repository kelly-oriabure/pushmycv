-- Migration: Create Secure PII Tables
-- This migration creates encrypted tables for storing PII data securely
-- Replaces plain text storage with encrypted storage and salted hashes

-- Create secure personal details table
CREATE TABLE IF NOT EXISTS personal_details_secure (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_title TEXT,
    
    -- Encrypted PII fields
    email_encrypted TEXT,
    phone_encrypted TEXT,
    first_name_encrypted TEXT,
    last_name_encrypted TEXT,
    address_encrypted TEXT,
    city_state_encrypted TEXT,
    country_encrypted TEXT,
    
    -- Secure hashes for duplicate detection (with salts)
    email_hash TEXT,
    phone_hash TEXT,
    name_hash TEXT,
    address_hash TEXT,
    composite_hash TEXT,
    
    -- Non-PII fields
    photo_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(resume_id)
);

-- Create secure resume uploads table
CREATE TABLE IF NOT EXISTS resume_uploads_secure (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- File information
    file_name TEXT,
    file_path TEXT,
    file_type TEXT,
    file_size BIGINT,
    resume_url TEXT,
    pdf_url TEXT,
    image_url TEXT,
    
    -- Secure hashes (replacing old unsalted hashes)
    content_hash TEXT,
    email_hash TEXT,
    phone_hash TEXT,
    composite_hash TEXT,
    
    -- Encrypted extracted PII
    extracted_email_encrypted TEXT,
    extracted_phone_encrypted TEXT,
    
    -- Non-PII extracted data
    extracted_text TEXT,
    
    -- Status and timestamps
    status TEXT DEFAULT 'uploaded',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_personal_details_secure_resume_id ON personal_details_secure(resume_id);
CREATE INDEX IF NOT EXISTS idx_personal_details_secure_email_hash ON personal_details_secure(email_hash);
CREATE INDEX IF NOT EXISTS idx_personal_details_secure_phone_hash ON personal_details_secure(phone_hash);
CREATE INDEX IF NOT EXISTS idx_personal_details_secure_composite_hash ON personal_details_secure(composite_hash);

CREATE INDEX IF NOT EXISTS idx_resume_uploads_secure_user_id ON resume_uploads_secure(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_secure_content_hash ON resume_uploads_secure(content_hash);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_secure_email_hash ON resume_uploads_secure(email_hash);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_secure_phone_hash ON resume_uploads_secure(phone_hash);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_secure_composite_hash ON resume_uploads_secure(composite_hash);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_secure_status ON resume_uploads_secure(status);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_personal_details_secure_updated_at 
    BEFORE UPDATE ON personal_details_secure 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resume_uploads_secure_updated_at 
    BEFORE UPDATE ON resume_uploads_secure 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE personal_details_secure ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_uploads_secure ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own personal details
CREATE POLICY "Users can access their own personal details" ON personal_details_secure
    FOR ALL USING (
        resume_id IN (
            SELECT id FROM resumes WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can only access their own resume uploads
CREATE POLICY "Users can access their own resume uploads" ON resume_uploads_secure
    FOR ALL USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON personal_details_secure TO authenticated;
GRANT ALL ON resume_uploads_secure TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE personal_details_secure IS 'Encrypted personal details with secure hashing for GDPR/CCPA compliance';
COMMENT ON TABLE resume_uploads_secure IS 'Secure resume uploads with encrypted PII and salted hashes';

COMMENT ON COLUMN personal_details_secure.email_encrypted IS 'AES-256-GCM encrypted email address';
COMMENT ON COLUMN personal_details_secure.phone_encrypted IS 'AES-256-GCM encrypted phone number';
COMMENT ON COLUMN personal_details_secure.first_name_encrypted IS 'AES-256-GCM encrypted first name';
COMMENT ON COLUMN personal_details_secure.last_name_encrypted IS 'AES-256-GCM encrypted last name';
COMMENT ON COLUMN personal_details_secure.address_encrypted IS 'AES-256-GCM encrypted address';
COMMENT ON COLUMN personal_details_secure.email_hash IS 'Salted SHA-256 hash of email for duplicate detection';
COMMENT ON COLUMN personal_details_secure.phone_hash IS 'Salted SHA-256 hash of phone for duplicate detection';
COMMENT ON COLUMN personal_details_secure.composite_hash IS 'Salted SHA-256 hash for overall duplicate detection';

COMMENT ON COLUMN resume_uploads_secure.content_hash IS 'Salted SHA-256 hash of resume content';
COMMENT ON COLUMN resume_uploads_secure.email_hash IS 'Salted SHA-256 hash of extracted email';
COMMENT ON COLUMN resume_uploads_secure.phone_hash IS 'Salted SHA-256 hash of extracted phone';
COMMENT ON COLUMN resume_uploads_secure.extracted_email_encrypted IS 'AES-256-GCM encrypted extracted email';
COMMENT ON COLUMN resume_uploads_secure.extracted_phone_encrypted IS 'AES-256-GCM encrypted extracted phone';
