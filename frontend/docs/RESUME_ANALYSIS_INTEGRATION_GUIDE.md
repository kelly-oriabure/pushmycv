# Resume Analysis Integration Guide

This guide explains how the modularized Resume Analysis pipeline works and how to use it across your application: API routes, services, background jobs, and admin tools. It documents the core modules, request/response contracts, environment requirements, and troubleshooting steps.

---

## Architecture Overview

- __Storage__
  - Bucket: `resume-analyses`
    - Images: `resume-images/<user_id>/<uuid>.png`
    - PDFs: `resume-pdfs/<user_id>/<uuid>.pdf`
- __Database__
  - Table: `resume_uploads` (source records)
  - Table: `resume_analyses` (processing jobs/results)
- __Server modules__ (Next.js server only)
  - Orchestrator: `app/lib/services/resumeUploadService.ts`
  - Text Extraction Adapter: `app/lib/text-extraction/pdf.ts` (re-exports `app/lib/pdfTextExtractor.ts`)
  - Duplicate Detection Adapter: `app/lib/duplicates/detection.ts` (re-exports `app/lib/duplicateDetection.ts`)
  - Repository: `app/lib/repositories/resumeUploadsRepo.ts`
  - Edge Function wrapper: `app/lib/edge/resumeAnalysis.ts`
  - Generic Edge invoker: `app/lib/edge/invokeEdgeFunction.ts`
- __Edge Function__
  - `supabase/functions/resume-analysis/index.ts`
  - Triggers downstream analysis via n8n webhook and updates `resume_analyses` records

---

## Key Modules and Contracts

### 1) Orchestrator: `processPdfUpload()`
- Path: `app/lib/services/resumeUploadService.ts`
- Purpose: Given PDF bytes, extract text + contact info + hashes, then run duplicate detection. Returns a normalized decision + data.
- Signature (inferred from code):
  - Input:
    - `supabase: SupabaseClient`
    - `userId: string`
    - `pdf: { bytes: ArrayBuffer | Buffer; name: string; size: number; type: 'application/pdf' }`
  - Output:
    - `action: 'create' | 'update' | 'duplicate'`
    - `uploadId?: string` (if existing)
    - `imageUrl?: string`
    - `pdfUrl?: string`
    - `message: string`
    - `extractedData: { fullText: string; contentHash: string | null; emailHash?: string | null; phoneHash?: string | null; compositeHash: string | null; emails: string[]; phones: string[]; primaryEmail: string | null; primaryPhone: string | null; textLength: number }`
- Uses:
  - `extractTextFromPdf(buffer)` and `getPrimaryContact(contactInfo)` from `app/lib/text-extraction/pdf.ts`
  - `detectDuplicateResume(supabase, hashes, userId)` from `app/lib/duplicates/detection.ts`

### 2) Repository: `resume_uploads`
- Path: `app/lib/repositories/resumeUploadsRepo.ts`
- Methods:
  - `createResumeUpload(supabase, payload)` → `{ data?: { id: string }, error?: string, code?: string }`
  - `updateResumeUpload(supabase, id, payload)` → `{ success: boolean; error?: string }`
- Keep all DB I/O here to centralize schema interaction.

### 3) Edge Function wrapper: `startResumeAnalysis()`
- Path: `app/lib/edge/resumeAnalysis.ts`
- Purpose: Start analysis by calling the Supabase Edge Function `resume-analysis` with unified headers and idempotency.
- Request type:
  - `{ resumeUploadId?: string; analysisId?: string; jobTitle?: string; userId?: string; resumeUrl?: string; pdfUrl?: string }`
  - Note: Either `resumeUploadId` (preferred) or `analysisId` is required.
- Response type:
  - `{ success: boolean; analysisId: string; resumeUploadId: string | null; message: string; webhookResponse?: unknown }`
- Behavior:
  - Ensures `Idempotency-Key` header is present (uploadId or analysisId)
  - Delegates to `invokeEdgeFunction()`

### 4) Generic Edge invoker: `invokeEdgeFunction()`
- Path: `app/lib/edge/invokeEdgeFunction.ts`
- Purpose: Common wrapper for any Supabase Edge Function.
- Options: `{ headers?: Record<string, string>; timeoutMs?: number }`
- Error handling: Logs `{ name, message, status, context }` and throws a descriptive error on failure; includes `timeout` protection.

### 5) Edge Function: `supabase/functions/resume-analysis/index.ts`
- Inputs (JSON body):
  - `resumeUploadId?: string` (preferred) OR `analysisId?: string` (legacy)
  - Optional: `resumeUrl`, `pdfUrl`, `jobTitle` (default: "General"), `userId`
- Required headers (gateway + verify_jwt):
  - `Authorization: Bearer <SERVICE_ROLE_OR_ANON_KEY>`
  - `apikey: <same key>`
  - `Content-Type: application/json`
  - `Idempotency-Key: <resumeUploadId or analysisId>` (for downstream dedupe)
- Behavior:
  - If `resumeUploadId` given:
    - Fetches `resume_uploads` row; if missing → 404
    - Reuses existing `resume_analyses` for that upload if present; otherwise inserts a new one with status `processing`
  - If only `analysisId` given: updates that analysis to `processing`
  - Calls n8n via `N8N_WEBHOOK_URL`; on non-OK → updates analysis to `failed`
  - Returns `{ success, analysisId, resumeUploadId, message, webhookResponse }`

---

## Reference Implementation (Upload Route)

- Path: `app/api/resume-score/upload/route.ts`
- Flow summary:
  1. Parse form data: `file` (image) and optional `originalPdf` (application/pdf)
  2. Upload image to storage and get public URL
  3. If `originalPdf` present:
     - Upload PDF to storage, extract text via orchestrator `processPdfUpload()`
     - Compute hashes and run duplicate detection
  4. Dedup outcomes:
     - `duplicate`: return existing upload info and best-effort call `startResumeAnalysis()` on the existing ID
     - `update`: update existing `resume_uploads` row, then call `startResumeAnalysis()`
     - `create`: insert a new `resume_uploads` row, then call `startResumeAnalysis()`
  5. Logs include rich diagnostics and a direct HTTP fallback to the functions URL if SDK invocation fails

- Important log markers:
  - `[analysis][create|update|duplicate] Invoking resume-analysis { uploadId, hasServiceRole }`
  - `[analysis][...] Edge function responded { analysisId }`
  - On errors: `[analysis][...] startResumeAnalysis error: ...` and fallback `status/body`

---

## How to Use the Modules Anywhere

### A) Trigger analysis from any server route or server action
```ts
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { startResumeAnalysis } from '@/app/lib/edge/resumeAnalysis';

const supabase = await getSupabaseServerClient();
await startResumeAnalysis(supabase, {
  resumeUploadId: uploadId,
  userId,
  jobTitle: 'Software Developer',
}, {
  headers: {
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    'Content-Type': 'application/json',
  },
});
```

### B) Process a raw PDF (extraction + duplicate decision)
```ts
import { processPdfUpload } from '@/app/lib/services/resumeUploadService';

const result = await processPdfUpload({
  supabase,
  userId,
  pdf: {
    bytes: arrayBufferOrBuffer,
    name: 'cv.pdf',
    size: arrayBufferOrBuffer.byteLength,
    type: 'application/pdf',
  },
});

if (result.action === 'create') { /* insert new row */ }
if (result.action === 'update') { /* update existing row */ }
if (result.action === 'duplicate') { /* reuse existing uploadId */ }
```

### C) CRUD on `resume_uploads` from any server context
```ts
import { createResumeUpload, updateResumeUpload } from '@/app/lib/repositories/resumeUploadsRepo';

const { data, error } = await createResumeUpload(supabase, {
  user_id,
  file_path,
  file_name,
  file_type,
  file_size,
  resume_url,
  pdf_url,
  content_hash,
  email_hash,
  phone_hash,
  composite_hash,
  extracted_email,
  extracted_phone,
  extracted_text,
});

if (data) {
  await updateResumeUpload(supabase, data.id, { /* fields */ });
}
```

### D) Call any Edge Function uniformly
```ts
import { invokeEdgeFunction } from '@/app/lib/edge/invokeEdgeFunction';

await invokeEdgeFunction(supabase, 'some-function', { foo: 'bar' }, {
  headers: {
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    'Idempotency-Key': 'unique-key',
  },
  timeoutMs: 30000,
});
```

### E) Client components
- Do not call the Edge Function directly from the browser (never expose service-role keys).
- Instead, post to your internal API route that calls `startResumeAnalysis()` on the server.

### F) Batch/backfill/cron
- Iterate over `resume_uploads` lacking a matching `resume_analyses` record and call `startResumeAnalysis()` per upload.
- Use the built-in idempotency so downstream (n8n) deduplicates retries.

### G) Auto-trigger on read (optional pattern)
- In a status/read route: if no analysis exists yet for a given upload, best-effort call `startResumeAnalysis()` and return pending. This keeps the UX resilient.

---

## Standard REST API Endpoints

This section defines a versioned REST surface that maps to current modules and routes under `app/api/resume-score/`. You can create `app/api/v1/*` routes that forward to the existing handlers or extract the shared logic into reusable handler functions.

### Endpoint set

- __POST `/api/v1/resumes`__
  - Purpose: Upload preview image + optional original PDF, dedupe, create/update `resume_uploads`, and trigger analysis.
  - Maps to: `app/api/resume-score/upload/route.ts`
  - Auth: User JWT required via `supabase.auth.getUser()`.
  - Content-Type: `multipart/form-data` (fields: `file`, optional `originalPdf`, optional `jobTitle`).
  - Idempotency: Accept optional `Idempotency-Key` header (client-provided). You already propagate an idempotency key to the Edge Function; consider storing request hash + key at the API layer (see Idempotency).
  - Rate limit: 10 requests/min/user.

- __POST `/api/v1/analyses`__
  - Purpose: Trigger analysis for an existing `resume_uploads` row (re-runs/backfills).
  - Body: `{ resumeUploadId: string, jobTitle?: string }`
  - Calls: `startResumeAnalysis()` from `app/lib/edge/resumeAnalysis.ts`.
  - Auth: User JWT required; verify `upload.user_id === user.id`.
  - Idempotency: Require/forward `Idempotency-Key: <resumeUploadId>`.
  - Rate limit: 30 requests/min/user.

- __GET `/api/v1/analyses/{id}`__
  - Purpose: Get combined upload + analysis view for a given upload ID.
  - Maps to: `app/api/resume-score/analysis/[id]/route.ts`.
  - Auth: User JWT required; row-level ownership check.
  - Rate limit: 60 requests/min/user.

- __GET `/api/v1/analyses/{id}/status`__
  - Purpose: Fetch status by analysis ID or upload ID.
  - Maps to: `app/api/resume-score/status/[id]/route.ts`.
  - Auth: User JWT required; row-level ownership check.
  - Rate limit: 120 requests/min/user.

- __GET `/api/v1/resumes`__ (optional)
  - Purpose: List uploads for the current user (with pagination).
  - Auth: User JWT required; row-level filter (`user_id`).
  - Rate limit: 30 requests/min/user.

- __DELETE `/api/v1/resumes/{id}`__ (optional)
  - Purpose: Delete an upload (and optionally related analysis + storage files).
  - Auth: User JWT required; ownership check.
  - Rate limit: 5 requests/min/user.

- __GET `/api/v1/health`__ (optional)
  - Purpose: Basic health check (no auth).
  - Rate limit: 60 requests/min/IP.

### Versioning and wiring

- Keep current handlers but add versioned routes as entry points:
  - `app/api/v1/resumes/route.ts` → forward to or import logic from `resume-score/upload`.
  - `app/api/v1/analyses/route.ts` → validate auth and call `startResumeAnalysis()`.
  - `app/api/v1/analyses/[id]/route.ts` → reuse logic from `analysis/[id]`.
  - `app/api/v1/analyses/[id]/status/route.ts` → reuse logic from `status/[id]`.
- Tip: Extract reusable code from `app/api/resume-score/upload/route.ts` into a shared handler module so versioned routes can import it.

### Authorization

- __User endpoints__ (all above except health):
  - In each handler call `getSupabaseServerClient()` then `supabase.auth.getUser()`.
  - 401 if no user; 403 if resource `user_id` doesn’t match `user.id`.
  - Always filter DB by `user.id` (as in `status` and `analysis` routes).

- __Service-to-service (internal)__ (if needed):
  - Require `X-API-Key: <INTERNAL_API_KEY>` and compare with `process.env.INTERNAL_API_KEY`.
  - Return 401/403 on mismatch; never echo the expected value.
  - For admin/backfill-only endpoints; not user-facing.

- __Edge Function calls__:
  - Continue sending `Authorization: Bearer <SERVICE_ROLE_KEY>` and `apikey: <SERVICE_ROLE_KEY>` from server only.
  - Never expose service-role keys to the browser.

### Rate limiting

Recommended: Upstash Redis sliding window (production). Dev fallback: in-memory map.

- Suggested budgets:
  - Upload: 10/min/user
  - Trigger analysis: 30/min/user
  - Status: 120/min/user
  - Reads (list/get): 60/min/user
  - Health: 60/min/IP
- Keying: Prefer `user.id`; fall back to IP from `x-forwarded-for`.
- Headers on 429: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`.

Example helper outline:

```ts
// app/lib/rateLimit.ts
// Prod: use @upstash/redis + @upstash/ratelimit. Dev: simple in-memory fallback.

type LimitResult = { ok: boolean; remaining: number; reset: number };

export async function limit(key: string, max: number, windowSec: number): Promise<LimitResult> {
  // Pseudocode: replace with Upstash Ratelimit in prod
  // const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(max, `${windowSec} s`) })
  // const { success, reset, remaining } = await ratelimit.limit(key)
  // return { ok: success, remaining, reset }
  return { ok: true, remaining: max - 1, reset: Date.now() + windowSec * 1000 };
}
```

Use in a route:

```ts
import { NextResponse } from 'next/server';
import { limit } from '@/app/lib/rateLimit';
import { getSupabaseServerClient } from '@/integrations/supabase/server';

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'unknown';
  const key = user?.id ? `u:${user.id}:upload` : `ip:${ip}:upload`;

  const { ok, remaining, reset } = await limit(key, 10, 60);
  if (!ok) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      {
        status: 429,
        headers: {
          'RateLimit-Limit': '10',
          'RateLimit-Remaining': String(Math.max(0, remaining)),
          'RateLimit-Reset': String(Math.ceil(reset / 1000)),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  // proceed...
}
```

Production: replace `limit()` with Upstash Ratelimit:

- Install: `npm i @upstash/redis @upstash/ratelimit`
- Create Redis instance and env vars
- Use `Ratelimit.slidingWindow(max, '60 s')` keyed by `user.id` or IP

### Idempotency

- Accept optional client `Idempotency-Key` on POST endpoints (`/resumes`, `/analyses`).
- Store key + request digest in Redis with short TTL (e.g., 10–15 minutes). Return prior result for repeats.
- You already set an idempotency key for the Edge Function via `startResumeAnalysis()`; keeping idempotency at the API layer prevents duplicate DB writes and downstream calls.

Key structure example:

- `idem:upload:<userId>:<key>` → value holds request digest and resulting `uploadId`.

### Request/Response contracts (summary)

- POST `/api/v1/resumes`
  - Request: multipart form-data `file`, optional `originalPdf`, `jobTitle`.
  - Response: mirrors existing upload route:
    - `{ success, action: 'create'|'update'|'duplicate', uploadId, imageUrl, pdfUrl?, message, extractedData? }`

- POST `/api/v1/analyses`
  - Request: `{ resumeUploadId: string, jobTitle?: string }`
  - Response: `{ success, analysisId, resumeUploadId, message }` (from `app/lib/edge/resumeAnalysis.ts`).

- GET `/api/v1/analyses/{id}`
  - Response: Merge of `resume_uploads` + `resume_analyses` (same as `analysis/[id]`).

- GET `/api/v1/analyses/{id}/status`
  - Response: same shape as `status/[id]` route in `app/api/resume-score/status/[id]/route.ts`.

### OpenAPI updates

- Update `docs/openapi.yaml` with:
  - POST `/api/v1/resumes`
  - POST `/api/v1/analyses`
  - GET `/api/v1/analyses/{id}`
  - GET `/api/v1/analyses/{id}/status`
- Add `429` responses and `RateLimit-*` headers documentation.
- Document `Idempotency-Key` for POST endpoints.

### Security checklist

- Verify `supabase.auth.getUser()` on all user routes; filter SQL by `user.id`.
- Keep service-role keys server-only; never expose to clients.
- For internal admin/webhook endpoints, use `X-API-Key` with constant-time compare; rotate periodically.
- Include auditing logs for analysis triggers: `user.id`, `uploadId`, idempotency key.

### Recommended actions

- Create versioned route files under `app/api/v1/` forwarding to existing logic in `app/api/resume-score/*`.
- Add shared `app/lib/rateLimit.ts` and switch to Upstash in production.
- Add API-layer idempotency storage for POST endpoints.
- Update `docs/openapi.yaml` accordingly.
- Optionally add a `middleware.ts` to apply coarse limits across `/api/v1/*`.

---

## Migration Notes (Legacy → Modular)

- Text extraction now imported from `app/lib/text-extraction/pdf` (adapter re-export of `pdfTextExtractor`)
- Duplicate detection via `app/lib/duplicates/detection` (adapter re-export of `duplicateDetection`)
- DB operations moved into `app/lib/repositories/resumeUploadsRepo`
- Orchestration added via `app/lib/services/resumeUploadService`
- Edge trigger centralized in `app/lib/edge/resumeAnalysis` using `invokeEdgeFunction`

Where possible, copy patterns from `app/api/resume-score/upload/route.ts`:
- __Create__: lines ~512–551
- __Update__: lines ~370–409
- __Duplicate__: lines ~282–323

---

## Environment & Configuration

- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - Required in Next.js server runtime to call Edge Functions with gateway protection
  - Used for both `Authorization` and `apikey` headers
- `SUPABASE_URL`
  - Already configured for Supabase client; required by Edge Function runtime
- `N8N_WEBHOOK_URL`
  - Used by the Edge Function to notify the n8n workflow
- Storage bucket `resume-analyses`
  - Ensure public read for images if needed (`getPublicUrl` is in use); PDFs may be public or restricted per your requirements

Restart the dev server after changing env vars.

---

## Edge Function: Direct cURL Test

```bash
curl -i -X POST 'https://<project-ref>.supabase.co/functions/v1/resume-analysis' \
  -H "Authorization: Bearer <SERVICE_ROLE_OR_ANON_KEY>" \
  -H "apikey: <SERVICE_ROLE_OR_ANON_KEY>" \
  -H 'Content-Type: application/json' \
  -d '{
    "resumeUploadId":"<UPLOAD_UUID>",
    "userId":"<USER_UUID>",
    "jobTitle":"Data Scientist"
  }'
```

Expected responses:
- 200 with `{ success, analysisId, resumeUploadId, message }`
- 400 if `resumeUploadId`/`analysisId` missing
- 404 if upload not found

---

## Troubleshooting

- __No Edge Function logs__
  - Check server logs for `[analysis][...] Invoking resume-analysis` and `hasServiceRole: true`
  - Ensure both headers are sent: `Authorization` and `apikey`
  - Inspect fallback POST response status/body for gateway details
- __400 Missing fields__
  - Provide `resumeUploadId` or `analysisId` in the body
- __404 Upload not found__
  - Ensure the `resume_uploads` row exists in the same project
- __Webhook 5xx__
  - Edge Function marks analysis as `failed` and returns 500; check n8n logs and URL
- __CORS__
  - Edge Function uses shared CORS helper; only server-side should call it with service key

---

## Testing Guidance

- Place tests under `tests/` mirroring structure
  - Unit-test adapters: extraction, duplicate detection
  - Unit-test orchestrator: ensure action selection and data mapping
  - Route tests: upload flow, duplicate/update/create paths
- Include cases:
  - Expected success (new create)
  - Edge case (empty text; no emails/phones)
  - Failure path (PDF upload error, DB error, Edge invocation error)

---

## Appendix: Type Shapes (as used in code)

- Orchestrator input `ProcessUploadParams` (inferred):
```ts
{
  supabase: SupabaseClient;
  userId: string;
  pdf?: {
    bytes: ArrayBuffer | Buffer;
    name: string;
    size: number;
    type: 'application/pdf';
  };
}
```

- Orchestrator output `ProcessUploadResult` (inferred):
```ts
{
  action: 'create' | 'update' | 'duplicate';
  uploadId?: string;
  imageUrl?: string;
  pdfUrl?: string;
  message: string;
  extractedData?: {
    fullText: string;
    contentHash: string | null;
    emailHash?: string | null;
    phoneHash?: string | null;
    compositeHash: string | null;
    primaryEmail: string | null;
    primaryPhone: string | null;
    textLength: number;
    emails: string[];
    phones: string[];
  };
}
```

- Edge Function wrapper request `ResumeAnalysisRequest`:
```ts
{
  resumeUploadId?: string; // preferred
  analysisId?: string;     // legacy
  jobTitle?: string;
  userId?: string;
  resumeUrl?: string;
  pdfUrl?: string;
}
```

- Edge Function wrapper response `ResumeAnalysisResponse`:
```ts
{
  success: boolean;
  analysisId: string;
  resumeUploadId: string | null;
  message: string;
  webhookResponse?: unknown;
}
```
