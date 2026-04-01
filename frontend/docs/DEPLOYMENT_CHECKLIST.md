# 🚀 Phase 1 Deployment Checklist

Quick reference checklist for deploying Phase 1 fixes.

---

## ✅ Pre-Deployment Checklist

- [ ] **Backup production database**
  ```bash
  # Via Supabase Dashboard: Database > Backups > Create Backup
  ```

- [ ] **Review all changes**
  - [ ] Read `docs/PHASE_1_FINAL_SUMMARY.md`
  - [ ] Review migration file: `supabase/migrations/019_fix_critical_database_issues.sql`
  - [ ] Review code changes in 4 route files

- [ ] **Test on staging** (if available)
  - [ ] Apply migration to staging
  - [ ] Test rate limiting
  - [ ] Test edge function timeout
  - [ ] Verify no errors

- [ ] **Environment variables set**
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=...
  SUPABASE_SERVICE_ROLE_KEY=...
  N8N_WEBHOOK_URL=... (optional)
  ```

- [ ] **Communication**
  - [ ] Notify team of deployment window
  - [ ] Schedule during off-peak hours
  - [ ] Have rollback plan ready

---

## 🔧 Deployment Steps

### **Step 1: Run Investigation Script** (5 minutes)

- [ ] Open Supabase Dashboard > SQL Editor
- [ ] Copy contents of `scripts/investigate-production-issues.sql`
- [ ] Run the script
- [ ] Note down:
  - [ ] Number of stuck analyses: _______
  - [ ] Number of null upload_ids: _______
  - [ ] Number of duplicate records: _______

**Expected**: 0-5 stuck, 0 nulls, some duplicates (will be handled)

---

### **Step 2: Apply Database Migration** (10 minutes)

- [ ] **Option A: Via Supabase CLI**
  ```bash
  supabase login
  supabase link --project-ref embugkjoeyfukdotmgyg
  supabase db push
  ```

- [ ] **Option B: Via SQL Editor**
  - [ ] Copy `supabase/migrations/019_fix_critical_database_issues.sql`
  - [ ] Paste into SQL Editor
  - [ ] Run migration
  - [ ] Check for NOTICE messages (should see success confirmations)

- [ ] **Verify migration applied**
  ```sql
  -- Check upload_id is NOT NULL
  SELECT is_nullable FROM information_schema.columns
  WHERE table_name = 'resume_analyses' AND column_name = 'upload_id';
  -- Expected: NO
  
  -- Check unique constraint exists
  SELECT COUNT(*) FROM pg_constraint WHERE conname = 'unique_user_resume_hash';
  -- Expected: 1
  ```

---

### **Step 3: Run Cleanup Script** (5 minutes)

**Only if investigation found stuck analyses**

- [ ] Set environment variables
  ```bash
  export NEXT_PUBLIC_SUPABASE_URL="https://embugkjoeyfukdotmgyg.supabase.co"
  export SUPABASE_SERVICE_ROLE_KEY="your-key"
  ```

- [ ] Run cleanup script
  ```bash
  npx tsx scripts/cleanup-stuck-analyses.ts
  ```

- [ ] Verify output shows analyses marked as failed

---

### **Step 4: Deploy Code Changes** (10 minutes)

- [ ] **Commit changes**
  ```bash
  git add .
  git commit -m "feat: Phase 1 - Production fixes complete

  - Add rate limiting to 3 critical routes
  - Add timeout mechanism to edge function
  - Database migration for data integrity
  - Cleanup automation for stuck analyses"
  
  git push origin main
  ```

- [ ] **Wait for Vercel deployment**
  - [ ] Check Vercel dashboard for deployment status
  - [ ] Verify deployment succeeded
  - [ ] Note deployment URL: _______________________

---

### **Step 5: Deploy Edge Function** (5 minutes)

- [ ] **Deploy via Supabase CLI**
  ```bash
  supabase functions deploy resume-analysis
  ```

- [ ] **Verify deployment**
  - [ ] Check Supabase Dashboard > Edge Functions
  - [ ] Verify `resume-analysis` shows recent deployment
  - [ ] Check function logs for any errors

---

### **Step 6: Verify Deployment** (15 minutes)

#### **Test Rate Limiting**

- [ ] Test upload endpoint (should succeed 5 times, then rate limit)
  ```bash
  # Test 7 times (expect 5 success, 2 rate limited)
  for i in {1..7}; do
    echo "Request $i"
    curl -X POST https://your-domain.com/api/upload-to-supabase-analyses \
      -F "file=@test.pdf" \
      -F "userId=test-user" \
      -w "\nHTTP: %{http_code}\n"
    sleep 1
  done
  ```

- [ ] Verify rate limit headers present
  ```bash
  curl -I https://your-domain.com/api/generate-pdf
  # Should see: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
  ```

#### **Test Database Changes**

- [ ] Verify no null upload_ids
  ```sql
  SELECT COUNT(*) FROM resume_analyses WHERE upload_id IS NULL;
  -- Expected: 0
  ```

- [ ] Test duplicate prevention
  ```sql
  -- Try to insert duplicate (should fail)
  INSERT INTO resume_uploads (user_id, composite_hash, file_name, file_path, file_type, file_size, resume_url)
  VALUES ('test-user', 'test-hash', 'test.pdf', 'path', 'pdf', 100, 'url');
  -- Run twice - second should fail with unique constraint error
  ```

#### **Test Edge Function Timeout**

- [ ] Trigger analysis with slow webhook (if possible)
- [ ] Verify timeout after 30 seconds
- [ ] Check analysis marked as "failed" with timeout message
- [ ] Verify HTTP 504 response returned

---

## 📊 Post-Deployment Monitoring (24 hours)

### **Hour 1: Immediate Checks**

- [ ] Check Vercel logs for errors
  ```bash
  vercel logs --follow
  ```

- [ ] Check Supabase logs
  - [ ] Database logs (no errors)
  - [ ] Edge function logs (no errors)

- [ ] Monitor error rates
  - [ ] No increase in 500 errors
  - [ ] HTTP 429 responses appearing (rate limiting working)
  - [ ] HTTP 504 responses for timeouts (if any)

### **Hour 6: Health Check**

- [ ] Run investigation script again
  ```sql
  -- Check for stuck analyses
  SELECT COUNT(*) FROM resume_analyses 
  WHERE status = 'processing' AND created_at < NOW() - INTERVAL '30 minutes';
  -- Expected: 0
  ```

- [ ] Check duplicate prevention
  ```sql
  SELECT COUNT(*) - COUNT(DISTINCT composite_hash) as prevented_duplicates
  FROM resume_uploads
  WHERE created_at > NOW() - INTERVAL '6 hours';
  ```

- [ ] Verify rate limiting metrics
  - [ ] Count of 429 responses: _______
  - [ ] No user complaints about rate limiting

### **Hour 24: Full Assessment**

- [ ] Run full investigation script
- [ ] Check all metrics:
  - [ ] Stuck analyses: 0
  - [ ] Failed analyses: Check if reasonable
  - [ ] Duplicate prevention working
  - [ ] Rate limiting effective

- [ ] Performance check
  ```sql
  -- Check index usage
  SELECT schemaname, tablename, indexname, idx_scan
  FROM pg_stat_user_indexes
  WHERE tablename IN ('resume_uploads', 'resume_analyses')
  ORDER BY idx_scan DESC;
  ```

- [ ] User feedback
  - [ ] No complaints about stuck analyses
  - [ ] No complaints about rate limiting (unless abusing)
  - [ ] Timeout messages clear and helpful

---

## 🔄 Rollback Plan (If Needed)

### **If Migration Fails**

- [ ] Run rollback SQL
  ```sql
  -- Remove NOT NULL constraint
  ALTER TABLE resume_analyses ALTER COLUMN upload_id DROP NOT NULL;
  
  -- Remove unique constraint
  ALTER TABLE resume_uploads DROP CONSTRAINT IF EXISTS unique_user_resume_hash;
  
  -- Drop new indexes
  DROP INDEX IF EXISTS idx_resume_analyses_upload_id;
  DROP INDEX IF EXISTS idx_resume_uploads_user_composite;
  
  -- Drop new column
  ALTER TABLE resume_analyses DROP COLUMN IF EXISTS n8n_response;
  ```

### **If Code Deployment Fails**

- [ ] Revert in Vercel Dashboard
  - [ ] Go to Deployments
  - [ ] Find previous working deployment
  - [ ] Click "Promote to Production"

- [ ] Or via Git
  ```bash
  git revert HEAD
  git push origin main
  ```

### **If Edge Function Fails**

- [ ] Redeploy previous version
  ```bash
  # Check function history in Supabase Dashboard
  # Redeploy specific version if needed
  ```

---

## ✅ Success Criteria

**Deployment is successful if:**

- [x] Migration applied without errors
- [x] No null upload_ids in database
- [x] Unique constraint preventing duplicates
- [x] Rate limiting returning 429 after limit
- [x] Edge function timeout working (30s)
- [x] No increase in error rates
- [x] Stuck analyses count near zero
- [x] All tests passing

**If all checked, Phase 1 deployment is SUCCESSFUL! 🎉**

---

## 📞 Emergency Contacts

**If issues arise:**

1. **Check logs first**
   - Vercel: `vercel logs --follow`
   - Supabase: Dashboard > Logs

2. **Run investigation script**
   - Identify current state
   - Compare with pre-deployment notes

3. **Rollback if needed**
   - Use rollback plan above
   - Document what went wrong

4. **Review documentation**
   - `docs/PHASE_1_DEPLOYMENT_GUIDE.md`
   - `docs/PHASE_1_FINAL_SUMMARY.md`

---

## 📝 Deployment Notes

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Deployment Time**: _______________ (start) to _______________ (end)  
**Issues Encountered**: 

_______________________________________________
_______________________________________________
_______________________________________________

**Resolution**: 

_______________________________________________
_______________________________________________
_______________________________________________

**Final Status**: ⬜ Success  ⬜ Partial  ⬜ Rolled Back

---

**Estimated Total Time**: 45-60 minutes  
**Recommended Window**: Off-peak hours  
**Risk Level**: Low (additive changes, rollback available)

**Good luck with the deployment! 🚀**
