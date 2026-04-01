# PushMyCV API Endpoints Documentation

## Base URL
```
http://localhost:3000
```

## Swagger Documentation
```
http://localhost:3000/docs
```

---

## 📋 Table of Contents

1. [General Endpoints](#general-endpoints)
2. [Profile Management](#profile-management)
3. [Resume Management](#resume-management)
4. [Work Experience Management](#work-experience-management)
5. [Job Listings](#job-listings)
6. [Application Management](#application-management)
7. [Queue Management](#queue-management)

---

## General Endpoints

### GET `/`
Welcome endpoint

**Response:**
```json
{
  "message": "Welcome to PushMyCV API",
  "status": "running",
  "version": "1.0.0"
}
```

### GET `/health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-31T14:30:00.000Z"
}
```

---

## Profile Management

### GET `/api/profiles`
Get all user profiles

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "phone": "+1234567890",
      "location": "San Francisco, CA",
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "github_url": "https://github.com/johndoe",
      "portfolio_url": "https://johndoe.com",
      "bio": "Software Engineer with 5 years experience",
      "avatar_url": "https://example.com/avatar.jpg",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET `/api/profiles/:user_id`
Get a specific user profile

**Parameters:**
- `user_id` (path) - User ID

### POST `/api/profiles`
Create a new user profile

**Request Body:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "location": "San Francisco, CA",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "github_url": "https://github.com/johndoe",
  "portfolio_url": "https://johndoe.com",
  "bio": "Software Engineer"
}
```

### PUT `/api/profiles/:user_id`
Update a user profile

### DELETE `/api/profiles/:user_id`
Delete a user profile

---

## Resume Management

### GET `/api/resumes?user_id=uuid`
Get all resumes for a user

**Query Parameters:**
- `user_id` (required) - User ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Software Engineer Resume",
      "template": "modern",
      "is_default": true,
      "file_url": "https://example.com/resume.pdf",
      "file_format": "pdf",
      "status": "published",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET `/api/resumes/:id`
Get a specific resume

### POST `/api/resumes`
Create a new resume

**Request Body:**
```json
{
  "user_id": "uuid",
  "title": "Software Engineer Resume",
  "template": "modern",
  "is_default": false,
  "status": "draft"
}
```

### PUT `/api/resumes/:id`
Update a resume

### DELETE `/api/resumes/:id`
Delete a resume

---

## Work Experience Management

### GET `/api/experiences?user_id=uuid`
Get all work experiences for a user

**Query Parameters:**
- `user_id` (required) - User ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "company_name": "Tech Corp",
      "position": "Senior Software Engineer",
      "location": "San Francisco, CA",
      "start_date": "2020-01-01",
      "end_date": "2024-01-01",
      "is_current": false,
      "description": "Led development of microservices",
      "achievements": [
        "Reduced API latency by 40%",
        "Mentored 5 junior developers"
      ],
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/experiences`
Create a new work experience

**Request Body:**
```json
{
  "user_id": "uuid",
  "company_name": "Tech Corp",
  "position": "Senior Software Engineer",
  "location": "San Francisco, CA",
  "start_date": "2020-01-01",
  "end_date": "2024-01-01",
  "is_current": false,
  "description": "Led development of microservices",
  "achievements": ["Achievement 1", "Achievement 2"]
}
```

### PUT `/api/experiences/:id`
Update a work experience

### DELETE `/api/experiences/:id`
Delete a work experience

---

## Job Listings

### GET `/api/jobs`
Get all active job listings

**Query Parameters:**
- `status` (optional) - Filter by status: active, closed, filled
- `location` (optional) - Filter by location
- `job_type` (optional) - Filter by job type
- `limit` (optional) - Number of results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Senior Full Stack Developer",
      "company": "Tech Corp",
      "company_logo_url": "https://example.com/logo.png",
      "location": "Remote",
      "job_type": "full-time",
      "salary_min": 100000,
      "salary_max": 150000,
      "salary_currency": "USD",
      "description": "We are looking for...",
      "requirements": ["5+ years experience", "React", "Node.js"],
      "responsibilities": ["Build scalable applications"],
      "benefits": ["Health insurance", "Remote work"],
      "application_url": "https://example.com/apply",
      "source": "linkedin",
      "source_job_id": "linkedin-12345",
      "posted_date": "2024-01-01T00:00:00.000Z",
      "deadline": "2024-02-01T00:00:00.000Z",
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### GET `/api/jobs/:id`
Get a specific job listing

### POST `/api/jobs`
Create a new job listing

**Request Body:**
```json
{
  "title": "Senior Full Stack Developer",
  "company": "Tech Corp",
  "location": "Remote",
  "job_type": "full-time",
  "salary_min": 100000,
  "salary_max": 150000,
  "description": "Job description",
  "requirements": ["Requirement 1", "Requirement 2"],
  "responsibilities": ["Responsibility 1"],
  "benefits": ["Benefit 1"],
  "application_url": "https://example.com/apply"
}
```

### PUT `/api/jobs/:id`
Update a job listing

### DELETE `/api/jobs/:id`
Delete a job listing

---

## Application Management

### GET `/api/applications?user_id=uuid`
Get all applications for a user

**Query Parameters:**
- `user_id` (required) - User ID
- `status` (optional) - Filter by status: pending, submitted, interviewing, rejected, accepted

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "job_id": "uuid",
      "resume_id": "uuid",
      "cover_letter_id": "uuid",
      "status": "submitted",
      "applied_at": "2024-01-01T00:00:00.000Z",
      "response_date": null,
      "notes": "Applied via LinkedIn",
      "jobs": {
        "title": "Senior Developer",
        "company": "Tech Corp"
      },
      "resumes": {
        "id": "uuid",
        "title": "My Resume"
      },
      "cover_letters": {
        "id": "uuid",
        "title": "Cover Letter"
      },
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### GET `/api/applications/:id`
Get a specific application with full details

### POST `/api/applications`
Create a new application

**Request Body:**
```json
{
  "user_id": "uuid",
  "job_id": "uuid",
  "resume_id": "uuid",
  "cover_letter_id": "uuid",
  "status": "pending",
  "notes": "Applied via LinkedIn"
}
```

### PUT `/api/applications/:id`
Update an application

**Request Body:**
```json
{
  "status": "interviewing",
  "notes": "Phone interview scheduled",
  "response_date": "2024-01-15T00:00:00.000Z"
}
```

### DELETE `/api/applications/:id`
Delete an application

### GET `/api/applications/stats?user_id=uuid`
Get application statistics for a user

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "pending": 5,
    "submitted": 10,
    "interviewing": 3,
    "rejected": 5,
    "accepted": 2
  }
}
```

---

## Queue Management

### POST `/api/apply-job`
Enqueue a job application task

**Request Body:**
```json
{
  "user_id": "uuid",
  "job_id": "uuid"
}
```

### POST `/api/generate-resume`
Enqueue a resume generation task

**Request Body:**
```json
{
  "user_id": "uuid",
  "job_id": "uuid (optional)"
}
```

### POST `/api/generate-cover-letter`
Enqueue a cover letter generation task

**Request Body:**
```json
{
  "user_id": "uuid",
  "job_id": "uuid"
}
```

### GET `/api/job/:id`
Get the status of a queued job

### GET `/queue/stats`
Get queue statistics

### GET `/queue/worker/status`
Get worker status

### GET `/queue/cron/status`
Get cron job status

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication

**Note:** Currently, the API does not enforce authentication for demo purposes. In production, all endpoints should be protected with JWT authentication using Supabase Auth.

To add authentication:
1. Include the Supabase JWT token in the `Authorization` header
2. Format: `Bearer <token>`
3. RLS policies in Supabase will enforce user-level access control

---

## Edge Functions

The following Supabase Edge Functions are also available:

### POST `https://hfxdqqeybszlpgtktgps.supabase.co/functions/v1/generate-resume`
Generate a tailored resume

### POST `https://hfxdqqeybszlpgtktgps.supabase.co/functions/v1/generate-cover-letter`
Generate a personalized cover letter

### POST `https://hfxdqqeybszlpgtktgps.supabase.co/functions/v1/apply-job`
Submit a job application

### POST `https://hfxdqqeybszlpgtktgps.supabase.co/functions/v1/fetch-jobs`
Fetch job listings from external sources

---

## Testing with Swagger

Visit `http://localhost:3000/docs` to access the interactive Swagger UI where you can:
- View all available endpoints
- Test endpoints directly from the browser
- See request/response schemas
- Try out different parameters

---

## Example Usage

### Create a Profile
```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john@example.com",
    "full_name": "John Doe",
    "location": "San Francisco, CA"
  }'
```

### Get All Jobs
```bash
curl http://localhost:3000/api/jobs?status=active&limit=10
```

### Create an Application
```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "job_id": "223e4567-e89b-12d3-a456-426614174000",
    "status": "pending"
  }'
```

### Get Application Stats
```bash
curl "http://localhost:3000/api/applications/stats?user_id=123e4567-e89b-12d3-a456-426614174000"
```
