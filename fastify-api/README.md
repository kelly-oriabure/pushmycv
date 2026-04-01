# PushMyCV - Fastify

A complete Fastify-based job queue system with API service, worker loop, and cron jobs for CV/resume management and job application automation.

## Features

- 🚀 **Fastify API Service** - High-performance REST API
- 🔄 **Job Queue System** - PostgreSQL-based queue with Supabase
- 👷 **Background Workers** - Automated job processing
- ⏰ **Cron Jobs** - Scheduled task execution
- 📝 **Resume Generation** - AI-powered tailored resumes
- ✉️ **Cover Letter Generation** - Personalized cover letters
- 🎯 **Job Application** - Automated job applications
- 📊 **Queue Monitoring** - Real-time queue statistics
- 📚 **Swagger Documentation** - Interactive API docs
- 🔒 **TypeScript** - Full type safety

## Installation

```bash
npm install
```

## Running the Application

```bash
# Development mode (with auto-reload and TypeScript)
npm run dev

# Production mode (builds and runs)
npm start

# Build only
npm run build
```

## Testing

```bash
npm test
```

## Project Structure

- `src/` - TypeScript source code
  - `app.ts` - Fastify app configuration
  - `server.ts` - Server entry point
  - `routes/` - Route handlers
  - `plugins/` - Fastify plugins
- `dist/` - Compiled JavaScript output
- `tests/` - Jest test files (TypeScript)

## Technology Stack

- **Fastify** - Web framework
- **TypeScript** - Type-safe development
- **Swagger/OpenAPI** - API documentation
- **Jest** - Testing with ts-jest
- **tsx** - Fast TypeScript execution

## API Documentation

Interactive API documentation is available via Swagger UI:
- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/docs/json

## API Endpoints

### General
- `GET /` - Welcome message and API info
- `GET /health` - Health check endpoint
- `GET /docs` - Swagger UI documentation
- `GET /docs/json` - OpenAPI specification

### Job Queue API
- `POST /api/apply-job` - Enqueue job application
- `POST /api/generate-resume` - Enqueue resume generation
- `POST /api/generate-cover-letter` - Enqueue cover letter generation
- `GET /api/job/:id` - Get job status

### Queue Management
- `GET /queue/stats` - Queue statistics
- `GET /queue/worker/status` - Worker status
- `GET /queue/cron/status` - Cron jobs status

## Quick Start

### 1. Setup Environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 2. Create Database Schema

Run the SQL in `database/schema.sql` in your Supabase SQL editor.

### 3. Install & Run

```bash
npm install
npm run dev
```

The server will start with:
- API server on http://localhost:3000
- Worker loop processing jobs
- Cron jobs scheduled
- Swagger docs at http://localhost:3000/docs

## Architecture

```
[Client App] → [Fastify API] → [Supabase Queue] → [Worker] → [Job Handlers]
                                                      ↓
                                                  [Cron Jobs]
```

### Components

1. **API Service** - Receives requests and enqueues jobs
2. **Queue Table** - PostgreSQL table storing job queue
3. **Worker Loop** - Polls and processes jobs (5s interval)
4. **Job Handlers** - Execute specific automation tasks
5. **Cron Scheduler** - Runs periodic tasks

## Job Types

- `generate_resume` - Generate tailored resume for user
- `generate_cover_letter` - Generate personalized cover letter
- `apply_job` - Submit job application to ATS
- `fetch_jobs` - Fetch jobs from external APIs

## Configuration

See `.env.example` for all configuration options.

Key settings:
- `WORKER_POLL_INTERVAL` - Worker polling frequency (default: 5000ms)
- `WORKER_MAX_RETRIES` - Max retry attempts (default: 5)

## Documentation

- [Setup Guide](docs/SETUP.md) - Complete setup instructions
- [API Documentation](http://localhost:3000/docs) - Interactive Swagger docs
- [Database Schema](database/schema.sql) - Queue table schema
