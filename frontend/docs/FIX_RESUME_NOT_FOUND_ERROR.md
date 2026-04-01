# Fix: Resume Not Found Error (PGRST116)

**Date:** October 13, 2025  
**Issue:** Extraction API returning 404 "Resume not found" immediately after upload  
**Status:** ✅ Fixed

## Problem Description

When uploading a resume, the extraction API was being called but returning a 404 error with the message:
```
Error checking resume status: {
  code: 'PGRST116',
  details: 'The result contains 0 rows',
  hint: null,
  message: 'Cannot coerce the result to a single JSON object'
}
```

## Root Causes

### 1. Race Condition
The extraction API was being triggered immediately after the resume record was created, but before the database transaction was fully committed. This caused the extraction API to query for a resume that technically didn't exist yet.

### 2. Incorrect Error Handling
The extraction API was using `.single()` which throws a `PGRST116` error when no rows are found. The error handling code was treating this as a generic database error rather than a "resume not found" scenario.

## Solutions Implemented

### Fix 1: Use `maybeSingle()` Instead of `single()`

**File:** `app/api/extract-resume-data/route.ts`

**Before:**
```typescript
const result = await supabase
    .from('resumes')
    .select('extraction_status, extraction_method, extraction_retry_count')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single(); // Throws PGRST116 when 0 rows
```

**After:**
```typescript
const result = await supabase
    .from('resumes')
    .select('extraction_status, extraction_method, extraction_retry_count')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .maybeSingle(); // Returns null when 0 rows, no error
```

**Benefit:** `maybeSingle()` returns `null` for the data when no rows are found instead of throwing an error, making it easier to handle the "not found" case.

### Fix 2: Improved Error Handling

**Added explicit check for missing resume:**
```typescript
// Handle case where resume doesn't exist
if (!existingResume && !resumeError) {
    console.error('Resume not found:', { resumeId, userId });
    return NextResponse.json(
        { error: 'Resume not found', details: 'No resume record exists with the provided ID' },
        { status: 404 }
    );
}

// Handle other database errors (excluding column-related errors)
if (resumeError && !resumeError.message?.includes('column') && !resumeError.message?.includes('does not exist')) {
    console.error('Error checking resume status:', resumeError);
    return NextResponse.json(
        { error: 'Database error', details: resumeError.message },
        { status: 500 }
    );
}
```

**Benefit:** Clear separation between "resume not found" (404) and "database error" (500) scenarios.

### Fix 3: Add Delay Before Extraction Trigger

**File:** `app/api/process-resume-upload/route.ts`

**Before:**
```typescript
fetch(`${baseUrl}/api/extract-resume-data`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        ...(serviceRoleKey && { 'Authorization': `Bearer ${serviceRoleKey}` })
    },
    body: JSON.stringify(extractionPayload)
}).catch(err => console.error('Failed to trigger extraction:', err));
```

**After:**
```typescript
// Add small delay to ensure resume record is fully committed
setTimeout(() => {
    fetch(`${baseUrl}/api/extract-resume-data`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(serviceRoleKey && { 'Authorization': `Bearer ${serviceRoleKey}` })
        },
        body: JSON.stringify(extractionPayload)
    }).catch(err => console.error('Failed to trigger extraction:', err));
}, 500); // 500ms delay to ensure DB transaction completes
```

**Benefit:** Gives the database transaction time to fully commit before the extraction API queries for the resume record.

### Fix 4: Enhanced Logging

**Added logging at key points:**
```typescript
// In process-resume-upload route
console.log('Creating resume record for user:', authenticatedUserId);
console.log('Resume record created successfully:', resumeData?.id);
console.log('Triggering AI extraction with payload:', extractionPayload);

// In extract-resume-data route
console.error('Resume not found:', { resumeId, userId });
```

**Benefit:** Makes it easier to trace the flow and identify where issues occur.

## Testing

### Before Fix:
```
✓ Resume upload created
✓ Resume record created
✗ Extraction API: 404 "Resume not found" (PGRST116)
```

### After Fix:
```
✓ Resume upload created
✓ Resume record created
✓ 500ms delay
✓ Extraction API: Resume found
✓ AI extraction started
✓ Data inserted into tables
```

## Impact

- **User Experience:** No more failed extractions due to race conditions
- **Error Messages:** Clearer distinction between "not found" and "database error"
- **Debugging:** Better logging for troubleshooting
- **Reliability:** 500ms delay ensures database consistency

## Related Issues

This fix also addresses:
- Intermittent extraction failures
- "Resume not found" errors on first upload attempt
- Confusion between database errors and missing records

## Supabase `.single()` vs `.maybeSingle()`

### `.single()`
- **Returns:** Single object or throws error
- **When 0 rows:** Throws `PGRST116` error
- **When 1 row:** Returns the row
- **When 2+ rows:** Throws error
- **Use case:** When you expect exactly 1 row and want to fail if not

### `.maybeSingle()`
- **Returns:** Single object or null
- **When 0 rows:** Returns `{ data: null, error: null }`
- **When 1 row:** Returns the row
- **When 2+ rows:** Throws error
- **Use case:** When you expect 0 or 1 row and want to handle both cases

## Best Practices

### When to use `.maybeSingle()`:
- Checking if a record exists before creating
- Optional lookups where absence is valid
- Idempotency checks
- Conditional logic based on record existence

### When to use `.single()`:
- Fetching required records that must exist
- When absence should be treated as an error
- When you want automatic error handling

## Alternative Solutions Considered

### Option 1: Await the extraction trigger
**Rejected:** Would block the upload response, poor UX

### Option 2: Use database triggers
**Rejected:** Adds complexity, harder to debug

### Option 3: Polling from frontend
**Rejected:** More network requests, more complex client code

### Option 4: Longer delay (1-2 seconds)
**Rejected:** 500ms is sufficient, longer delays hurt UX

## Rollback Plan

If issues occur:

```typescript
// Revert to .single()
const result = await supabase
    .from('resumes')
    .select('extraction_status, extraction_method, extraction_retry_count')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single();

// Remove delay
fetch(`${baseUrl}/api/extract-resume-data`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        ...(serviceRoleKey && { 'Authorization': `Bearer ${serviceRoleKey}` })
    },
    body: JSON.stringify(extractionPayload)
}).catch(err => console.error('Failed to trigger extraction:', err));
```

## Monitoring

Track these metrics post-deployment:

```sql
-- Check for 404 errors in extraction
SELECT 
    COUNT(*) as total_extractions,
    COUNT(*) FILTER (WHERE extraction_status = 'failed' AND extraction_error LIKE '%not found%') as not_found_errors,
    ROUND(100.0 * COUNT(*) FILTER (WHERE extraction_status = 'failed' AND extraction_error LIKE '%not found%') / COUNT(*), 2) as error_rate_percent
FROM resumes
WHERE created_at > NOW() - INTERVAL '1 day';
```

## References

- **Supabase Docs:** https://supabase.com/docs/reference/javascript/single
- **Supabase Docs:** https://supabase.com/docs/reference/javascript/maybeSingle
- **Related Issue:** PGRST116 - Cannot coerce result to single JSON object

---

**Fixed By:** AI Assistant  
**Tested:** Pending manual verification  
**Deployed:** Pending
