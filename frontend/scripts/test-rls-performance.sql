-- RLS Performance Testing Script
-- This script tests the performance improvements of the optimized RLS policies

-- Test 1: Check current RLS policies and their performance characteristics
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'NEEDS_OPTIMIZATION'
        WHEN qual LIKE '%(SELECT auth.uid())%' THEN 'OPTIMIZED'
        ELSE 'NO_AUTH_CALLS'
    END as performance_status,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND qual IS NOT NULL
ORDER BY performance_status, tablename, policyname;

-- Test 2: Check the user_owns_resume function definition
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'user_owns_resume';

-- Test 3: Verify indexes exist for RLS performance
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND (
    indexname LIKE '%user_id%' 
    OR indexname LIKE '%resume_id%'
)
ORDER BY tablename, indexname;

-- Test 4: Count policies by optimization status
WITH policy_analysis AS (
    SELECT 
        tablename,
        policyname,
        CASE 
            WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'NEEDS_OPTIMIZATION'
            WHEN qual LIKE '%(SELECT auth.uid())%' THEN 'OPTIMIZED'
            WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' THEN 'NEEDS_OPTIMIZATION'
            WHEN with_check LIKE '%(SELECT auth.uid())%' THEN 'OPTIMIZED'
            ELSE 'NO_AUTH_CALLS'
        END as performance_status
    FROM pg_policies 
    WHERE schemaname = 'public'
)
SELECT 
    performance_status,
    COUNT(*) as policy_count
FROM policy_analysis
GROUP BY performance_status
ORDER BY performance_status;

-- Test 5: Check for any remaining unoptimized auth.uid() calls
SELECT 
    'UNOPTIMIZED_POLICIES' as issue_type,
    tablename,
    policyname,
    cmd,
    'qual' as location,
    qual as content
FROM pg_policies 
WHERE schemaname = 'public'
AND qual LIKE '%auth.uid()%' 
AND qual NOT LIKE '%(SELECT auth.uid())%'

UNION ALL

SELECT 
    'UNOPTIMIZED_POLICIES' as issue_type,
    tablename,
    policyname,
    cmd,
    'with_check' as location,
    with_check as content
FROM pg_policies 
WHERE schemaname = 'public'
AND with_check LIKE '%auth.uid()%' 
AND with_check NOT LIKE '%(SELECT auth.uid())%'

ORDER BY tablename, policyname;

-- Test 6: Performance comparison query (run before and after optimization)
-- This simulates a typical user query that would be affected by RLS performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM personal_details pd
JOIN resumes r ON pd.resume_id = r.id
WHERE r.user_id = (SELECT auth.uid());

-- Test 7: Check function performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*)
FROM courses c
WHERE user_owns_resume(c.resume_id);
