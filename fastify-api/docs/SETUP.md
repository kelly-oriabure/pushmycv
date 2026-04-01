# PushMyCV Fastify Setup Guide

## Overview

This is a complete Fastify-based job queue system with API service, worker loop, and cron jobs for CV/resume management automation.

## Architecture

```
[Flutter App / Next.js Dashboard]
            |
            v
    [Fastify API Service]
            |
            v
    [Supabase Queue Table]
            |
            v
    [Fastify Worker Loop]
            |
            v
    [Job Handlers]
```

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project
- PostgreSQL database (via Supabase)

## Installation

### 1. Clone and Install Dependencies

```bash
cd pushmycv-fastify
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Worker Configuration
WORKER_POLL_INTERVAL=5000
WORKER_MAX_RETRIES=5
```

### 3. Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# Copy the contents of database/schema.sql
# Paste and execute in Supabase SQL Editor
```

Or use the Supabase CLI:

```bash
supabase db push
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts:
- Fastify API server on port 3000
- Worker loop (polls every 5 seconds)
- Cron jobs scheduler

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### Job Queue Endpoints

#### POST `/api/apply-job`
Enqueue a job application task.

```json
{
  "user_id": "user-123",
  "job_id": "job-456"
}
```

#### POST `/api/generate-resume`
Enqueue a resume generation task.

```json
{
  "user_id": "user-123",
  "job_id": "job-456" // optional
}
```

#### POST `/api/generate-cover-letter`
Enqueue a cover letter generation task.

```json
{
  "user_id": "user-123",
  "job_id": "job-456"
}
```

#### GET `/api/job/:id`
Get status of a queued job.

### Queue Management Endpoints

#### GET `/queue/stats`
Get queue statistics (pending, processing, done, failed).

#### GET `/queue/worker/status`
Get worker loop status.

#### GET `/queue/cron/status`
Get cron jobs status.

### General Endpoints

#### GET `/`
Welcome message and API info.

#### GET `/health`
Health check endpoint.

#### GET `/docs`
Swagger UI documentation.

## Worker System

The worker loop continuously polls the `queue_jobs` table for pending jobs and processes them based on priority.

### Job Types

1. **generate_resume** - Generate tailored resume
2. **generate_cover_letter** - Generate personalized cover letter
3. **apply_job** - Submit job application
4. **fetch_jobs** - Fetch jobs from external APIs

### Job Processing Flow

1. Worker claims pending job (highest priority first)
2. Marks job as `processing` and locks it
3. Executes appropriate job handler
4. On success: marks as `done`
5. On failure: increments attempts, retries or marks as `failed`

### Retry Logic

- Max attempts: 5 (configurable)
- Failed jobs are automatically retried
- Exponential backoff for external API calls
- Jobs exceeding max attempts are marked as `failed`

## Cron Jobs

Scheduled tasks run automatically:

### Daily Job Fetch (1:00 AM)
```cron
0 1 * * *
```
Fetches new jobs from external job boards.

### Hourly Application Check
```cron
0 * * * *
```
Checks for scheduled applications.

### Weekly Resume Update (Sunday 2:00 AM)
```cron
0 2 * * 0
```
Generates updated resumes for active users.

## Testing

```bash
npm test
```

## Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:
- Hostinger VPS
- Coolify
- Docker Compose
- etc.

## Monitoring

### Logs

All logs are output in JSON format for easy parsing:

```json
{
  "timestamp": "2024-12-31T14:00:00.000Z",
  "level": "info",
  "message": "Job completed successfully",
  "meta": {
    "job_id": 123,
    "type": "apply_job"
  }
}
```

### Queue Monitoring

Check queue status via API:

```bash
curl http://localhost:3000/queue/stats
```

### Worker Status

```bash
curl http://localhost:3000/queue/worker/status
```

## Troubleshooting

### Worker Not Processing Jobs

1. Check worker status: `GET /queue/worker/status`
2. Verify Supabase connection
3. Check environment variables
4. Review logs for errors

### Jobs Stuck in Processing

Jobs may get stuck if worker crashes. To reset:

```sql
UPDATE queue_jobs 
SET status = 'pending', locked_at = NULL 
WHERE status = 'processing' 
  AND locked_at < NOW() - INTERVAL '10 minutes';
```

### High Memory Usage

Adjust `WORKER_POLL_INTERVAL` to reduce polling frequency:

```env
WORKER_POLL_INTERVAL=10000  # 10 seconds instead of 5
```

## Development

### Adding New Job Types

1. Add type to `src/types/queue.ts`
2. Create handler in `src/jobs/`
3. Register handler in `src/jobs/index.ts`
4. Add API endpoint in `src/routes/api.ts`

### Project Structure

```
src/
├── config/          # Supabase client setup
├── cron/            # Cron job scheduler
├── jobs/            # Job handlers
├── routes/          # API routes
├── types/           # TypeScript types
├── utils/           # Utilities (logger, helpers, retry)
├── workers/         # Worker loop
├── app.ts           # Fastify app setup
└── server.ts        # Server entry point
```

## Support

For issues or questions, check:
- Swagger docs: http://localhost:3000/docs
- Supabase dashboard for queue status
- Application logs
