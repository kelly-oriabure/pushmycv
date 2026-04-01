-- Test Script: Verify AI Resume Extraction and Database Population
-- Run this script to check the status of resume extraction and data population

-- ============================================================================
-- SECTION 1: Check Extraction Status
-- ============================================================================

-- Get all resumes with their extraction status
SELECT 
    r.id,
    r.title,
    r.user_id,
    r.extraction_status,
    r.extraction_method,
    r.extraction_error,
    r.extraction_retry_count,
    r.extraction_completed_at,
    r.created_at,
    r.updated_at,
    EXTRACT(EPOCH FROM (r.extraction_completed_at - r.created_at)) as extraction_duration_seconds
FROM resumes r
ORDER BY r.created_at DESC
LIMIT 20;

-- ============================================================================
-- SECTION 2: Check Data Population for Specific Resume
-- ============================================================================

-- Replace 'YOUR_RESUME_ID' with actual resume ID
DO $$
DECLARE
    target_resume_id UUID := 'YOUR_RESUME_ID'; -- CHANGE THIS
BEGIN
    RAISE NOTICE '=== Resume Data Population Check ===';
    RAISE NOTICE 'Resume ID: %', target_resume_id;
    RAISE NOTICE '';
    
    -- Check personal details
    RAISE NOTICE 'Personal Details: % records', (
        SELECT COUNT(*) FROM personal_details WHERE resume_id = target_resume_id
    );
    
    -- Check education
    RAISE NOTICE 'Education: % records', (
        SELECT COUNT(*) FROM education WHERE resume_id = target_resume_id
    );
    
    -- Check experience
    RAISE NOTICE 'Experience: % records', (
        SELECT COUNT(*) FROM experience WHERE resume_id = target_resume_id
    );
    
    -- Check skills
    RAISE NOTICE 'Skills: % records', (
        SELECT COUNT(*) FROM skills WHERE resume_id = target_resume_id
    );
    
    -- Check languages
    RAISE NOTICE 'Languages: % records', (
        SELECT COUNT(*) FROM languages WHERE resume_id = target_resume_id
    );
    
    -- Check courses
    RAISE NOTICE 'Courses: % records', (
        SELECT COUNT(*) FROM courses WHERE resume_id = target_resume_id
    );
    
    -- Check professional summary
    RAISE NOTICE 'Professional Summary: % records', (
        SELECT COUNT(*) FROM professional_summaries WHERE resume_id = target_resume_id
    );
END $$;

-- ============================================================================
-- SECTION 3: Detailed Data View for Specific Resume
-- ============================================================================

-- Personal Details
SELECT 'PERSONAL DETAILS' as section, * FROM personal_details WHERE resume_id = 'YOUR_RESUME_ID';

-- Education
SELECT 'EDUCATION' as section, * FROM education WHERE resume_id = 'YOUR_RESUME_ID';

-- Experience
SELECT 'EXPERIENCE' as section, * FROM experience WHERE resume_id = 'YOUR_RESUME_ID';

-- Skills
SELECT 'SKILLS' as section, * FROM skills WHERE resume_id = 'YOUR_RESUME_ID';

-- Languages
SELECT 'LANGUAGES' as section, * FROM languages WHERE resume_id = 'YOUR_RESUME_ID';

-- Courses
SELECT 'COURSES' as section, * FROM courses WHERE resume_id = 'YOUR_RESUME_ID';

-- Professional Summary
SELECT 'PROFESSIONAL SUMMARY' as section, * FROM professional_summaries WHERE resume_id = 'YOUR_RESUME_ID';

-- ============================================================================
-- SECTION 4: Check Resume Upload Record
-- ============================================================================

SELECT 
    ru.id,
    ru.user_id,
    ru.file_name,
    ru.file_type,
    ru.file_size,
    LENGTH(ru.extracted_text) as extracted_text_length,
    ru.status,
    ru.created_at,
    ru.updated_at
FROM resume_uploads ru
WHERE ru.id IN (
    SELECT id FROM resume_uploads 
    WHERE user_id = (SELECT user_id FROM resumes WHERE id = 'YOUR_RESUME_ID')
    ORDER BY created_at DESC
    LIMIT 5
);

-- ============================================================================
-- SECTION 5: Extraction Statistics
-- ============================================================================

-- Overall extraction statistics
SELECT 
    extraction_status,
    extraction_method,
    COUNT(*) as count,
    ROUND(AVG(extraction_retry_count), 2) as avg_retry_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (extraction_completed_at - created_at))), 2) as avg_duration_seconds,
    MAX(extraction_completed_at) as latest_completion
FROM resumes 
WHERE extraction_status IS NOT NULL
GROUP BY extraction_status, extraction_method
ORDER BY extraction_status, extraction_method;

-- ============================================================================
-- SECTION 6: Failed Extractions
-- ============================================================================

-- Get all failed extractions with error messages
SELECT 
    id,
    title,
    user_id,
    extraction_error,
    extraction_retry_count,
    created_at,
    updated_at
FROM resumes 
WHERE extraction_status = 'failed'
ORDER BY updated_at DESC
LIMIT 10;

-- ============================================================================
-- SECTION 7: Stuck Extractions (Processing > 10 minutes)
-- ============================================================================

-- Find extractions stuck in processing state
SELECT 
    id,
    title,
    user_id,
    extraction_status,
    extraction_retry_count,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 as minutes_stuck
FROM resumes 
WHERE extraction_status = 'processing'
AND updated_at < NOW() - INTERVAL '10 minutes'
ORDER BY updated_at ASC;

-- ============================================================================
-- SECTION 8: Data Completeness Check
-- ============================================================================

-- Check which resumes have incomplete data
SELECT 
    r.id,
    r.title,
    r.extraction_status,
    r.extraction_method,
    CASE WHEN pd.id IS NOT NULL THEN '✓' ELSE '✗' END as has_personal_details,
    (SELECT COUNT(*) FROM education WHERE resume_id = r.id) as education_count,
    (SELECT COUNT(*) FROM experience WHERE resume_id = r.id) as experience_count,
    (SELECT COUNT(*) FROM skills WHERE resume_id = r.id) as skills_count,
    (SELECT COUNT(*) FROM languages WHERE resume_id = r.id) as languages_count,
    (SELECT COUNT(*) FROM courses WHERE resume_id = r.id) as courses_count,
    CASE WHEN ps.id IS NOT NULL THEN '✓' ELSE '✗' END as has_summary
FROM resumes r
LEFT JOIN personal_details pd ON pd.resume_id = r.id
LEFT JOIN professional_summaries ps ON ps.resume_id = r.id
WHERE r.extraction_status = 'completed'
ORDER BY r.created_at DESC
LIMIT 20;

-- ============================================================================
-- SECTION 9: Check Migration Status
-- ============================================================================

-- Verify extraction status columns exist
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'resumes'
AND column_name IN ('extraction_status', 'extraction_method', 'extraction_error', 'extraction_retry_count', 'extraction_completed_at')
ORDER BY column_name;

-- Verify experience table has correct column name
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'experience'
AND column_name IN ('job_title', 'jobTitle')
ORDER BY column_name;

-- ============================================================================
-- SECTION 10: User-Specific Statistics
-- ============================================================================

-- Get extraction stats for a specific user (replace with actual user_id)
SELECT * FROM get_user_extraction_stats('YOUR_USER_ID');

-- ============================================================================
-- SECTION 11: Recent Activity
-- ============================================================================

-- Show recent extraction activity
SELECT 
    r.id,
    r.title,
    r.extraction_status,
    r.extraction_method,
    r.extraction_completed_at,
    EXTRACT(EPOCH FROM (r.extraction_completed_at - r.created_at)) as duration_seconds,
    (SELECT COUNT(*) FROM education WHERE resume_id = r.id) +
    (SELECT COUNT(*) FROM experience WHERE resume_id = r.id) +
    (SELECT COUNT(*) FROM skills WHERE resume_id = r.id) as total_records_inserted
FROM resumes r
WHERE r.extraction_completed_at IS NOT NULL
ORDER BY r.extraction_completed_at DESC
LIMIT 10;

-- ============================================================================
-- END OF TEST SCRIPT
-- ============================================================================

-- Instructions:
-- 1. Replace 'YOUR_RESUME_ID' with an actual resume ID from your database
-- 2. Replace 'YOUR_USER_ID' with an actual user ID
-- 3. Run each section separately or run the entire script
-- 4. Check the output for any anomalies or missing data
