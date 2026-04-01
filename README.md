# PushMyCV Multi-Repository Workspace

This workspace contains three interconnected repositories for the PushMyCV platform.

## Repository Structure

```
workspace/
├── frontend/      # Next.js frontend (port 3000)
├── fastify-api/ # Fastify backend API (port 3001)
└── agentic/     # Python AI workflows (port 8000)
```

## Quick Start

```bash
# Start all services
docker-compose up

# Or start individually:
cd frontend && npm run dev
cd fastify-api && npm run dev
cd agentic && python -m agentic.workflows.resume_analysis
```

## Cross-Repository Context

### When Working in `frontend/`:
- **API Calls**: All backend requests go to `fastify-api`
  - `POST /api/v1/analyze-resume` - Trigger analysis
  - `GET /api/v1/workflows/:id` - Check status
- **Database**: Read/write via Supabase client
- **Types**: Shared resume types in `app/lib/types.ts`

### When Working in `fastify-api/`:
- **Queue**: Uses Supabase `queue_jobs` table
- **Agentic**: Queues jobs for `agentic` worker
- **Web**: CORS configured for frontend origin

### When Working in `agentic/`:
- **Input**: Polls `queue_jobs` from fastify-api database
- **Output**: Writes results to `job_matches` table
- **Models**: Pydantic models mirror TypeScript types

## Common Development Tasks

### Adding a New Resume Analysis Feature

1. **frontend**: Add UI component
2. **fastify-api**: Add API route + queue job type
3. **agentic**: Add workflow/tool

### Shared Types

TypeScript and Python types should stay in sync:
- `frontend/app/lib/types.ts`
- `agentic/models/resume.py`

## Environment Variables

See `.env.example` in each repository for required variables.

Key shared variables:
- `SUPABASE_URL` / `SUPABASE_KEY` - Jobeazy DB (resume data)
- `FASTIFY_SUPABASE_URL` - Fastify DB (queue, results)
- `OPENAI_API_KEY` - For agentic AI features

## Current Progress

### Implemented Features

**Resume Analysis Pipeline**:
- PDF upload with text extraction
- Async analysis via queue system (Supabase `queue_jobs`)
- ATS scoring (keywords, formatting)
- Content analysis (word count, tone, structure)
- Skills extraction (technical, soft skills)
- Score dashboard with actionable suggestions

**Architecture**:
- Three-service architecture: frontend → fastify-api → agentic worker
- Queue-based job processing with status tracking
- Type-safe data flow (TypeScript ↔ Python Pydantic)

**Integrations**:
- Supabase Storage for PDFs
- Dual database setup (Jobeazy + Fastify)
- OpenRouter LLM for analysis

### See Also

- [`RESUME_ANALYSIS_IMPLEMENTATION.md`](RESUME_ANALYSIS_IMPLEMENTATION.md) - Detailed architecture docs
- [`CROSS_REFERENCE.md`](CROSS_REFERENCE.md) - Type mappings and cross-repo debugging
