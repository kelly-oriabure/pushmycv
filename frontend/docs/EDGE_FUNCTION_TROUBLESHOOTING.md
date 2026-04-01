# Edge Function Not Triggering - Troubleshooting Guide

**Issue**: The `resume-analysis` edge function is not being triggered when resumes are uploaded.

---

## 🔍 Diagnostic Steps

### **Step 1: Check if Edge Function Exists**

```bash
# List all edge functions
supabase functions list --project-ref embugkjoeyfukdotmgyg
```

**Expected**: Should show `resume-analysis` function

---

### **Step 2: Check Edge Function Logs**

```bash
# View recent logs
supabase functions logs resume-analysis --project-ref embugkjoeyfukdotmgyg --limit 50
```

**What to look for**:
- Are there any logs at all? (If no, function isn't being called)
- Are there errors in the logs?
- Is the webhook URL being called?

---

### **Step 3: Check Database - Are Analyses Being Created?**

Run this in **Supabase SQL Editor**:

```sql
-- Check recent analyses
SELECT 
    id,
    upload_id,
    status,
    error_message,
    created_at,
    updated_at
FROM resume_analyses
ORDER BY created_at DESC
LIMIT 10;

-- Check if any are stuck in processing
SELECT 
    COUNT(*) as stuck_count,
    status
FROM resume_analyses
WHERE status = 'processing'
    AND created_at < NOW() - INTERVAL '5 minutes'
GROUP BY status;
```

**What to look for**:
- Are analysis records being created at all?
- Are they stuck in 'processing' status?
- Are there error messages?

---

### **Step 4: Check Resume Uploads**

```sql
-- Check recent uploads
SELECT 
    id,
    user_id,
    file_name,
    created_at
FROM resume_uploads
ORDER BY created_at DESC
LIMIT 10;
```

**What to look for**:
- Are uploads being created successfully?
- Do they have IDs that should trigger analysis?

---

### **Step 5: Test Edge Function Directly**

```bash
# Test the edge function directly with curl
curl -X POST https://embugkjoeyfukdotmgyg.supabase.co/functions/v1/resume-analysis \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeUploadId": "test-upload-id",
    "userId": "test-user",
    "jobTitle": "Test Job"
  }'
```

**Expected**: Should return error about upload not found (but proves function is callable)

---

### **Step 6: Check Application Logs**

Look for these log messages in your Next.js application:

```
[analysis][create] Invoking resume-analysis
[analysis][create] Edge function responded
[analysis][create] startResumeAnalysis error:
```

**In Vercel**:
```bash
vercel logs --follow
```

**Locally**:
Check your terminal where Next.js is running

---

## 🐛 Common Issues & Solutions

### **Issue 1: Edge Function Not Deployed**

**Symptom**: No logs, function doesn't exist in list

**Solution**:
```bash
supabase functions deploy resume-analysis --project-ref embugkjoeyfukdotmgyg
```

---

### **Issue 2: Wrong Supabase Client**

**Symptom**: Logs show "Function not found" or authentication errors

**Check**: Are you using the correct Supabase client?

In your routes, you should see:
```typescript
const supabase = await getSupabaseServerClient();
// or
const supabase = createClient(supabaseUrl, supabaseKey);
```

**Verify the URL**:
```typescript
// Should be:
const supabaseUrl = "https://embugkjoeyfukdotmgyg.supabase.co";
```

---

### **Issue 3: Missing Service Role Key**

**Symptom**: Edge function can't access database

**Check `.env.local`**:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Get the key**:
1. Go to Supabase Dashboard
2. Settings > API
3. Copy "service_role" key (secret)

---

### **Issue 4: Edge Function Timing Out**

**Symptom**: Logs show timeout errors

**Check**:
- Is n8n webhook responding?
- Is the 30-second timeout too short?

**Test n8n directly**:
```bash
curl -X POST https://agents.flowsyntax.com/webhook/ff6d33b5-6184-4814-a945-efb3c5ac1052 \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "test",
    "resumeUploadId": "test",
    "userId": "test"
  }'
```

---

### **Issue 5: Function Called But Not Executing**

**Symptom**: Logs show function called but no webhook logs

**Check the edge function code**:
```bash
# Get the deployed function
supabase functions download resume-analysis --project-ref embugkjoeyfukdotmgyg
```

**Verify**:
- Is the webhook URL correct?
- Is the payload being built correctly?

---

### **Issue 6: CORS Issues**

**Symptom**: Browser console shows CORS errors

**Solution**: Edge function already has CORS headers, but check if they're being returned:

```typescript
// In edge function
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}
```

---

## 🔧 Quick Fixes to Try

### **Fix 1: Redeploy Edge Function**

```bash
cd supabase/functions/resume-analysis
supabase functions deploy resume-analysis --project-ref embugkjoeyfukdotmgyg
```

---

### **Fix 2: Check Environment Variables**

```bash
# In Supabase Dashboard
# Settings > Edge Functions > Environment Variables

# Should have:
N8N_WEBHOOK_URL=https://agents.flowsyntax.com/webhook/ff6d33b5-6184-4814-a945-efb3c5ac1052
```

---

### **Fix 3: Test with Simple Upload**

Create a test script:

```typescript
// test-edge-function.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://embugkjoeyfukdotmgyg.supabase.co',
  'YOUR_ANON_KEY'
);

async function testEdgeFunction() {
  console.log('Testing edge function...');
  
  const { data, error } = await supabase.functions.invoke('resume-analysis', {
    body: {
      resumeUploadId: 'test-id',
      userId: 'test-user',
      jobTitle: 'Test'
    }
  });
  
  console.log('Result:', { data, error });
}

testEdgeFunction();
```

Run:
```bash
npx tsx test-edge-function.ts
```

---

## 📊 Debugging Checklist

Run through this checklist:

- [ ] Edge function exists in Supabase Dashboard
- [ ] Edge function was deployed recently (check version number)
- [ ] Webhook URL is correct in edge function code
- [ ] Service role key is set in `.env.local`
- [ ] Resume uploads are being created in database
- [ ] Application logs show edge function being called
- [ ] Edge function logs show function executing
- [ ] n8n webhook is accessible and responding
- [ ] Database has `resume_analyses` table with correct schema

---

## 🎯 Most Likely Issues

Based on common problems, check these first:

### **1. Edge Function Not Deployed**
```bash
supabase functions deploy resume-analysis --project-ref embugkjoeyfukdotmgyg
```

### **2. Missing Environment Variable**
Check `.env.local` has:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### **3. Wrong Project Reference**
Verify all code uses:
```typescript
const supabaseUrl = "https://embugkjoeyfukdotmgyg.supabase.co";
```

---

## 📞 Get Help

If still not working, gather this information:

1. **Edge function logs** (last 50 lines)
2. **Application logs** (from Vercel or local terminal)
3. **Database query results** (recent analyses and uploads)
4. **Test curl result** (direct edge function call)

Then we can diagnose the specific issue!

---

**Start with Step 1-3 above and let me know what you find!**
