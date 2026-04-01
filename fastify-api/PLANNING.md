# PushMyCV - Fastify Project

## Project Overview
A Fastify-based web application for CV/resume management and sharing.

## Architecture
- **Framework**: Fastify (Node.js)
- **Language**: TypeScript
- **Structure**: Modular, feature-based organization

## Project Structure
```
pushmycv-fastify/
├── src/
│   ├── app.ts           # Main Fastify app configuration
│   ├── server.ts        # Server entry point with worker & cron
│   ├── config/          # Configuration (Supabase client)
│   ├── routes/          # API route handlers
│   │   ├── api.ts       # Job queue API endpoints
│   │   └── queue.ts     # Queue management endpoints
│   ├── workers/         # Background worker loop
│   │   └── queueWorker.ts
│   ├── jobs/            # Job handlers
│   │   ├── generateResume.ts
│   │   ├── generateCoverLetter.ts
│   │   ├── applyJob.ts
│   │   ├── fetchJobs.ts
│   │   └── index.ts
│   ├── cron/            # Cron job scheduler
│   │   └── schedule.ts
│   ├── types/           # TypeScript type definitions
│   │   ├── queue.ts
│   │   └── database.ts
│   └── utils/           # Utilities
│       ├── logger.ts
│       ├── jobHelpers.ts
│       └── retry.ts
├── tests/               # Jest tests with TypeScript
├── database/            # Database schemas
│   └── schema.sql       # Queue table schema
├── docs/                # Documentation
│   └── SETUP.md         # Setup guide
├── dist/                # Compiled JavaScript output
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript configuration
├── .env.example         # Environment variables template
├── PLANNING.md          # This file
└── TASK.md             # Task tracking
```

## Coding Standards
- **Max file length**: 500 lines
- **Module organization**: Feature-based separation
- **Naming**: camelCase for variables/functions, PascalCase for classes/types
- **Imports**: Use ES6 imports with .js extension (for ESM compatibility)
- **Types**: Use explicit types, avoid `any`

## Technology Stack
- **Fastify**: Fast and low overhead web framework
- **TypeScript**: Type-safe JavaScript
- **Supabase**: PostgreSQL database and queue storage
- **Swagger/OpenAPI**: API documentation with @fastify/swagger
- **node-cron**: Cron job scheduling
- **Node.js**: Runtime environment
- **Jest**: Testing framework with ts-jest
- **tsx**: TypeScript execution for development
- **dotenv**: Environment configuration

## Development Workflow
1. Check TASK.md before starting work
2. Write tests for new features
3. Document API endpoints with OpenAPI schemas
4. Keep modules under 500 lines
5. Update TASK.md when completing tasks

## Job Queue System

### Queue Flow
1. Client sends request to API endpoint
2. API enqueues job in Supabase `queue_jobs` table
3. Worker polls queue every 5 seconds
4. Worker claims highest priority pending job
5. Worker executes appropriate job handler
6. Worker updates job status (done/failed)
7. Failed jobs are retried up to max_attempts

### Job Handlers
- Each job type has a dedicated handler in `src/jobs/`
- Handlers are async functions that receive payload
- Handlers should be idempotent when possible
- Use retry logic for external API calls

### Worker System
- Single worker loop per instance
- Polls queue at configurable interval
- Processes one job at a time
- Automatic retry with exponential backoff
- Graceful shutdown on SIGTERM/SIGINT

### Cron Jobs
- Scheduled tasks run automatically
- Enqueue jobs for periodic operations
- Examples: daily job fetch, weekly resume updates

## API Documentation
- All routes should include OpenAPI schema definitions
- Use appropriate tags to organize endpoints
- Swagger UI available at `/docs` endpoint
- OpenAPI spec available at `/docs/json`

## Database Schema
- `queue_jobs` table stores all queued jobs
- Indexes on status, priority, created_at
- Auto-updating updated_at timestamp
- See `database/schema.sql` for full schema
