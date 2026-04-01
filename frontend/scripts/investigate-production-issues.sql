-- ============================================
-- Production Issue Investigation Script
-- Phase 1: Immediate Production Fixes
-- ============================================

-- 1. Check for stuck or failed resume analyses
SELECT 
    id,
    user_id,
    upload_id,
    file_name,
    job_title,
    status,
    error_message,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_since_created
FROM public.resume_analyses 
WHERE status IN ('processing', 'failed')
ORDER BY created_at DESC;

-- 2. Check for null upload_ids in resume_analyses
SELECT 
    COUNT(*) as null_upload_id_count,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count
FROM public.resume_analyses 
WHERE upload_id IS NULL;

-- 3. Verify hash indexes exist on resume_uploads
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'resume_uploads'
ORDER BY indexname;

-- 4. Check for duplicate composite hashes (should be prevented by unique constraint)
SELECT 
    user_id,
    composite_hash,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at) as upload_ids,
    array_agg(created_at ORDER BY created_at) as created_dates
FROM public.resume_uploads
WHERE composite_hash IS NOT NULL
GROUP BY user_id, composite_hash
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 5. Check if unique constraint exists on composite_hash
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.resume_uploads'::regclass
    AND contype = 'u'; -- unique constraints

-- 6. Check for missing index on resume_analyses.upload_id
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'resume_analyses'
ORDER BY indexname;

-- 7. Check overall database health
SELECT 
    'resume_uploads' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) FILTER (WHERE composite_hash IS NOT NULL) as with_composite_hash,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7_days
FROM public.resume_uploads
UNION ALL
SELECT 
    'resume_analyses' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7_days
FROM public.resume_analyses;

-- 8. Find analyses stuck for more than 30 minutes
SELECT 
    id,
    user_id,
    file_name,
    status,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_stuck,
    created_at
FROM public.resume_analyses
WHERE status = 'processing'
    AND created_at < NOW() - INTERVAL '30 minutes'
ORDER BY created_at;
