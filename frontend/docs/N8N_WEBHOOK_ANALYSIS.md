# n8n Webhook Configuration Analysis

**Date**: 2025-10-04  
**Status**: ✅ Fixed  
**Issue**: Incorrect webhook URL in edge function

---

## 🔍 Issue Identified

### **Problem**
The `resume-analysis` edge function was using an **incorrect/test webhook URL**:

```typescript
// ❌ OLD (WRONG)
const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL') || 
  'https://agents.flowsyntax.com/webhook-test/e46bc537-c65e-4afd-a900-5e38b4c2e3fe';
```

### **Correct URL**
```
https://agents.flowsyntax.com/webhook/ff6d33b5-6184-4814-a945-efb3c5ac1052
```

**Key Difference**: 
- ❌ Old: `/webhook-test/e46bc537-...` (test endpoint)
- ✅ New: `/webhook/ff6d33b5-...` (production endpoint)

---

## ✅ Fix Applied

### **Updated Code**
```typescript
// ✅ NEW (CORRECT)
const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL') || 
  'https://agents.flowsyntax.com/webhook/ff6d33b5-6184-4814-a945-efb3c5ac1052';
```

**File**: `supabase/functions/resume-analysis/index.ts` (line 129)

---

## 📋 Edge Function Review

### **Current Implementation Status**

✅ **Correct Features**:
1. ✅ 30-second timeout mechanism (AbortController)
2. ✅ Proper error handling for timeouts
3. ✅ Updates database on timeout/failure
4. ✅ Returns HTTP 504 for timeouts
5. ✅ Idempotency-Key header for deduplication
6. ✅ Comprehensive logging
7. ✅ CORS headers configured
8. ✅ Backward compatibility (supports both `resumeUploadId` and `analysisId`)

✅ **Webhook Payload Structure**:
```typescript
{
  analysisId: "uuid",
  resumeUploadId: "uuid" | null,
  resumeUrl: "https://...",
  pdfUrl: "https://...",
  jobTitle: "General",
  userId: "uuid" | "anonymous",
  timestamp: "2025-10-04T01:00:00.000Z"
}
```

---

## 🔧 Configuration Options

### **Environment Variable (Recommended)**

Set the `N8N_WEBHOOK_URL` environment variable in Supabase:

```bash
# Via Supabase Dashboard
# Settings > Edge Functions > Environment Variables
N8N_WEBHOOK_URL=https://agents.flowsyntax.com/webhook/ff6d33b5-6184-4814-a945-efb3c5ac1052
```

**Benefits**:
- Easy to update without redeploying
- Can use different URLs for staging/production
- Keeps sensitive URLs out of code

### **Fallback URL (Current)**

If environment variable is not set, uses the hardcoded fallback:
```
https://agents.flowsyntax.com/webhook/ff6d33b5-6184-4814-a945-efb3c5ac1052
```

---

## 🚀 Deployment Required

### **To Apply This Fix**

```bash
# Deploy the updated edge function
supabase functions deploy resume-analysis
```

### **Verification Steps**

1. **Check deployment**:
   ```bash
   # View function logs
   supabase functions logs resume-analysis --limit 50
   ```

2. **Test webhook call**:
   ```bash
   # Trigger an analysis and check logs
   # Should see: "Calling n8n webhook with payload: ..."
   # URL should be: https://agents.flowsyntax.com/webhook/ff6d33b5-...
   ```

3. **Verify n8n receives requests**:
   - Check n8n workflow execution history
   - Verify webhook is being called with correct payload

---

## 📊 Expected Webhook Behavior

### **Success Flow**
```
1. Edge function receives request
   ↓
2. Creates/updates analysis record (status: 'processing')
   ↓
3. Calls n8n webhook with 30s timeout
   ↓
4. n8n processes resume and returns scores
   ↓
5. Edge function returns success response
   ↓
6. n8n callback updates analysis with scores (via separate endpoint)
```

### **Timeout Flow**
```
1. Edge function receives request
   ↓
2. Creates/updates analysis record (status: 'processing')
   ↓
3. Calls n8n webhook
   ↓
4. 30 seconds pass without response
   ↓
5. AbortController cancels request
   ↓
6. Edge function updates analysis (status: 'failed', error: 'timeout')
   ↓
7. Returns HTTP 504 with user-friendly message
```

### **Failure Flow**
```
1. Edge function receives request
   ↓
2. Creates/updates analysis record (status: 'processing')
   ↓
3. Calls n8n webhook
   ↓
4. n8n returns non-200 status
   ↓
5. Edge function updates analysis (status: 'failed')
   ↓
6. Returns HTTP 500 with error details
```

---

## 🔍 Potential Issues to Monitor

### **1. Webhook Response Time**
- **Current timeout**: 30 seconds
- **Monitor**: Check if analyses are timing out frequently
- **Action**: If >10% timeout, consider increasing to 45-60 seconds

### **2. n8n Availability**
- **Issue**: If n8n is down, all analyses will fail
- **Monitor**: Track failure rate
- **Action**: Consider implementing retry logic or queue system

### **3. Payload Compatibility**
- **Issue**: n8n expects specific payload structure
- **Monitor**: Check n8n logs for parsing errors
- **Action**: Ensure payload matches n8n workflow expectations

### **4. Callback Mechanism**
- **Issue**: n8n needs to call back to update scores
- **Monitor**: Check if analyses stay in 'processing' after webhook succeeds
- **Action**: Verify callback endpoint is accessible

---

## 📝 n8n Workflow Requirements

### **Expected Payload Fields**
```typescript
{
  analysisId: string;        // Required: For updating database
  resumeUploadId: string;    // Optional: For reference
  resumeUrl: string;         // Required: URL to resume image/PDF
  pdfUrl: string;           // Optional: URL to original PDF
  jobTitle: string;         // Optional: Job title for context
  userId: string;           // Optional: User ID for tracking
  timestamp: string;        // Optional: Request timestamp
}
```

### **Expected Response**
n8n should return a JSON response (even if just acknowledgment):
```json
{
  "success": true,
  "message": "Analysis queued",
  "analysisId": "uuid"
}
```

### **Callback Endpoint**
n8n should call back to update scores:
```
POST /api/resume-analysis-callback
or
POST to Supabase directly to update resume_analyses table
```

---

## ✅ Checklist for Production

- [x] Correct webhook URL updated in edge function
- [x] 30-second timeout implemented
- [x] Error handling for timeouts
- [x] Database updates on failure/timeout
- [x] Idempotency-Key header included
- [ ] **Deploy edge function** (`supabase functions deploy resume-analysis`)
- [ ] **Set N8N_WEBHOOK_URL environment variable** (optional but recommended)
- [ ] **Test end-to-end flow** (upload → analysis → scores)
- [ ] **Monitor n8n workflow** (check execution history)
- [ ] **Verify callback mechanism** (scores are updated in database)

---

## 🎯 Next Steps

### **Immediate (After Deployment)**
1. Deploy edge function with corrected URL
2. Test with a real resume upload
3. Monitor n8n workflow execution
4. Verify scores are returned and saved

### **Optional Improvements**
1. Set `N8N_WEBHOOK_URL` environment variable in Supabase
2. Add retry logic for transient failures
3. Implement queue system for high volume
4. Add monitoring/alerting for webhook failures
5. Create dashboard for analysis success rate

---

## 📞 Troubleshooting

### **Issue: Analyses still timing out**
**Check**:
1. Is n8n workflow running?
2. Is webhook URL accessible from Supabase?
3. Is n8n processing taking >30 seconds?

**Solution**:
- Check n8n workflow logs
- Increase timeout if needed
- Optimize n8n workflow performance

### **Issue: Webhook returns 404**
**Check**:
1. Is webhook URL correct?
2. Is n8n workflow published/active?

**Solution**:
- Verify URL in n8n dashboard
- Ensure workflow is active

### **Issue: Scores not updating**
**Check**:
1. Is n8n calling back successfully?
2. Is callback endpoint working?
3. Are scores being parsed correctly?

**Solution**:
- Check n8n callback logs
- Verify callback endpoint exists
- Test callback endpoint manually

---

## 📚 Related Documentation

- `supabase/functions/resume-analysis/README.md` - Edge function documentation
- `docs/PHASE_1_FINAL_SUMMARY.md` - Phase 1 completion summary
- `docs/DEPLOYMENT_CHECKLIST.md` - Deployment checklist

---

**Status**: Ready for deployment  
**Risk**: Low (URL change only)  
**Testing**: Required after deployment
