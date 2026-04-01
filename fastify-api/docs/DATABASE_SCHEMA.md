# PushMyCV Database Schema Documentation

## Overview

Complete database schema for the PushMyCV application, deployed to Supabase project: **hfxdqqeybszlpgtktgps**

**Project URL**: https://hfxdqqeybszlpgtktgps.supabase.co  
**Region**: eu-north-1  
**PostgreSQL Version**: 17.6.1

---

## Database Tables (15 Total)

### 1. **profiles** - User Profile Information
Stores user profile data including contact information and social links.

**Columns:**
- `id` (UUID, PK) - Unique profile identifier
- `user_id` (UUID, FK → auth.users) - Reference to authenticated user
- `email` (TEXT, UNIQUE) - User email address
- `full_name` (TEXT) - Full name
- `phone` (TEXT) - Phone number
- `location` (TEXT) - Location/address
- `linkedin_url` (TEXT) - LinkedIn profile URL
- `github_url` (TEXT) - GitHub profile URL
- `portfolio_url` (TEXT) - Portfolio website URL
- `bio` (TEXT) - Professional bio
- `avatar_url` (TEXT) - Profile picture URL
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Enabled**: Yes  
**Indexes**: `idx_profiles_user_id`, `idx_profiles_email`

---

### 2. **resumes** - Resume/CV Documents
Stores generated resumes and their metadata.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `title` (TEXT) - Resume title
- `template` (TEXT) - Template name (default: 'modern')
- `is_default` (BOOLEAN) - Default resume flag
- `file_url` (TEXT) - URL to generated PDF/DOCX
- `file_format` (TEXT) - File format (default: 'pdf')
- `status` (TEXT) - Status: draft, published, archived
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Enabled**: Yes  
**Indexes**: `idx_resumes_user_id`, `idx_resumes_status`

---

### 3. **work_experiences** - Work History
User's work experience and employment history.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `company_name` (TEXT)
- `position` (TEXT)
- `location` (TEXT)
- `start_date` (DATE)
- `end_date` (DATE)
- `is_current` (BOOLEAN)
- `description` (TEXT)
- `achievements` (JSONB) - Array of achievements
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Enabled**: Yes  
**Indexes**: `idx_work_experiences_user_id`

---

### 4. **education** - Educational Background
User's educational qualifications.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `institution` (TEXT)
- `degree` (TEXT)
- `field_of_study` (TEXT)
- `location` (TEXT)
- `start_date` (DATE)
- `end_date` (DATE)
- `is_current` (BOOLEAN)
- `gpa` (TEXT)
- `description` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Enabled**: Yes  
**Indexes**: `idx_education_user_id`

---

### 5. **skills** - User Skills
Technical and soft skills with proficiency levels.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT)
- `category` (TEXT) - technical, soft, language, etc.
- `proficiency` (TEXT) - beginner, intermediate, advanced, expert
- `years_of_experience` (INT)
- `created_at` (TIMESTAMP)

**Unique Constraint**: (user_id, name)  
**RLS Enabled**: Yes  
**Indexes**: `idx_skills_user_id`, `idx_skills_category`

---

### 6. **certifications** - Professional Certifications
User's professional certifications and credentials.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT)
- `issuing_organization` (TEXT)
- `issue_date` (DATE)
- `expiry_date` (DATE)
- `credential_id` (TEXT)
- `credential_url` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Enabled**: Yes

---

### 7. **projects** - Portfolio Projects
User's projects and portfolio items.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `title` (TEXT)
- `description` (TEXT)
- `technologies` (JSONB) - Array of technologies used
- `project_url` (TEXT)
- `github_url` (TEXT)
- `start_date` (DATE)
- `end_date` (DATE)
- `is_ongoing` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Enabled**: Yes

---

### 8. **jobs** - Job Listings
Job postings from various sources.

**Columns:**
- `id` (UUID, PK)
- `title` (TEXT)
- `company` (TEXT)
- `company_logo_url` (TEXT)
- `location` (TEXT)
- `job_type` (TEXT) - full-time, part-time, contract, remote
- `salary_min` (INT)
- `salary_max` (INT)
- `salary_currency` (TEXT)
- `description` (TEXT)
- `requirements` (JSONB)
- `responsibilities` (JSONB)
- `benefits` (JSONB)
- `application_url` (TEXT)
- `source` (TEXT) - linkedin, indeed, etc.
- `source_job_id` (TEXT)
- `posted_date` (TIMESTAMP)
- `deadline` (TIMESTAMP)
- `status` (TEXT) - active, closed, filled
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Enabled**: No (public read)  
**Indexes**: `idx_jobs_status`, `idx_jobs_posted_date`, `idx_jobs_company`, `idx_jobs_location`

---

### 9. **applications** - Job Applications
User's job applications and their status.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `job_id` (UUID, FK → jobs)
- `resume_id` (UUID, FK → resumes)
- `cover_letter_id` (UUID)
- `status` (TEXT) - pending, submitted, interviewing, rejected, accepted
- `applied_at` (TIMESTAMP)
- `response_date` (TIMESTAMP)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Enabled**: Yes  
**Indexes**: `idx_applications_user_id`, `idx_applications_job_id`, `idx_applications_status`, `idx_applications_applied_at`

---

### 10. **cover_letters** - Cover Letters
Generated cover letters for job applications.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `job_id` (UUID, FK → jobs)
- `title` (TEXT)
- `content` (TEXT)
- `file_url` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Enabled**: Yes  
**Indexes**: `idx_cover_letters_user_id`, `idx_cover_letters_job_id`

---

### 11. **job_preferences** - User Job Preferences
User's job search preferences and criteria.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `preferred_job_types` (JSONB)
- `preferred_locations` (JSONB)
- `preferred_industries` (JSONB)
- `min_salary` (INT)
- `max_salary` (INT)
- `salary_currency` (TEXT)
- `remote_only` (BOOLEAN)
- `willing_to_relocate` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Unique Constraint**: (user_id)  
**RLS Enabled**: Yes

---

### 12. **job_matches** - AI Job Matching
AI-powered job matching scores and analysis.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `job_id` (UUID, FK → jobs)
- `match_score` (INT) - Score 0-100
- `matching_skills` (JSONB)
- `missing_skills` (JSONB)
- `ai_analysis` (TEXT)
- `created_at` (TIMESTAMP)

**Unique Constraint**: (user_id, job_id)  
**RLS Enabled**: Yes  
**Indexes**: `idx_job_matches_user_id`, `idx_job_matches_job_id`, `idx_job_matches_score`

---

### 13. **application_events** - Application Tracking
Event log for application status changes.

**Columns:**
- `id` (UUID, PK)
- `application_id` (UUID, FK → applications)
- `event_type` (TEXT) - status_change, interview_scheduled, etc.
- `event_data` (JSONB)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)

**RLS Enabled**: Yes  
**Indexes**: `idx_application_events_application_id`, `idx_application_events_created_at`

---

### 14. **email_templates** - Email Templates
User's email templates for follow-ups and networking.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT)
- `subject` (TEXT)
- `body` (TEXT)
- `template_type` (TEXT) - follow_up, thank_you, networking
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Enabled**: Yes

---

### 15. **queue_jobs** - Job Queue System
Background job queue for async processing.

**Columns:**
- `id` (SERIAL, PK)
- `type` (TEXT) - Job type
- `payload` (JSONB) - Job data
- `status` (TEXT) - pending, processing, done, failed
- `attempts` (INT)
- `max_attempts` (INT)
- `locked_at` (TIMESTAMP)
- `priority` (INT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Enabled**: No  
**Indexes**: Multiple indexes for queue performance

---

## Edge Functions (4 Total)

### 1. **generate-resume**
**URL**: `https://hfxdqqeybszlpgtktgps.supabase.co/functions/v1/generate-resume`  
**Status**: ACTIVE  
**JWT Verification**: Disabled

**Purpose**: Generates tailored resumes based on user profile and job requirements.

**Request Body**:
```json
{
  "user_id": "uuid",
  "job_id": "uuid (optional)",
  "template": "modern (optional)"
}
```

**Features**:
- Fetches user profile, experiences, education, skills, certifications, projects
- Optionally tailors to specific job requirements
- Creates resume record in database
- Returns structured resume data

---

### 2. **generate-cover-letter**
**URL**: `https://hfxdqqeybszlpgtktgps.supabase.co/functions/v1/generate-cover-letter`  
**Status**: ACTIVE  
**JWT Verification**: Disabled

**Purpose**: Generates personalized cover letters for job applications.

**Request Body**:
```json
{
  "user_id": "uuid",
  "job_id": "uuid"
}
```

**Features**:
- Fetches user profile and job details
- Generates personalized cover letter content
- Stores cover letter in database
- Returns generated content

---

### 3. **apply-job**
**URL**: `https://hfxdqqeybszlpgtktgps.supabase.co/functions/v1/apply-job`  
**Status**: ACTIVE  
**JWT Verification**: Disabled

**Purpose**: Submits job applications and tracks application status.

**Request Body**:
```json
{
  "user_id": "uuid",
  "job_id": "uuid",
  "resume_id": "uuid (optional)",
  "cover_letter_id": "uuid (optional)"
}
```

**Features**:
- Validates no duplicate applications
- Creates application record
- Logs application event
- Returns application confirmation

---

### 4. **fetch-jobs**
**URL**: `https://hfxdqqeybszlpgtktgps.supabase.co/functions/v1/fetch-jobs`  
**Status**: ACTIVE  
**JWT Verification**: Disabled

**Purpose**: Fetches job listings from external sources.

**Request Body**:
```json
{
  "source": "all (optional)",
  "keywords": [],
  "location": ""
}
```

**Features**:
- Fetches jobs from multiple sources
- Avoids duplicate job entries
- Stores jobs in database
- Returns fetch statistics

---

## Row Level Security (RLS)

All user-related tables have RLS enabled with policies:
- Users can only view/manage their own data
- Jobs table is publicly readable (active jobs only)
- Service role has full access for background jobs

## Auto-Updating Timestamps

All tables with `updated_at` columns have triggers that automatically update the timestamp on row updates.

## Next Steps

1. **Integrate AI Services**: Add OpenAI/Anthropic for resume and cover letter generation
2. **PDF Generation**: Implement document generation service
3. **Job Board APIs**: Connect to LinkedIn, Indeed, etc. for real job data
4. **ATS Integration**: Implement application submission to various ATS systems
5. **Email Notifications**: Set up email service for application tracking
6. **Analytics**: Add job match scoring algorithm

---

## Testing the Schema

You can test the database connection from your Fastify app:

```bash
curl http://localhost:3000/queue/stats
```

Or directly query Supabase:

```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(10);
```

---

**Schema Version**: 1.0  
**Last Updated**: 2024-12-31  
**Deployed By**: Supabase MCP Server
