# JobEazy API Usage Guide (Initial Draft)

This document describes how mobile and other clients can consume the current upload APIs. It also outlines the target production contract and best practices.

- Version: draft (planned: `/api/v1/...`)
- Auth: Supabase JWT (user-scoped)
- Content type: multipart/form-data for file uploads
- Limits: define max PDF size (TBD), whitelist MIME `application/pdf`

## Common

- Authentication: include Supabase access token in `Authorization: Bearer <token>`
- Errors: JSON envelope
```
{
  "success": false,
  "error": { "code": "<CODE>", "message": "<HUMAN_MSG>", "details": "<OPTIONAL>" },
  "meta": { "requestId": "<id>" }
}
```
- Success: JSON envelope
```
{
  "success": true,
  "data": { ... },
  "meta": { "requestId": "<id>" }
}
```

## Endpoint: Resume Upload (current)

- Path: `POST /app/api/resume-score/upload` (Next.js app router)
- Planned: `POST /api/v1/resume-score/upload`
- Content-Type: `multipart/form-data`
- Form fields:
  - `file`: the resume image (PNG/JPG) for preview thumbnail (required)
  - `originalPdf`: the original PDF (optional, recommended)
- Behavior:
  - Uploads preview image and optional PDF to Supabase Storage
  - Extracts text + contact, computes hashes
  - Duplicate detection (create/duplicate/update)
  - Creates/updates `resume_uploads` DB row

### Request example (curl)

```
curl -X POST \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -F file=@preview.png \
  -F originalPdf=@resume.pdf \
  https://<host>/app/api/resume-score/upload
```

### Response example (success)
```
{
  "success": true,
  "isNew": true,
  "uploadId": "<uuid>",
  "imageUrl": "https://.../resume-analyses/.../preview.png",
  "pdfUrl": "https://.../resume-analyses/.../resume.pdf",
  "message": "New resume record created successfully",
  "extractedData": {
    "hasText": true,
    "emailCount": 1,
    "phoneCount": 0,
    "primaryEmail": "john@example.com",
    "primaryPhone": null,
    "contentHash": "..."
  }
}
```

### Response example (duplicate)
```
{
  "success": true,
  "isDuplicate": true,
  "action": "duplicate",
  "message": "Duplicate detected",
  "existing": { "id": "..." }
}
```

### Failure example
```
{
  "success": false,
  "error": {
    "code": "UPLOAD_VALIDATION_FAILED",
    "message": "File type not allowed",
    "details": "Only application/pdf permitted for originalPdf"
  }
}
```

## Endpoint: Analyses Upload (current)

- Path: `POST /app/api/upload-to-supabase-analyses`
- Planned: `POST /api/v1/analyses/upload`
- Content-Type: `multipart/form-data`
- Form fields:
  - `file`: original PDF (required)
- Behavior: Similar extraction + duplicate detection + DB update/insert. Uses orchestrator.

### Request example (curl)
```
curl -X POST \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -F file=@resume.pdf \
  https://<host>/app/api/upload-to-supabase-analyses
```

### Response example (update)
```
{
  "success": true,
  "isUpdate": true,
  "uploadId": "<existing-id>",
  "imageUrl": "https://...",
  "pdfUrl": "https://...",
  "message": "Existing resume should be updated"
}
```

## Production contract (target)

- Base URL: `/api/v1`
- Auth: Bearer token (Supabase JWT)
- CORS: restricted origins; preflight allowed
- Rate limiting: per-IP and per-user
- Idempotency: `Idempotency-Key` supported for upload endpoints
- Storage: private buckets + signed URLs (short TTL)
- Error codes (sample):
  - `AUTH_REQUIRED`, `AUTH_FORBIDDEN`
  - `UPLOAD_VALIDATION_FAILED`, `UPLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`
  - `DUPLICATE_DETECTED`, `UPDATE_REQUIRED`
  - `DB_ERROR`, `STORAGE_ERROR`, `INTERNAL_ERROR`

## Mobile client guidance

- Retry behavior: use idempotency key and exponential backoff
- Offline: queue uploads, include timestamps; server is idempotent
- Timeouts: client timeout >= 30s for PDF + processing
- Privacy: never cache signed URLs; refresh when needed

## Changelog
- 2025-08-12: Initial draft created; current routes documented; target production contract outlined.
