# AI Resume Extraction Debugging Guide

## Overview

This guide helps debug issues with the AI-powered resume extraction and database population system.

## Common Issues and Solutions

### Issue 1: Data Not Being Inserted into Tables

**Symptoms:**
- Extraction status shows "completed" but tables are empty
- No error messages in logs
- Frontend shows empty form fields

**Root Causes:**
1. **Column name mismatches** - AI extractor sends snake_case but database expects camelCase (or vice versa)
2. **Date format issues** - AI sends YYYY-MM but database expects full DATE format
3. **RLS policy blocks** - User authentication not properly passed to database queries
4. **Missing conflict resolution** - Upsert operations fail without proper conflict handling

**Solutions:**

#### Fixed Column Mappings:
- `experience.job_title` - Now uses snake_case (migration 026 applied)
- All other tables use snake_case consistently

#### Date Conversion:
The `convertToDate()` helper function now handles:
- `YYYY-MM` format → converts to `YYYY-MM-01`
- `YYYY-MM-DD` format → passes through
- `"Present"` → converts to `null`
- Invalid formats → returns `null` with warning

#### Proper Insert Operations:
Changed from `upsert()` to `insert()` for array tables to avoid conflicts:
- `education` - uses `insert()`
- `experience` - uses `insert()`
- `skills` - uses `insert()`
- `languages` - uses `insert()`
- `courses` - uses `insert()`
- `professional_summaries` - uses `insert()`
- `personal_details` - uses `upsert()` with `onConflict: 'resume_id'`

### Issue 2: Authentication Errors

**Symptoms:**
- 401 Unauthorized errors
- "User not found" errors
- RLS policy violations

**Root Causes:**
1. Service role key not properly configured
2. Bearer token not passed in internal API calls
3. Cookie-based auth failing for async requests

**Solutions:**

The extraction API now supports three auth methods:
1. **Service Role Key** - For internal API calls (highest priority)
2. **Bearer Token** - For authenticated user requests
3. **Cookie-based Auth** - Fallback for browser requests

```typescript
// Internal API calls use service role key
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

fetch(`${baseUrl}/api/extract-resume-data`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        ...(serviceRoleKey && { 'Authorization': `Bearer ${serviceRoleKey}` })
    },
    body: JSON.stringify(extractionPayload)
});
```

### Issue 3: Extraction Status Stuck in "Processing"

**Symptoms:**
- Status never changes from "processing"
- No error messages
- Frontend shows loading indefinitely

**Root Causes:**
1. Migration 025 not applied (extraction status columns missing)
2. `update_extraction_status` function not available
3. Extraction API crashes before updating status

**Solutions:**

The extraction API now has graceful fallbacks:
```typescript
try {
    await supabase.rpc('update_extraction_status', {
        resume_id: resumeId,
        status: 'completed',
        method: extractionResult.method,
        retry_count: extractionResult.retryCount
    });
} catch (err) {
    console.log('update_extraction_status function not available yet, extraction completed successfully');
}
```

**Manual Fix:**
```sql
-- Check migration status
SELECT * FROM resumes WHERE id = 'your-resume-id';

-- If extraction_status column doesn't exist, apply migration 025
\i supabase/migrations/025_add_extraction_status.sql

-- Manually update stuck records
UPDATE resumes 
SET extraction_status = 'failed', 
    extraction_error = 'Stuck in processing - manual reset'
WHERE extraction_status = 'processing' 
AND updated_at < NOW() - INTERVAL '10 minutes';
```

### Issue 4: AI Extraction Fails

**Symptoms:**
- Extraction status shows "failed"
- Error: "OpenRouter API error"
- Fallback extraction used

**Root Causes:**
1. Missing `OPENROUTER_API_KEY` environment variable
2. API rate limits exceeded
3. Invalid PDF text format
4. Network timeouts

**Solutions:**

Check environment variables:
```bash
# Verify API key is set
echo $OPENROUTER_API_KEY

# Check .env.local file
cat .env.local | grep OPENROUTER
```

Check API logs:
```typescript
// Look for these log messages
console.log(`AI extraction attempt ${attempt}/${retries}`);
console.log(`AI extraction successful on attempt ${attempt}`);
console.error(`AI extraction attempt ${attempt} failed:`, error);
```

Fallback extraction:
- Automatically triggered after 3 failed AI attempts
- Uses regex patterns for basic info extraction
- Sets `extraction_method` to "fallback"

### Issue 5: Partial Data Insertion

**Symptoms:**
- Some sections populated, others empty
- Errors in specific table insertions
- Inconsistent data across resumes

**Root Causes:**
1. Individual table insertion failures
2. Data validation errors
3. Missing required fields
4. Type mismatches

**Solutions:**

Enhanced logging now shows exactly which table failed:
```typescript
console.log('Starting data insertion for resume:', resumeId);
console.log('Inserting personal details:', { resume_id: resumeId, ...data.personalDetails });
console.log('Personal details inserted successfully');
console.error('Personal details error:', personalError);
```

Check logs for specific errors:
```bash
# Filter logs by table name
grep "Education error" logs.txt
grep "Experience error" logs.txt
grep "Skills error" logs.txt
```

## Debugging Workflow

### Step 1: Check Extraction Status

```sql
-- Get extraction status for a resume
SELECT 
    id,
    title,
    extraction_status,
    extraction_method,
    extraction_error,
    extraction_retry_count,
    extraction_completed_at,
    created_at,
    updated_at
FROM resumes 
WHERE id = 'your-resume-id';
```

### Step 2: Check Resume Upload Record

```sql
-- Verify upload record exists with extracted text
SELECT 
    id,
    file_name,
    LENGTH(extracted_text) as text_length,
    status,
    created_at
FROM resume_uploads 
WHERE id = 'your-upload-id';
```

### Step 3: Check Inserted Data

```sql
-- Check all sections for a resume
SELECT 'personal_details' as section, COUNT(*) as count FROM personal_details WHERE resume_id = 'your-resume-id'
UNION ALL
SELECT 'education', COUNT(*) FROM education WHERE resume_id = 'your-resume-id'
UNION ALL
SELECT 'experience', COUNT(*) FROM experience WHERE resume_id = 'your-resume-id'
UNION ALL
SELECT 'skills', COUNT(*) FROM skills WHERE resume_id = 'your-resume-id'
UNION ALL
SELECT 'languages', COUNT(*) FROM languages WHERE resume_id = 'your-resume-id'
UNION ALL
SELECT 'courses', COUNT(*) FROM courses WHERE resume_id = 'your-resume-id'
UNION ALL
SELECT 'professional_summaries', COUNT(*) FROM professional_summaries WHERE resume_id = 'your-resume-id';
```

### Step 4: Check API Logs

```bash
# Development logs
npm run dev

# Look for extraction-related logs
# - "Starting AI extraction for resume..."
# - "AI extraction completed successfully..."
# - "Starting data insertion for resume..."
# - "All data inserted successfully..."
```

### Step 5: Test Extraction Manually

```bash
# Trigger extraction via API
curl -X POST http://localhost:3000/api/extract-resume-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{
    "resumeId": "your-resume-id",
    "resumeUploadId": "your-upload-id",
    "userId": "your-user-id"
  }'
```

## Database Schema Reference

### Tables and Column Names

**personal_details:**
- `resume_id` (UUID, FK)
- `job_title` (TEXT)
- `first_name` (TEXT)
- `last_name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `address` (TEXT)
- `city_state` (TEXT)
- `country` (TEXT)

**education:**
- `resume_id` (UUID, FK)
- `school` (TEXT, required)
- `degree` (TEXT)
- `start_date` (DATE)
- `end_date` (DATE)
- `location` (TEXT)
- `description` (TEXT)

**experience:**
- `resume_id` (UUID, FK)
- `employer` (TEXT, required)
- `job_title` (TEXT, required) ← **Fixed in migration 026**
- `start_date` (DATE)
- `end_date` (DATE)
- `location` (TEXT)
- `description` (TEXT)

**skills:**
- `resume_id` (UUID, FK)
- `name` (TEXT, required)
- `level` (INTEGER, 1-5)

**languages:**
- `resume_id` (UUID, FK)
- `name` (TEXT, required)
- `proficiency` (TEXT)

**courses:**
- `resume_id` (UUID, FK)
- `course` (TEXT, required)
- `institution` (TEXT)
- `start_date` (DATE)
- `end_date` (DATE)
- `description` (TEXT)

**professional_summaries:**
- `resume_id` (UUID, FK)
- `content` (TEXT, required)

## Environment Variables Checklist

```bash
# Required for AI extraction
OPENROUTER_API_KEY=sk-or-v1-...

# Required for Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Required for internal API calls
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

## Migration Checklist

Ensure these migrations are applied in order:

- [x] `005_create_resumes.sql` - Resumes table
- [x] `006_create_education.sql` - Education table
- [x] `007_create_experience.sql` - Experience table
- [x] `008_create_skills.sql` - Skills table
- [x] `009_create_languages.sql` - Languages table
- [x] `011_create_courses.sql` - Courses table
- [x] `013_create_professional_summaries.sql` - Professional summaries table
- [x] `017_create_personal_details.sql` - Personal details table
- [x] `025_add_extraction_status.sql` - Extraction status tracking
- [x] `026_fix_experience_column_name.sql` - **NEW** - Fix experience.job_title

## Testing Checklist

- [ ] Upload a test PDF resume
- [ ] Verify `resume_uploads` record created with `extracted_text`
- [ ] Verify `resumes` record created
- [ ] Check extraction status changes: pending → processing → completed
- [ ] Verify data in all section tables
- [ ] Check for any error logs
- [ ] Test with different resume formats
- [ ] Test with missing sections
- [ ] Test with invalid dates
- [ ] Test fallback extraction (by temporarily removing API key)

## Common Error Messages

### "No extracted text found"
**Cause:** PDF text extraction failed during upload
**Fix:** Check PDF file is valid and contains extractable text

### "Database insertion errors: Experience: column 'jobTitle' does not exist"
**Cause:** Migration 026 not applied
**Fix:** Apply migration 026 to rename column

### "OpenRouter API error: 401"
**Cause:** Invalid or missing API key
**Fix:** Check `OPENROUTER_API_KEY` environment variable

### "Unauthorized"
**Cause:** Authentication failed
**Fix:** Verify service role key is passed in Authorization header

### "Resume not found"
**Cause:** Resume ID doesn't exist or user doesn't own it
**Fix:** Check resume ID and user ID match

## Performance Monitoring

```sql
-- Check extraction performance
SELECT 
    extraction_method,
    COUNT(*) as total,
    AVG(EXTRACT(EPOCH FROM (extraction_completed_at - created_at))) as avg_duration_seconds,
    COUNT(*) FILTER (WHERE extraction_status = 'completed') as successful,
    COUNT(*) FILTER (WHERE extraction_status = 'failed') as failed
FROM resumes 
WHERE extraction_completed_at IS NOT NULL
GROUP BY extraction_method;
```

## Support Resources

- **AI Extraction Documentation:** `docs/AI_RESUME_EXTRACTION.md`
- **Database Schema:** `supabase/migrations/`
- **API Implementation:** `app/api/extract-resume-data/route.ts`
- **Service Implementation:** `app/lib/services/aiResumeExtractor.ts`

## Contact

For issues not covered in this guide, check the application logs and database state using the queries above. Document any new issues discovered and add them to this guide.
