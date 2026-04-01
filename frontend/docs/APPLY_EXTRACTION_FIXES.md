# Quick Guide: Apply AI Extraction Fixes

## Overview
This guide walks you through applying the fixes for AI resume extraction and database population issues.

## Prerequisites
- Supabase CLI installed
- Database access
- Node.js environment running

## Step-by-Step Instructions

### Step 1: Apply Database Migration

```bash
# Navigate to project root
cd /path/to/jobeazy

# Apply migration 026 (fix experience column name)
supabase migration up

# Verify migration applied
supabase db diff
```

**Expected Output:**
```
Applying migration 026_fix_experience_column_name.sql...
✓ Migration applied successfully
```

**Verify in Database:**
```sql
-- Check column name is now job_title (not "jobTitle")
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'experience' 
AND column_name = 'job_title';
```

### Step 2: Restart Development Server

```bash
# Stop current server (Ctrl+C)

# Restart to load updated code
npm run dev
```

### Step 3: Test Extraction Flow

#### Option A: Upload via UI
1. Navigate to resume upload page
2. Upload a test PDF resume
3. Monitor browser console and server logs
4. Verify extraction completes successfully

#### Option B: Test via API
```bash
# Get your service role key from .env.local
SERVICE_ROLE_KEY="your-service-role-key"

# Upload a resume first, then trigger extraction
curl -X POST http://localhost:3000/api/extract-resume-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -d '{
    "resumeId": "your-resume-id",
    "resumeUploadId": "your-upload-id",
    "userId": "your-user-id"
  }'
```

### Step 4: Verify Data Population

Run the test script to check data was inserted:

```bash
# Connect to your database
psql $DATABASE_URL

# Run test script (replace YOUR_RESUME_ID with actual ID)
\i scripts/test-extraction.sql
```

**Or use Supabase Studio:**
1. Open Supabase Studio
2. Navigate to SQL Editor
3. Paste and run queries from `scripts/test-extraction.sql`
4. Replace `YOUR_RESUME_ID` with your test resume ID

### Step 5: Check Logs

**Server Logs (Development):**
Look for these messages:
```
Starting AI extraction for resume <id>, file: <filename>
AI extraction successful on attempt 1
Starting data insertion for resume: <id>
Inserting personal details: {...}
Personal details inserted successfully
Inserting education records: 2
Education inserted successfully
Inserting experience records: 3
Experience inserted successfully
Inserting skills records: 15
Skills inserted successfully
All data inserted successfully for resume: <id>
```

**Database Logs:**
```sql
-- Check extraction status
SELECT 
    id, 
    title, 
    extraction_status, 
    extraction_method,
    extraction_error
FROM resumes 
ORDER BY created_at DESC 
LIMIT 5;
```

### Step 6: Verify All Tables Populated

```sql
-- Replace with your resume ID
SELECT 
    'personal_details' as table_name, 
    COUNT(*) as count 
FROM personal_details 
WHERE resume_id = 'YOUR_RESUME_ID'

UNION ALL

SELECT 'education', COUNT(*) 
FROM education 
WHERE resume_id = 'YOUR_RESUME_ID'

UNION ALL

SELECT 'experience', COUNT(*) 
FROM experience 
WHERE resume_id = 'YOUR_RESUME_ID'

UNION ALL

SELECT 'skills', COUNT(*) 
FROM skills 
WHERE resume_id = 'YOUR_RESUME_ID'

UNION ALL

SELECT 'languages', COUNT(*) 
FROM languages 
WHERE resume_id = 'YOUR_RESUME_ID'

UNION ALL

SELECT 'courses', COUNT(*) 
FROM courses 
WHERE resume_id = 'YOUR_RESUME_ID'

UNION ALL

SELECT 'professional_summaries', COUNT(*) 
FROM professional_summaries 
WHERE resume_id = 'YOUR_RESUME_ID';
```

**Expected Result:**
All tables should have at least some records (depending on resume content).

## Troubleshooting

### Issue: Migration Fails
**Error:** `column "job_title" already exists`

**Solution:** Column already renamed, skip migration
```sql
-- Verify column name
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'experience' AND column_name IN ('job_title', 'jobTitle');
```

### Issue: Extraction Still Failing
**Error:** Various database errors

**Solution:** Check detailed logs
```bash
# Enable verbose logging
DEBUG=* npm run dev

# Check specific table errors in logs
grep "error" logs.txt | grep -i "education\|experience\|skills"
```

### Issue: No Data Inserted
**Error:** Extraction status "completed" but tables empty

**Solution:** Check RLS policies and authentication
```sql
-- Verify user owns the resume
SELECT id, user_id FROM resumes WHERE id = 'YOUR_RESUME_ID';

-- Check if service role key is being used
-- Look for "Service role authentication" in server logs
```

### Issue: Dates Not Converting
**Error:** `invalid input syntax for type date`

**Solution:** Check date format in AI response
```javascript
// Add temporary logging in convertToDate function
console.log('Converting date:', dateStr);
```

## Rollback Instructions

If you need to rollback:

### 1. Revert Migration
```sql
-- Rename column back to camelCase
ALTER TABLE experience RENAME COLUMN job_title TO "jobTitle";
```

### 2. Revert Code Changes
```bash
git log --oneline  # Find commit hash
git revert <commit-hash>
```

### 3. Clear Stuck Extractions
```sql
UPDATE resumes 
SET extraction_status = 'failed',
    extraction_error = 'Rolled back - retry needed'
WHERE extraction_status = 'processing';
```

## Production Deployment

### Before Deploying:
1. ✅ Test in development environment
2. ✅ Verify all tables populate correctly
3. ✅ Check logs for errors
4. ✅ Test with multiple resume formats
5. ✅ Backup production database

### Deploy Steps:
```bash
# 1. Apply migration to production
supabase db push

# 2. Deploy code changes
git push origin main  # or your deployment branch

# 3. Monitor production logs
# Check for extraction errors

# 4. Run production verification
# Use scripts/test-extraction.sql on production DB
```

### Post-Deployment:
```sql
-- Monitor extraction success rate
SELECT 
    extraction_status,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM resumes 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY extraction_status;
```

## Success Criteria

✅ Migration 026 applied successfully  
✅ Experience table has `job_title` column (not `"jobTitle"`)  
✅ Test resume uploads and extracts successfully  
✅ All section tables populated with data  
✅ Dates converted correctly (YYYY-MM-01 format)  
✅ Logs show detailed insertion messages  
✅ No errors in server logs  
✅ Extraction status changes: pending → processing → completed  

## Additional Resources

- **Debugging Guide:** `docs/AI_EXTRACTION_DEBUGGING_GUIDE.md`
- **Fixes Summary:** `docs/AI_EXTRACTION_FIXES_SUMMARY.md`
- **Test Script:** `scripts/test-extraction.sql`
- **System Overview:** `docs/AI_RESUME_EXTRACTION.md`

## Support

If you encounter issues not covered here:
1. Check `docs/AI_EXTRACTION_DEBUGGING_GUIDE.md`
2. Run `scripts/test-extraction.sql` for diagnostics
3. Review server logs for detailed error messages
4. Check database state with verification queries

---

**Last Updated:** October 13, 2025  
**Version:** 1.0
