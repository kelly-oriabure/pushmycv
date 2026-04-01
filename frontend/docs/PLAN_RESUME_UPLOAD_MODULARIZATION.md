# Resume Upload Modularization Plan

## Overview
Goal: Make resume PDF upload, text extraction, duplicate detection, and preview-image generation reusable across the app. The preview image is generated from the uploaded PDF (no separate image upload from client).

## Scope
- Server modules: text extraction, duplicate detection, storage adapter, repositories, orchestrator service.
- Routes: thin adapters calling the orchestrator.
- Client: reusable components and a hook for uploads.
- Tests, DB safeguards, and documentation.

## Milestones
- [ ] M0: Stabilize duplicate detection foundation (pre-req)
- [ ] M1: Shared types and folder scaffolding
- [ ] M2: Text extraction module
- [ ] M3: Duplicate detection module
- [ ] M4: Storage adapter and repository layer
- [ ] M5: Orchestrator service (processPdfUpload)
- [ ] M6: Refactor API routes to service
- [ ] M7: Client modularization (components + hooks)
- [ ] M8: Tests (unit + integration)
- [ ] M9: Optional DB index + data cleanup
- [ ] M10: Documentation updates

---

## M0 — Stabilize Duplicate Detection (Pre-req)
- [ ] Fix exact duplicate Tier 1 to avoid `.single()`; use `.limit(1)` and pick first.
- [ ] Fix partial match Tier 2 to not use `.neq('content_hash', ...)`; compare in code to handle NULLs.
- [ ] Normalize update signature to accept `string | null` for `content_hash` and `composite_hash`.
- [ ] Smoke tests on both routes: no new row for exact duplicate uploads.

Deliverables:
- Verified log output and behavior in `app/api/resume-score/upload/route.ts` and `app/api/upload-to-supabase-analyses/route.ts`.

---

## M1 — Shared Types and Structure
Create central types to avoid drift.

Files:
- `app/lib/types/resume.ts`
  - [ ] `ExtractedContactInfo`
  - [ ] `PdfTextExtractionResult`
  - [ ] `DuplicateDetectionResult`
  - [ ] `ResumeUploadCreateInput`
  - [ ] `ResumeUploadUpdateInput`
  - [ ] `ProcessUploadParams` / `ProcessUploadResult`

Acceptance:
- [ ] Routes and services import these, not ad-hoc types.

---

## M2 — Text Extraction Module
Split and re-export existing `pdfTextExtractor.ts`.

Files:
- `app/lib/text-extraction/pdf.ts`
  - [ ] `extractTextFromPdf(buffer: Buffer): PdfTextExtractionResult`
- `app/lib/text-extraction/contact.ts`
  - [ ] `extractEmails(text)`, `extractPhones(text)`, `getPrimaryContact(contactInfo)`
- `app/lib/text-extraction/hashing.ts`
  - [ ] `generateContentHash(text)`, `generateEmailHash(...)`, `generatePhoneHash(...)`, `generateCompositeHash(...)`
- `app/lib/text-extraction/index.ts`
  - [ ] Barrel export

Acceptance:
- [ ] `app/api/*` uses new exports; `server-only` stays where required.

---

## M3 — Duplicate Detection Module
Move logic into dedicated folder.

Files:
- `app/lib/duplicates/detection.ts`
  - [ ] `detectDuplicateResume(supabase, extractedData, userId)`
  - [ ] `extractJobTitle(text)`
- `app/lib/duplicates/update.ts`
  - [ ] `updateExistingResume(supabase, id, data)`
- `app/lib/duplicates/index.ts`
  - [ ] Barrel export

Acceptance:
- [ ] All imports updated to new paths; hash null normalization preserved.

---

## M4 — Storage Adapter and Repository Layer
Abstract storage and DB operations.

Files:
- `app/lib/storage/supabaseStorage.ts`
  - [ ] `uploadPublicFile(bucket, path, bytes, contentType, upsert=false)`
  - [ ] `getPublicUrl(bucket, path): string`
  - [ ] `removeFiles(bucket, paths: string[])`
- `app/lib/repositories/resumeUploadsRepo.ts`
  - [ ] `createResumeUpload(supabase, payload)`
  - [ ] `updateResumeUpload(supabase, id, payload)`
  - [ ] `findByCompositeHash(supabase, userId, compositeHash)`
  - [ ] `findByEmailPhone(supabase, userId, emailHash, phoneHash)`

Acceptance:
- [ ] Routes/services do not use raw storage or table calls directly.

---

## M5 — Orchestrator Service (Server)
Single entry point to process a PDF upload end-to-end.

Files:
- `app/lib/services/resumeUploadService.ts`
  - [ ] `processPdfUpload(params: ProcessUploadParams): Promise<ProcessUploadResult>`
  - Steps:
    - Extract text and hashes
    - `detectDuplicateResume`
    - If duplicate → return existing record metadata; no storage writes
    - If update/create:
      - Generate preview from PDF (see M5b)
      - Upload preview image (path: `resume-images/${userId}/${uuid}.png`)
      - Optionally upload PDF (path: `resume-pdfs/${userId}/${uuid}.pdf`)
      - Update or create DB record via repository

M5b — PDF preview generator
- `app/lib/pdf-preview/generate.ts`
  - [ ] `generatePreviewFromPdf(buffer, options?): Promise<{ bytes: Buffer; contentType: string }>`
  - Note: Implement renderer now or stub with TODO; keep signature stable.

Acceptance:
- [ ] Returns `{ action, uploadId, imageUrl, pdfUrl, message, extractedData }`
- [ ] No side-effects on exact duplicates.

---

## M6 — Refactor API Routes to Orchestrator
Make routes thin.

Files:
- `app/api/upload-to-supabase-analyses/route.ts`
  - [ ] Parse formData; get `userId` and PDF `File`
  - [ ] Read to ArrayBuffer
  - [ ] Call `resumeUploadService.processPdfUpload(...)`
  - [ ] Return JSON (+ CORS headers where required)
- `app/api/resume-score/upload/route.ts`
  - [ ] Same pattern, using authenticated `user.id`

Acceptance:
- [ ] Minimal logic remains in routes; business logic resides in services.

---

## M7 — Client Modularization (Resume Analysis Upload Page)
Align client to server design (PDF only).

Structure under `app/features/resume-upload/`:
- components/
  - [ ] `FileDropzone.tsx` (PDF-only)
  - [ ] `UploadButton.tsx`
  - [ ] `UploadProgress.tsx`
  - [ ] `DuplicateNotice.tsx`
  - [ ] `UploadResultCard.tsx`
- hooks/
  - [ ] `useResumeUpload.ts` with `startUpload(file: File)`
- services/
  - [ ] `resumeUploadClient.ts` wrapper around fetch

Refactor:
- `app/(protected)/resume-analysis-upload/page.tsx`
  - [ ] Use hook + components; no business logic in page.

Acceptance:
- [ ] Page orchestrates UI only; uploads PDFs (no image uploads).

---

## M8 — Tests
Place under `/tests` mirroring modules.

- `tests/lib/text-extraction/pdf.test.ts`
  - [ ] Expected: valid extraction on sample
  - [ ] Edge: empty/unreadable PDF
  - [ ] Failure: thrown error returns safe result
- `tests/lib/duplicates/detection.test.ts`
  - [ ] Exact duplicate
  - [ ] Partial same title → duplicate
  - [ ] Partial diff title → update
  - [ ] No match → create
- `tests/lib/services/resumeUploadService.test.ts`
  - [ ] Duplicate path does not call storage
  - [ ] Update path calls storage and updates record
  - [ ] Create path calls storage and inserts record

Acceptance:
- [ ] All tests pass locally.

---

## M9 — Optional DB Safeguards and Data Cleanup
- [ ] Add unique index for exact duplicates:
  - `CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_composite ON resume_uploads(user_id, composite_hash) WHERE composite_hash IS NOT NULL;`
- [ ] Backfill: convert `''` hashes to `NULL` to align semantics.

Acceptance:
- [ ] Index applied after resolving conflicts.
- [ ] Hash columns normalized.

---

## M10 — Documentation
- [ ] Update `README.md`: using the service and routes
- [ ] Document public APIs in `app/lib/services/resumeUploadService.ts`
- [ ] Troubleshooting for duplicates and PDF parsing
- [ ] Update `TASK_LIST.md`/`TASK.md` progress entries

---

## Deliverables and Acceptance Criteria
- Reusability: Any server route can call `processPdfUpload()` with `supabase`, `userId`, and a PDF buffer.
- Consistency: Duplicate detection identical across routes.
- Efficiency: No storage writes for exact duplicates.
- Test coverage: Expected, edge, and failure tests per module.
- Docs: Clear usage and troubleshooting.

---

## Impacted Files (indicative)
- New:
  - `app/lib/types/resume.ts`
  - `app/lib/text-extraction/*`
  - `app/lib/duplicates/*`
  - `app/lib/storage/supabaseStorage.ts`
  - `app/lib/repositories/resumeUploadsRepo.ts`
  - `app/lib/pdf-preview/generate.ts`
  - `app/lib/services/resumeUploadService.ts`
  - `tests/lib/**`
- Modified:
  - `app/api/upload-to-supabase-analyses/route.ts`
  - `app/api/resume-score/upload/route.ts`
  - `README.md`, `TASK_LIST.md` or `TASK.md`

---

## Notes
- Keep each file under 500 LOC and split per feature boundaries.
- Use shared types to avoid `string` vs `string|null` divergence.
- Prefer DI for `SupabaseClient` to keep services testable.
