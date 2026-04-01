-- Migration: Fix RLS Performance Issues
-- This migration optimizes Row Level Security policies to use (select auth.uid()) 
-- instead of auth.uid() directly, preventing re-evaluation for every row.

-- First, let's create an optimized version of the user_owns_resume function
CREATE OR REPLACE FUNCTION user_owns_resume(resume_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.resumes 
        WHERE id = resume_uuid 
        AND user_id = (SELECT auth.uid())
    );
END;
$$;

-- Drop all existing RLS policies that have performance issues
-- We'll recreate them with optimized auth calls

-- Drop personal_details policies
DROP POLICY IF EXISTS "Users can view own personal details" ON personal_details;
DROP POLICY IF EXISTS "Users can insert own personal details" ON personal_details;
DROP POLICY IF EXISTS "Users can update own personal details" ON personal_details;
DROP POLICY IF EXISTS "Users can delete own personal details" ON personal_details;

-- Drop profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Drop resume_analyses policies
DROP POLICY IF EXISTS "Users can view own resume analyses" ON resume_analyses;
DROP POLICY IF EXISTS "Users can insert own resume analyses" ON resume_analyses;
DROP POLICY IF EXISTS "Users can update own resume analyses" ON resume_analyses;
DROP POLICY IF EXISTS "Service role can update any analysis" ON resume_analyses;

-- Drop resume_uploads policies
DROP POLICY IF EXISTS "Users can view their own resume uploads" ON resume_uploads;
DROP POLICY IF EXISTS "Users can insert their own resume uploads" ON resume_uploads;
DROP POLICY IF EXISTS "Users can update their own resume uploads" ON resume_uploads;
DROP POLICY IF EXISTS "Users can delete their own resume uploads" ON resume_uploads;

-- Drop resumes policies
DROP POLICY IF EXISTS "Users can view own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON resumes;

-- Drop section-specific policies (courses, education, experience, etc.)
DROP POLICY IF EXISTS "Users can manage courses for own resumes" ON courses;
DROP POLICY IF EXISTS "Users can manage education for own resumes" ON education;
DROP POLICY IF EXISTS "Users can manage experience for own resumes" ON experience;
DROP POLICY IF EXISTS "Users can manage internships for own resumes" ON internships;
DROP POLICY IF EXISTS "Users can manage languages for own resumes" ON languages;
DROP POLICY IF EXISTS "Users can manage professional summaries for own resumes" ON professional_summaries;
DROP POLICY IF EXISTS "Users can manage references for own resumes" ON references;
DROP POLICY IF EXISTS "Users can manage skills for own resumes" ON skills;

-- Recreate optimized policies for personal_details
CREATE POLICY "Users can view own personal details" ON personal_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM resumes
            WHERE resumes.id = personal_details.resume_id 
            AND resumes.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Users can insert own personal details" ON personal_details
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM resumes
            WHERE resumes.id = personal_details.resume_id 
            AND resumes.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Users can update own personal details" ON personal_details
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM resumes
            WHERE resumes.id = personal_details.resume_id 
            AND resumes.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Users can delete own personal details" ON personal_details
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM resumes
            WHERE resumes.id = personal_details.resume_id 
            AND resumes.user_id = (SELECT auth.uid())
        )
    );

-- Recreate optimized policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

-- Recreate optimized policies for resume_analyses
CREATE POLICY "Users can view own resume analyses" ON resume_analyses
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own resume analyses" ON resume_analyses
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own resume analyses" ON resume_analyses
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role can update any analysis" ON resume_analyses
    FOR UPDATE USING (auth.role() = 'service_role');

-- Recreate optimized policies for resume_uploads
CREATE POLICY "Users can view their own resume uploads" ON resume_uploads
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own resume uploads" ON resume_uploads
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own resume uploads" ON resume_uploads
    FOR UPDATE USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own resume uploads" ON resume_uploads
    FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Recreate optimized policies for resumes
CREATE POLICY "Users can view own resumes" ON resumes
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own resumes" ON resumes
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own resumes" ON resumes
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own resumes" ON resumes
    FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Recreate optimized policies for section tables using the optimized function
CREATE POLICY "Users can manage courses for own resumes" ON courses
    FOR ALL USING (user_owns_resume(resume_id));

CREATE POLICY "Users can manage education for own resumes" ON education
    FOR ALL USING (user_owns_resume(resume_id));

CREATE POLICY "Users can manage experience for own resumes" ON experience
    FOR ALL USING (user_owns_resume(resume_id));

CREATE POLICY "Users can manage internships for own resumes" ON internships
    FOR ALL USING (user_owns_resume(resume_id));

CREATE POLICY "Users can manage languages for own resumes" ON languages
    FOR ALL USING (user_owns_resume(resume_id));

CREATE POLICY "Users can manage professional summaries for own resumes" ON professional_summaries
    FOR ALL USING (user_owns_resume(resume_id));

CREATE POLICY "Users can manage references for own resumes" ON references
    FOR ALL USING (user_owns_resume(resume_id));

CREATE POLICY "Users can manage skills for own resumes" ON skills
    FOR ALL USING (user_owns_resume(resume_id));

-- Add policies for the new secure PII tables if they exist
-- (These will be created by the PII security migration)

-- Optimized policies for personal_details_secure (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_details_secure' AND table_schema = 'public') THEN
        -- Drop existing policies if any
        DROP POLICY IF EXISTS "Users can access their own personal details" ON personal_details_secure;
        
        -- Create optimized policy
        CREATE POLICY "Users can access their own personal details" ON personal_details_secure
            FOR ALL USING (
                resume_id IN (
                    SELECT id FROM resumes WHERE user_id = (SELECT auth.uid())
                )
            );
    END IF;
END $$;

-- Optimized policies for resume_uploads_secure (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resume_uploads_secure' AND table_schema = 'public') THEN
        -- Drop existing policies if any
        DROP POLICY IF EXISTS "Users can access their own resume uploads" ON resume_uploads_secure;
        
        -- Create optimized policy
        CREATE POLICY "Users can access their own resume uploads" ON resume_uploads_secure
            FOR ALL USING (user_id = (SELECT auth.uid()));
    END IF;
END $$;

-- Create indexes to support the optimized RLS policies
-- These indexes will help with the EXISTS subqueries

-- Index for resumes table (if not already exists)
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);

-- Index for personal_details table
CREATE INDEX IF NOT EXISTS idx_personal_details_resume_id ON personal_details(resume_id);

-- Index for section tables
CREATE INDEX IF NOT EXISTS idx_courses_resume_id ON courses(resume_id);
CREATE INDEX IF NOT EXISTS idx_education_resume_id ON education(resume_id);
CREATE INDEX IF NOT EXISTS idx_experience_resume_id ON experience(resume_id);
CREATE INDEX IF NOT EXISTS idx_internships_resume_id ON internships(resume_id);
CREATE INDEX IF NOT EXISTS idx_languages_resume_id ON languages(resume_id);
CREATE INDEX IF NOT EXISTS idx_professional_summaries_resume_id ON professional_summaries(resume_id);
CREATE INDEX IF NOT EXISTS idx_references_resume_id ON references(resume_id);
CREATE INDEX IF NOT EXISTS idx_skills_resume_id ON skills(resume_id);

-- Index for resume_analyses table
CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_id ON resume_analyses(user_id);

-- Index for resume_uploads table
CREATE INDEX IF NOT EXISTS idx_resume_uploads_user_id ON resume_uploads(user_id);

-- Add comments for documentation
COMMENT ON FUNCTION user_owns_resume(UUID) IS 'Optimized function to check if user owns a resume. Uses (SELECT auth.uid()) for better RLS performance.';

-- Add comments to key policies
COMMENT ON POLICY "Users can view own personal details" ON personal_details IS 'Optimized RLS policy using (SELECT auth.uid()) for better performance';
COMMENT ON POLICY "Users can view own profile" ON profiles IS 'Optimized RLS policy using (SELECT auth.uid()) for better performance';
COMMENT ON POLICY "Users can view own resumes" ON resumes IS 'Optimized RLS policy using (SELECT auth.uid()) for better performance';
COMMENT ON POLICY "Users can view their own resume uploads" ON resume_uploads IS 'Optimized RLS policy using (SELECT auth.uid()) for better performance';
