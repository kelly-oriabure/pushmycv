# Resume Analysis Edge Function

This Supabase Edge Function handles resume analysis by integrating with an n8n workflow via webhook.

## Overview

The function receives resume analysis requests, updates the database status, and triggers the n8n workflow for AI-powered resume analysis.

## Request Format

### New Structure (Recommended)
```json
{
  "resumeUploadId": "uuid-string",
  "resumeUrl": "https://storage-url/resume.pdf",
  "jobTitle": "Software Developer", // optional, defaults to "General"
  "userId": "user-uuid" // optional
}
```

### Legacy Structure (Backward Compatible)
```json
{
  "analysisId": "uuid-string",
  "resumeUrl": "https://storage-url/resume.pdf",
  "jobTitle": "Software Developer", // optional, defaults to "General"
  "userId": "user-uuid" // optional
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "analysisId": "uuid-string",
  "message": "Resume analysis initiated successfully",
  "webhookResponse": {}
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Workflow

1. Validates request payload
2. Updates resume_analyses table status to 'processing'
3. Calls n8n webhook with resume data
4. Handles webhook response and errors
5. Updates database status accordingly

## Environment Variables

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `N8N_WEBHOOK_URL`: n8n webhook URL for resume analysis (optional)
  - Default: `https://agents.flowsyntax.com/webhook/ff6d33b5-6184-4814-a945-efb3c5ac1052`

## Deployment

Deploy using Supabase CLI:
```bash
supabase functions deploy resume-analysis
```

## Testing

Test locally:
```bash
supabase functions serve resume-analysis
```