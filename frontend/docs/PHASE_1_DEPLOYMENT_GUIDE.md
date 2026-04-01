# Phase 1 Deployment Guide

Quick reference for deploying Phase 1 fixes to production.

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Backup production database
- [ ] Test migration on staging environment
- [ ] Verify environment variables are set
- [ ] Review current stuck analyses count

### Deployment Steps

1. **Run Investigation Script**
2. **Apply Database Migration**
3. **Run Cleanup Script** (if needed)
4. **Deploy Code Changes**
5. **Verify Deployment**

---

## 1️⃣ Run Investigation Script

**Purpose**: Check current database state and identify issues

```bash
# Connect to Supabase SQL Editor
# Or use psql:
psql -h db.embugkjoeyfukdotmgyg.supabase.co \
     -U postgres \
     -d postgres \
     -f scripts/investigate-production-issues.sql
```

**What to Look For**:
- Number of stuck analyses (status = 'processing' for >30 min)
- Number of failed analyses
- Null upload_ids count
- Existing duplicate records
- Missing indexes or constraints

**Expected Output**:
```
-- Stuck analyses: 0-5 records
-- Null upload_ids: 0 records (if any, migration will handle)
-- Duplicates: Variable (migration will handle)
-- Indexes: Should show all hash indexes exist
```

---

## 2️⃣ Apply Database Migration

**File**: `supabase/migrations/019_fix_critical_database_issues.sql`

### Option A: Via Supabase CLI (Recommended)

```bash
# Ensure you're logged in
supabase login

# Link to project
supabase link --project-ref embugkjoeyfukdotmgyg

# Push migration
supabase db push
```

### Option B: Via Supabase Dashboard

1. Go to **SQL Editor** in Supabase Dashboard
2. Create new query
3. Copy contents of `supabase/migrations/019_fix_critical_database_issues.sql`
4. Paste and run
5. Check output for NOTICE messages

### Verification

Run this query to verify changes:

```sql
-- Check upload_id is NOT NULL
SELECT 
    column_name, 
    is_nullable, 
    data_type
FROM information_schema.columns
WHERE table_name = 'resume_analyses' 
    AND column_name = 'upload_id';
-- Expected: is_nullable = 'NO'

-- Check unique constraint exists
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'unique_user_resume_hash';
-- Expected: 1 row returned

-- Check new indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename IN ('resume_uploads', 'resume_analyses')
ORDER BY indexname;
-- Expected: idx_resume_analyses_upload_id, idx_resume_uploads_user_composite
```

---

## 3️⃣ Run Cleanup Script (If Needed)

**Only run if investigation script found stuck analyses**

### Setup Environment Variables

```bash
# .env.local or shell
export NEXT_PUBLIC_SUPABASE_URL="https://embugkjoeyfukdotmgyg.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Run Script

```bash
# Install tsx if not already installed
npm install -g tsx

# Run cleanup
npx tsx scripts/cleanup-stuck-analyses.ts
```

### Expected Output

```
🔍 Checking for stuck analyses...

⚠️  Found 3 stuck analyses:

1. ID: abc-123-def
   File: resume.pdf
   Stuck for: 45 minutes
   Created: 2025-10-03T23:15:00Z

2. ID: xyz-789-ghi
   File: cv.pdf
   Stuck for: 62 minutes
   Created: 2025-10-03T22:58:00Z

🔄 Marking these analyses as failed...

✅ Successfully marked 3 analyses as failed

📋 Updated records:
1. ID: abc-123-def - Status: failed
2. ID: xyz-789-ghi - Status: failed

✨ Cleanup complete!
```

---

## 4️⃣ Deploy Code Changes

### Files Changed

1. `app/api/upload-to-supabase-analyses/route.ts` - Rate limiting added
2. `app/api/generate-pdf/route.ts` - Rate limiting added
3. `app/api/resume-score/upload/route.ts` - Rate limiting added

### Deploy via Git

```bash
# Commit changes
git add .
git commit -m "feat: Phase 1 - Add rate limiting and database fixes"

# Push to main (triggers Vercel deployment)
git push origin main
```

### Deploy via Vercel CLI

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy to production
vercel --prod
```

---

## 5️⃣ Verify Deployment

### Test Rate Limiting

```bash
# Test upload endpoint (should succeed 5 times, then rate limit)
for i in {1..7}; do
  echo "Request $i"
  curl -X POST https://your-domain.com/api/upload-to-supabase-analyses \
    -F "file=@test.pdf" \
    -F "userId=test-user-id" \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 1
done

# Expected: First 5 succeed (200), 6th and 7th return 429
```

### Check Response Headers

```bash
curl -I -X POST https://your-domain.com/api/upload-to-supabase-analyses \
  -F "file=@test.pdf" \
  -F "userId=test-user-id"

# Expected headers:
# RateLimit-Limit: 5
# RateLimit-Remaining: 4
# RateLimit-Reset: 1728001234
```

### Verify Database Changes

```sql
-- Check no null upload_ids
SELECT COUNT(*) FROM resume_analyses WHERE upload_id IS NULL;
-- Expected: 0

-- Try to insert duplicate (should fail)
INSERT INTO resume_uploads (user_id, composite_hash, ...)
VALUES ('same-user', 'same-hash', ...);
-- Expected: ERROR: duplicate key value violates unique constraint
```

### Monitor for Issues

```bash
# Check Vercel logs
vercel logs --follow

# Check Supabase logs
# Go to Supabase Dashboard > Logs > Database
```

---

## 🔄 Rollback Plan

### If Migration Fails

```sql
-- Rollback: Remove NOT NULL constraint
ALTER TABLE resume_analyses ALTER COLUMN upload_id DROP NOT NULL;

-- Rollback: Remove unique constraint
ALTER TABLE resume_uploads DROP CONSTRAINT IF EXISTS unique_user_resume_hash;

-- Rollback: Drop new indexes
DROP INDEX IF EXISTS idx_resume_analyses_upload_id;
DROP INDEX IF EXISTS idx_resume_uploads_user_composite;

-- Rollback: Drop new column
ALTER TABLE resume_analyses DROP COLUMN IF EXISTS n8n_response;
```

### If Code Deployment Fails

```bash
# Revert to previous deployment in Vercel Dashboard
# Or git revert:
git revert HEAD
git push origin main
```

---

## 📊 Post-Deployment Monitoring

### Metrics to Watch (First 24 Hours)

1. **Rate Limiting**
   - HTTP 429 response count
   - Rate limit header values
   - User complaints about "too many requests"

2. **Database Performance**
   - Query execution times for duplicate detection
   - Index usage statistics
   - No increase in errors

3. **Analysis Success Rate**
   - Fewer stuck analyses
   - Faster completion times
   - Lower failure rate

### Monitoring Queries

```sql
-- Check rate of stuck analyses (should be near zero)
SELECT 
    COUNT(*) as stuck_count,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/60) as avg_minutes_stuck
FROM resume_analyses
WHERE status = 'processing'
    AND created_at < NOW() - INTERVAL '30 minutes';

-- Check duplicate prevention is working
SELECT 
    COUNT(*) as total_uploads,
    COUNT(DISTINCT composite_hash) as unique_hashes,
    COUNT(*) - COUNT(DISTINCT composite_hash) as prevented_duplicates
FROM resume_uploads
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE tablename IN ('resume_uploads', 'resume_analyses')
ORDER BY idx_scan DESC;
```

---

## ⚠️ Troubleshooting

### Issue: Migration fails with "column already exists"

**Solution**: Some columns may already exist. The migration uses `IF NOT EXISTS` checks, but if it fails:

```sql
-- Check what exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'resume_analyses';

-- Skip problematic sections and run others individually
```

### Issue: Rate limiting not working

**Symptoms**: All requests succeed, no 429 responses

**Check**:
1. Verify code deployed: Check Vercel deployment logs
2. Verify imports: Check `withRateLimit` is imported
3. Check in-memory storage: Restart may clear rate limits

**Note**: Current implementation uses in-memory storage. For production with multiple instances, upgrade to Redis.

### Issue: Cleanup script can't connect

**Check**:
1. Environment variables set correctly
2. Service role key has proper permissions
3. Network access to Supabase

```bash
# Test connection
curl https://embugkjoeyfukdotmgyg.supabase.co/rest/v1/ \
  -H "apikey: your-service-role-key" \
  -H "Authorization: Bearer your-service-role-key"
```

---

## 📞 Support

### If Issues Arise

1. **Check Vercel Logs**: `vercel logs --follow`
2. **Check Supabase Logs**: Dashboard > Logs
3. **Run Investigation Script**: Identify current state
4. **Rollback if Needed**: Use rollback plan above

### Success Indicators

- ✅ No null `upload_id` values
- ✅ Unique constraint preventing duplicates
- ✅ Rate limiting returning 429 after limit
- ✅ Stuck analyses count near zero
- ✅ No increase in error rates

---

**Deployment Time Estimate**: 30-45 minutes  
**Recommended Time**: Off-peak hours (low traffic)  
**Risk Level**: Low (changes are additive, rollback available)
