# PushMyCV API Documentation

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, the API does not require authentication. In production, implement proper authentication using JWT tokens or API keys.

## Job Queue API

### Enqueue Job Application

Enqueue a job application task for processing.

**Endpoint:** `POST /api/apply-job`

**Request Body:**
```json
{
  "user_id": "string (required)",
  "job_id": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "job_id": 123,
  "message": "Job application task enqueued successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/apply-job \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-123", "job_id": "job-456"}'
```

---

### Generate Resume

Enqueue a resume generation task.

**Endpoint:** `POST /api/generate-resume`

**Request Body:**
```json
{
  "user_id": "string (required)",
  "job_id": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "job_id": 124,
  "message": "Resume generation task enqueued successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/generate-resume \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-123", "job_id": "job-456"}'
```

---

### Generate Cover Letter

Enqueue a cover letter generation task.

**Endpoint:** `POST /api/generate-cover-letter`

**Request Body:**
```json
{
  "user_id": "string (required)",
  "job_id": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "job_id": 125,
  "message": "Cover letter generation task enqueued successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/generate-cover-letter \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-123", "job_id": "job-456"}'
```

---

### Get Job Status

Get the status of a queued job.

**Endpoint:** `GET /api/job/:id`

**Parameters:**
- `id` - Job ID (number)

**Response:**
```json
{
  "id": 123,
  "type": "apply_job",
  "status": "processing",
  "attempts": 1,
  "created_at": "2024-12-31T14:00:00.000Z",
  "updated_at": "2024-12-31T14:00:05.000Z"
}
```

**Example:**
```bash
curl http://localhost:3000/api/job/123
```

---

## Queue Management API

### Get Queue Statistics

Get statistics about the job queue.

**Endpoint:** `GET /queue/stats`

**Response:**
```json
{
  "pending": 5,
  "processing": 1,
  "done": 150,
  "failed": 3,
  "total": 159
}
```

**Example:**
```bash
curl http://localhost:3000/queue/stats
```

---

### Get Worker Status

Get the current status of the worker loop.

**Endpoint:** `GET /queue/worker/status`

**Response:**
```json
{
  "running": true,
  "processing": false,
  "poll_interval": 5000
}
```

**Example:**
```bash
curl http://localhost:3000/queue/worker/status
```

---

### Get Cron Status

Get the status of scheduled cron jobs.

**Endpoint:** `GET /queue/cron/status`

**Response:**
```json
{
  "total_jobs": 3,
  "jobs": [
    { "running": true },
    { "running": true },
    { "running": true }
  ]
}
```

**Example:**
```bash
curl http://localhost:3000/queue/cron/status
```

---

## General Endpoints

### Welcome

Get API information.

**Endpoint:** `GET /`

**Response:**
```json
{
  "message": "Welcome to PushMyCV API",
  "status": "running",
  "version": "1.0.0"
}
```

---

### Health Check

Check if the API is healthy.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-31T14:00:00.000Z"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Internal Server Error

---

## Job Status Values

- `pending` - Job is waiting to be processed
- `processing` - Job is currently being processed
- `done` - Job completed successfully
- `failed` - Job failed after max retry attempts

---

## Job Priority

Jobs are processed in order of priority (higher first), then by creation time (older first).

Default priorities:
- `apply_job` - Priority 10
- `generate_resume` - Priority 5
- `generate_cover_letter` - Priority 5
- `fetch_jobs` - Priority 5

---

## Rate Limiting

Currently, no rate limiting is implemented. In production, implement rate limiting to prevent abuse.

---

## Interactive Documentation

For interactive API documentation with the ability to test endpoints directly in your browser, visit:

**Swagger UI:** http://localhost:3000/docs

**OpenAPI Spec:** http://localhost:3000/docs/json
