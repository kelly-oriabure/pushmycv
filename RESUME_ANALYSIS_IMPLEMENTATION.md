# PushMyCV Resume Analysis - Implementation Documentation

## Overview

This document describes the current implementation of the resume analysis workflow, which uses a multi-service architecture with a Next.js frontend, Fastify API, and Python agentic worker.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js Web   │────▶│   Fastify API   │────▶│ Python Worker   │
│   (Frontend)    │     │   (Queue Mgmt)  │     │   (Analyzer)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Jobeazy DB     │     │  Fastify DB     │     │  Jobeazy DB     │
│(resume_uploads, │     │  (queue_jobs)   │     │(resume_analyses)│
│resume_analyses) │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Data Flow

### 1. Upload Phase

**File**: `frontend/app/api/resume-score/upload/route.ts`

1. User uploads PDF via `ResumeUploadForm.tsx`
2. PDF uploaded to Supabase Storage (`resume-pdfs/{userId}/{uuid}.pdf`)
3. Text extracted via `processPdfUpload()` service
4. Record created in `resume_uploads` table:
   - `id`, `user_id`, `file_name`, `pdf_url`
   - `extracted_text`, `content_hash`, etc.
5. **Analysis triggered** via `startResumeAnalysisViaApi()`

### 2. Queue Job Creation

**File**: `fastify-api/src/routes/resumes.ts` (POST `/v1/resumes/analyze`)

1. Fastify receives analysis request
2. Fetches `extracted_text` from `resume_uploads`
3. Creates job in `queue_jobs` table:
   ```sql
   INSERT INTO queue_jobs (type, payload, status)
   VALUES ('resume_analysis', {
     workflow_id: uuid,
     resume_upload_id: uploadId,
     user_id: userId,
     raw_text: extractedText,
     file_name: fileName,
     pdf_url: pdfUrl
   }, 'pending')
   ```

### 3. Worker Processing

**File**: `agentic/workers/queue_worker.py`

1. Polls `queue_jobs` every 5 seconds for `type='resume_analysis'` AND `status='pending'`
2. Fetches pending job, marks as `processing`
3. Calls `SimpleResumeAnalyzer.analyze_resume()`:
   - ATS analysis (keywords, formatting)
   - Content analysis (word count, tone, structure)
   - Skills extraction (technical, soft skills)
   - Generates suggestions
   - Calculates overall score
4. Saves results to `resume_analyses` table
5. Marks job as `completed`

### 4. Results Display

**File**: `frontend/app/(protected)/resume-score/page.tsx`

1. Server component fetches from `resume_analyses` by `upload_id`
2. Transforms data to `WorkflowResponse` format
3. Renders `ScoreDashboard` with scores and insights

## Database Schema

### Jobeazy Database (Main)

**resume_uploads**:
- `id` (uuid, PK)
- `user_id` (uuid)
- `file_name`, `file_path`, `pdf_url`
- `extracted_text` (text content)
- `content_hash`, `email_hash`, `phone_hash`, `composite_hash`
- `extracted_email`, `extracted_phone`
- `created_at`, `updated_at`

**resume_analyses**:
- `id` (uuid, PK)
- `upload_id` (uuid, FK)
- `user_id` (uuid)
- `overall_score` (int)
- `ats_score`, `content_score`, `tone_score`, `structure_score`, `skills_score`, `email_score`, `length_score`, `brevity_score`
- `ats_type`, `content_type`, etc. (feedback categories)
- `ats_explanation`, `content_explanation`, etc.
- `ats_tips_tip`, `content_tips_tip`, etc.
- `suggestions` (jsonb array)
- `status`, `error_message`
- `created_at`, `updated_at`

### Fastify Database (Queue)

**queue_jobs**:
- `id` (int, PK)
- `type` (text) - 'resume_analysis'
- `payload` (jsonb)
- `status` (text) - 'pending', 'processing', 'completed', 'failed'
- `attempts` (int, default 0)
- `max_attempts` (int, default 5)
- `priority` (int, default 0)
- `locked_at` (timestamp)
- `created_at`, `updated_at`

## Environment Variables

### frontend/.env.local
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_FASTIFY_API_URL=http://localhost:3001
```

### fastify-api/.env
```
SUPABASE_URL=https://hfxdqqeybszlpgtktgps.supabase.co
SUPABASE_ANON_KEY=
JOBEAZY_SUPABASE_URL=https://embugkjoeyfukdotmgyg.supabase.co
JOBEAZY_SUPABASE_KEY=
FASTIFY_SUPABASE_KEY= (service_role key for queue access)
PORT=3001
```

### agentic/.env
```
SUPABASE_URL=https://iyeshscrvbhhnpbdrhxq.supabase.co (Jobeazy)
SUPABASE_KEY=
FASTIFY_SUPABASE_URL=https://hfxdqqeybszlpgtktgps.supabase.co
FASTIFY_SUPABASE_KEY= (service_role key)

APP_LLM_API_KEY= (OpenRouter)
APP_LLM_MODEL=deepseek/deepseek-chat
APP_LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_PROVIDER=openrouter
```

## Key Files

### Frontend
- `frontend/app/components/resume-score/ResumeUploadForm.tsx` - PDF upload UI
- `frontend/app/api/resume-score/upload/route.ts` - Upload API route
- `frontend/app/api/resume-score/status/[id]/route.ts` - Check analysis status
- `frontend/app/(protected)/resume-score/page.tsx` - Results page
- `frontend/app/components/resume-score/ScoreDashboard.tsx` - Score display
- `frontend/app/lib/services/resumeAnalysisService.ts` - Fastify API client

### API
- `fastify-api/src/routes/resumes.ts` - `/v1/resumes/analyze` endpoint
- `fastify-api/src/server.ts` - Fastify server

### Worker
- `agentic/workers/queue_worker.py` - Queue polling and job processing
- `agentic/simple_analyzer.py` - Resume analysis logic

## Current Issues & Limitations

1. **Image handling removed**: Client-side PDF-to-image conversion was removed. Resume preview not currently displayed.

2. **No real-time updates**: Score page polls `resume_analyses` table; no WebSocket for live updates.

3. **Single worker instance**: Only one Python worker running; no horizontal scaling.

4. **No retry logic**: Failed jobs marked as failed; no automatic retry.

5. **LLM dependency**: Analysis requires OpenRouter API key; falls back to basic scoring if unavailable.

## Testing

### Manual Test Flow

1. **Start services**:
   ```bash
   # Terminal 1: Fastify API
   cd fastify-api && npm run dev
   
   # Terminal 2: Python Worker
   cd agentic && python workers/queue_worker.py
   
   # Terminal 3: Next.js
   cd frontend && npm run dev
   ```

2. **Upload resume**:
   - Go to http://localhost:3000/resume-score
   - Upload PDF
   - Check console logs in all 3 terminals

3. **View results**:
   - Redirects to `/resume-score?id=xxx`
   - Scores display after worker completes

### Debug Commands

```bash
# Check queue jobs
curl "https://hfxdqqeybszlpgtktgps.supabase.co/rest/v1/queue_jobs?select=*" \
  -H "apikey: <service_role_key>"

# Check analysis results
curl "https://iyeshscrvbhhnpbdrhxq.supabase.co/rest/v1/resume_analyses?select=*" \
  -H "apikey: <anon_key>"
```

## Future Improvements

1. Add WebSocket for real-time status updates
2. Implement job retry with exponential backoff
3. Add horizontal scaling for workers
4. Cache analysis results
5. Add resume preview (PDF viewer or generated image)
6. Support multiple file formats (DOCX, TXT)
