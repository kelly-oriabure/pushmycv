# Cross-Repository Reference Guide

This file helps maintain context when working across `frontend`, `fastify-api`, and `agentic`.

## Type Mappings

| TypeScript (web) | Python (agentic) | Description |
|------------------|------------------|-------------|
| `ResumeData` | `ResumeData` | Complete resume structure |
| `PersonalDetailsData` | `PersonalDetails` | Contact info, name, etc. |
| `EducationEntry` | `Education` | School, degree, dates |
| `EmploymentEntry` | `Employment` | Job title, employer, description |
| `Skill` | `Skill` | Skill name + level (0-100) |
| `ResumeAnalysisResult` | `ResumeAnalysisResult` | Analysis output with scores |
| `AnalysisScores` | `AnalysisScores` | Overall, ATS, content, etc. |

## API Endpoints Reference

### fastify-api → frontend

```typescript
// Web calls these API endpoints:
POST   /api/v1/resumes/analyze        // Start analysis
GET    /api/v1/resumes/analysis/:id   // Get results
GET    /api/v1/workflows/:id          // Check workflow status
GET    /api/v1/queue/stats            // Queue statistics
```

### fastify-api ↔ agentic (via Queue)

```python
# Agentic processes these job types:
"resume_analysis"         -> ResumeAnalysisWorkflow
"generate_cover_letter"   -> CoverLetterWorkflow  
"enhance_resume"          -> ResumeEnhancementWorkflow
```

## Database Tables

### Jobeazy DB (Read-Only from API/Agentic)
- `resume_uploads` - Uploaded resume files + extracted text
- `resumes` - Resume metadata
- `profiles` - User profile data

### Fastify DB (Read/Write)
- `queue_jobs` - Job queue (pending, processing, done)
- `job_matches` - AI analysis results
- `profiles` - Cached user data

## File Correspondences

### Adding a Resume Tool

1. **agentic**: `src/pushmycv_agentic/tools/resume_tools.py`
   - Create new tool class
   - Add to `RESUME_TOOLS` list

2. **agentic**: `src/pushmycv_agentic/tools/__init__.py`
   - Export new tool

3. **web**: `app/lib/services/resumeService.ts`
   - Add API call to use new tool

### Adding a Workflow Step

1. **agentic**: `src/pushmycv_agentic/workflows/resume_analysis.py`
   - Create step function
   - Add to `RESUME_ANALYSIS_WORKFLOW.steps`

2. **api**: `src/routes/resumes.ts`
   - Update endpoint if needed

3. **web**: `app/components/resume/AnalysisPanel.tsx`
   - Display new analysis data

## Environment Variables Cross-Reference

| Variable | Used In | Purpose |
|----------|---------|---------|
| `SUPABASE_URL` | web, api, agentic | Jobeazy DB connection |
| `SUPABASE_KEY` | web, api, agentic | Jobeazy DB auth |
| `FASTIFY_SUPABASE_URL` | api, agentic | Fastify DB connection |
| `FASTIFY_SUPABASE_KEY` | api, agentic | Fastify DB auth |
| `OPENAI_API_KEY` | agentic | LLM calls |
| `JWT_SECRET` | api | Token signing |
| `API_KEY` | api, agentic | Service-to-service auth |

## Quick Debugging

### Workflow not starting?
- Check `fastify-api` is creating queue_jobs entries
- Verify `agentic` can connect to Fastify DB

### Analysis results not showing?
- Check web → api connection (`NEXT_PUBLIC_FASTIFY_API_URL`)
- Verify api → queue_jobs writes
- Check agentic writes to `job_matches` table

### Type mismatches?
- Compare TypeScript interface in web with Python model in agentic
- Check JSON serialization in both directions
