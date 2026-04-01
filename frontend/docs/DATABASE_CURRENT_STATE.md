# JobEazy Database - Current State Analysis

**Generated**: 2025-10-03  
**Database**: jobeazydb (embugkjoeyfukdotmgyg)  
**Region**: eu-north-1  
**Status**: ACTIVE_HEALTHY  
**PostgreSQL Version**: 17.4.1.068

---

## EXECUTIVE SUMMARY

### Database Health
- Status: Active and Healthy
- RLS Enabled: All tables have Row Level Security enabled
- Indexes: Critical hash indexes are present (CRIT-001 RESOLVED)
- Data: 9 resumes, 7 uploads, 7 analyses (some failed/processing)

### Critical Findings
1. Hash indexes exist - CRIT-001 from task plan is already resolved
2. Unique constraint on composite_hash - CRIT-006 is already resolved
3. Resume analyses have failures - 2 failed, 3 stuck in processing
4. Schema mismatch - upload_id in resume_analyses is nullable (should be NOT NULL per plan)
5. Foreign key relationships - All properly configured with CASCADE deletes

---

## TABLE STRUCTURE

### Core Tables

#### 1. resumes (Main Resume Entity)
- Rows: 9
- RLS: Enabled
- Primary Key: id (UUID)
- Foreign Keys: 
  - user_id to auth.users.id (CASCADE)
  - template_id to templates.uuid (SET NULL)

**Columns**:
- id (UUID, PK)
- title (TEXT, default: Untitled Resume)
- user_id (UUID, NOT NULL)
- template_id (UUID, nullable)
- template_name (TEXT, nullable) - DENORMALIZED DATA ISSUE
- color (TEXT, nullable)
- custom_sections (JSONB, nullable)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

**Indexes**:
- idx_resumes_user_id
- idx_resumes_template_id

**Issues**:
- template_name is denormalized (HIGH-002 in task plan)

---

#### 2. resume_uploads (File Upload Management)
- Rows: 7
- RLS: Enabled
- Primary Key: id (UUID)
- Foreign Keys:
  - user_id to auth.users.id (CASCADE)

**Columns**:
- id (UUID, PK)
- user_id (UUID, NOT NULL)
- file_name (TEXT, NOT NULL)
- file_path (TEXT, NOT NULL)
- file_type (TEXT, NOT NULL)
- file_size (INTEGER, nullable)
- resume_url (TEXT, NOT NULL)
- pdf_url (TEXT, nullable)
- content_hash (TEXT, nullable)
- email_hash (TEXT, nullable)
- phone_hash (TEXT, nullable)
- extracted_email (TEXT, nullable)
- extracted_phone (TEXT, nullable)
- composite_hash (TEXT, nullable)
- extracted_text (TEXT, nullable)
- image_url (TEXT, nullable)
- upload_time (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

**Indexes** (ALL PRESENT):
- idx_resume_uploads_user_id
- idx_resume_uploads_content_hash
- idx_resume_uploads_email_hash
- idx_resume_uploads_phone_hash
- idx_resume_uploads_composite_hash
- idx_resume_uploads_duplicate_detection (user_id, content_hash, email_hash, phone_hash)
- idx_resume_uploads_created_at
- idx_resume_uploads_image_url
- resume_uploads_composite_hash_uidx (UNIQUE WHERE composite_hash IS NOT NULL)

**Status**: All critical indexes from CRIT-001 are present

---

#### 3. resume_analyses (Analysis Results)
- Rows: 7
- RLS: Enabled
- Primary Key: id (UUID)
- Foreign Keys:
  - user_id to auth.users.id (CASCADE)
  - upload_id to resume_uploads.id

**Columns**:
- id (UUID, PK)
- user_id (UUID, NOT NULL)
- upload_id (UUID, nullable) - SHOULD BE NOT NULL
- file_path (TEXT, NOT NULL)
- file_name (TEXT, NOT NULL)
- job_title (TEXT, NOT NULL)
- status (TEXT, default: processing) - CHECK: processing, completed, failed
- error_message (TEXT, nullable)
- overall_score (INTEGER, 0-100)
- ats_score (INTEGER, 0-100)
- tone_score (INTEGER, 0-100)
- content_score (INTEGER, 0-100)
- structure_score (INTEGER, 0-100)
- skills_score (INTEGER, 0-100)
- email_score (INTEGER, 0-100)
- length_score (INTEGER, 0-100)
- brevity_score (INTEGER, 0-100)
- score_breakdown (JSONB, nullable)
- suggestions (JSONB, nullable)
- ats_tips (JSONB, nullable)
- tone_tips (JSONB, nullable)
- content_tips (JSONB, nullable)
- structure_tips (JSONB, nullable)
- skills_tips (JSONB, nullable)
- email_tips (JSONB, nullable)
- length_tips (JSONB, nullable)
- brevity_tips (JSONB, nullable)
- image_url (TEXT, nullable)
- pdf_url (TEXT, nullable)
- extracted_text (TEXT, nullable)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

**Additional Columns** (Extended schema):
- ats_type, ats_tips_tip, ats_explanation
- tonestyle_score, tonestyle_tips_tip, tonestyle_tips_type, tonestyle_explanation
- content_tips_tip, content_type, content_explanation
- structure_tips_tip, structure_tips_type, structure_explanation
- skills_type, skills_tips_tip, skills_explanation
- email_tips_tip, email_tips_type, email_explanation
- length_tips_type, length_tips_tip, length_explanation
- brevity_tips_tip, brevity_tips_type, brevity_tips_explanation

**Indexes**:
- idx_resume_analyses_user_id
- idx_resume_analyses_status
- idx_resume_analyses_created_at
- idx_resume_analyses_job_title

**Current Data Status**:
- 2 analyses: FAILED
- 3 analyses: PROCESSING (stuck)
- 2 analyses: Unknown status

**Issues**:
- upload_id should be NOT NULL (schema inconsistency)
- Stuck processing records need investigation
- Failed analyses need error review

---

#### 4. personal_details (Resume Personal Info)
- Rows: 9
- RLS: Enabled
- Primary Key: id (UUID)
- Foreign Keys:
  - resume_id to resumes.id (CASCADE)
- Unique Constraint: One record per resume_id

**Columns**:
- id (UUID, PK)
- resume_id (UUID, NOT NULL, UNIQUE)
- job_title (TEXT, nullable)
- first_name (TEXT, nullable)
- last_name (TEXT, nullable)
- email (TEXT, nullable)
- phone (TEXT, nullable)
- address (TEXT, nullable)
- city_state (TEXT, nullable)
- country (TEXT, nullable)
- photo_url (TEXT, nullable)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

**Indexes**:
- idx_personal_details_resume_id
- idx_personal_details_email
- idx_personal_details_name (first_name, last_name)

---

#### 5. education (Education History)
- Rows: 6
- RLS: Enabled
- Primary Key: id (UUID)
- Foreign Keys:
  - resume_id to resumes.id (CASCADE)

**Columns**:
- id (UUID, PK)
- resume_id (UUID, NOT NULL)
- school (TEXT, NOT NULL)
- degree (TEXT, nullable)
- start_date (DATE, nullable)
- end_date (DATE, nullable)
- location (TEXT, nullable)
- description (TEXT, nullable)
- created_at (TIMESTAMPTZ)

---

#### 6. experience (Work Experience)
- Rows: 5
- RLS: Enabled
- Primary Key: id (UUID)
- Foreign Keys:
  - resume_id to resumes.id (CASCADE)

**Columns**:
- id (UUID, PK)
- resume_id (UUID, NOT NULL)
- employer (TEXT, NOT NULL)
- jobTitle (TEXT, NOT NULL) - camelCase preserved
- start_date (DATE, nullable)
- end_date (DATE, nullable)
- location (TEXT, nullable)
- description (TEXT, nullable)
- created_at (TIMESTAMPTZ)

---

#### 7. skills (Skills List)
- Rows: 12
- RLS: Enabled
- Primary Key: id (UUID)
- Foreign Keys:
  - resume_id to resumes.id (CASCADE)

**Columns**:
- id (UUID, PK)
- resume_id (UUID, NOT NULL)
- name (TEXT, NOT NULL)
- level (INTEGER, 1-5)
- created_at (TIMESTAMPTZ)

---

#### 8. languages (Language Proficiency)
- Rows: 5
- RLS: Enabled
- Primary Key: id (UUID)
- Foreign Keys:
  - resume_id to resumes.id (CASCADE)

**Columns**:
- id (UUID, PK)
- resume_id (UUID, NOT NULL)
- name (TEXT, NOT NULL)
- created_at (TIMESTAMPTZ)

---

#### 9. references (Professional References)
- Rows: 4
- RLS: Enabled
- Primary Key: id (UUID)
- Foreign Keys:
  - resume_id to resumes.id (CASCADE)

**Columns**:
- id (UUID, PK)
- resume_id (UUID, NOT NULL)
- name (TEXT, NOT NULL)
- company (TEXT, nullable)
- phone (TEXT, nullable)
- email (TEXT, nullable)
- created_at (TIMESTAMPTZ)

---

#### 10. courses (Courses/Certifications)
- Rows: 3
- RLS: Enabled
- Primary Key: id (UUID)
- Foreign Keys:
  - resume_id to resumes.id (CASCADE)

**Columns**:
- id (UUID, PK)
- resume_id (UUID, NOT NULL)
- course (TEXT, NOT NULL)
- institution (TEXT, nullable)
- start_date (DATE, nullable)
- end_date (DATE, nullable)
- description (TEXT, nullable)
- created_at (TIMESTAMPTZ)

---

#### 11. professional_summaries (Resume Summaries)
- Rows: 3
- RLS: Enabled
- Primary Key: id (UUID)
- Foreign Keys:
  - resume_id to resumes.id (CASCADE)

**Columns**:
- id (UUID, PK)
- resume_id (UUID, NOT NULL)
- content (TEXT, NOT NULL)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

---

#### 12. internships (Internship Experience)
- Rows: 0
- RLS: Enabled
- Primary Key: id (UUID)
- Foreign Keys:
  - resume_id to resumes.id (CASCADE)

**Columns**:
- id (UUID, PK)
- resume_id (UUID, NOT NULL)
- employer (TEXT, NOT NULL)
- jobTitle (TEXT, NOT NULL) - camelCase preserved
- start_date (DATE, nullable)
- end_date (DATE, nullable)
- location (TEXT, nullable)
- description (TEXT, nullable)
- created_at (TIMESTAMPTZ)

---

### Supporting Tables

#### templates
- Rows: 0
- RLS: Enabled
- Primary Key: uuid (UUID)
- Foreign Keys:
  - category_id to template_categories.id

**Columns**:
- uuid (UUID, PK)
- name (TEXT, NOT NULL)
- description (TEXT, nullable)
- thumbnail_url (TEXT, nullable)
- is_premium (BOOLEAN, default: false)
- category_id (UUID, nullable)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

**Issue**: No templates in database (MED-004 - move templates to database)

---

#### template_categories
- Rows: 0
- RLS: Enabled
- Primary Key: id (UUID)

**Columns**:
- id (UUID, PK)
- name (TEXT, NOT NULL)
- description (TEXT, nullable)

---

#### profiles
- Rows: 0
- RLS: Enabled
- Primary Key: id (UUID)
- Foreign Keys:
  - id to auth.users.id

**Columns**:
- id (UUID, PK)
- avatar_url (TEXT, nullable)
- email (TEXT, nullable)
- full_name (TEXT, nullable)
- has_onboarded (BOOLEAN, default: false)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

---

## TASK PLAN STATUS UPDATE

### CRITICAL TASKS - Status Check

#### CRIT-001: Missing Database Indexes
**Status**: RESOLVED
**Evidence**: All hash indexes are present:
- idx_resume_uploads_composite_hash
- idx_resume_uploads_email_hash
- idx_resume_uploads_phone_hash
- idx_resume_uploads_content_hash
- idx_resume_uploads_duplicate_detection (composite index)

#### CRIT-006: Missing Unique Constraint
**Status**: RESOLVED
**Evidence**: Unique index exists:
- resume_uploads_composite_hash_uidx (UNIQUE WHERE composite_hash IS NOT NULL)

### NEW ISSUES DISCOVERED

#### ISSUE-001: Resume Analyses Stuck in Processing
**Severity**: HIGH
**Description**: 3 resume analyses stuck in processing status
**Impact**: Users not getting analysis results
**Recommended Action**: 
- Investigate edge function execution
- Check n8n webhook integration
- Add timeout mechanism
- Implement retry logic

#### ISSUE-002: Failed Resume Analyses
**Severity**: HIGH
**Description**: 2 resume analyses with failed status
**Impact**: Poor user experience
**Recommended Action**:
- Review error_message field for details
- Fix edge function error handling
- Implement better error reporting to users

#### ISSUE-003: upload_id Nullable in resume_analyses
**Severity**: MEDIUM
**Description**: upload_id should be NOT NULL but is nullable
**Impact**: Data integrity issue
**Recommended Action**:
- Create migration to make upload_id NOT NULL
- Ensure all existing records have upload_id
- Update application code to always provide upload_id

#### ISSUE-004: No Templates in Database
**Severity**: MEDIUM
**Description**: Templates table is empty
**Impact**: Template system not fully functional
**Recommended Action**: MED-004 - Seed templates from static data

#### ISSUE-005: Denormalized Template Name
**Severity**: MEDIUM
**Description**: template_name stored in resumes table
**Impact**: Data inconsistency risk
**Recommended Action**: HIGH-002 - Normalize schema

---

## SECURITY ANALYSIS

### Row Level Security (RLS)
**Status**: ENABLED on all tables

### RLS Policies
All tables have standard policies:
- Users can view own records
- Users can insert own records
- Users can update own records
- Users can delete own records

### Missing Security Features (from task plan)
1. CRIT-011: No PII encryption
2. CRIT-012: Hashes not salted
3. CRIT-004: No rate limiting (application layer)

---

## PERFORMANCE ANALYSIS

### Index Coverage
**Status**: EXCELLENT
- All critical hash indexes present
- Composite index for duplicate detection
- User_id indexes on all tables
- Created_at indexes for sorting

### Query Performance
**Expected**: Good performance for:
- Duplicate detection queries
- User-specific data retrieval
- Resume section loading

### Potential Bottlenecks
1. Large JSONB columns in resume_analyses (score_breakdown, suggestions, tips)
2. No index on resume_analyses.upload_id (should add)
3. Text search on extracted_text not indexed

---

## DATA INTEGRITY

### Foreign Key Relationships
**Status**: PROPERLY CONFIGURED
- All CASCADE deletes configured
- No orphaned records expected

### Constraints
- CHECK constraints on scores (0-100)
- UNIQUE constraint on personal_details.resume_id
- UNIQUE constraint on resume_uploads.composite_hash (when not null)

### Data Quality Issues
1. Some resume_uploads missing email_hash and phone_hash
2. Resume analyses stuck in processing
3. No data in templates table

---

## RECOMMENDATIONS

### Immediate Actions
1. Investigate stuck resume analyses
2. Review failed analysis error messages
3. Add index on resume_analyses.upload_id
4. Make upload_id NOT NULL in resume_analyses

### Short-term Actions
1. Seed templates table (MED-004)
2. Implement hash salting (CRIT-012)
3. Add PII encryption (CRIT-011)
4. Normalize template_name (HIGH-002)

### Long-term Actions
1. Implement full-text search on extracted_text
2. Add data archival strategy for old analyses
3. Implement analytics tables
4. Add audit logging tables

---

## MIGRATION NEEDS

### Required Migrations
1. Make resume_analyses.upload_id NOT NULL
2. Add index on resume_analyses.upload_id
3. Remove template_name from resumes table
4. Add salt to hash generation (application layer)

### Data Cleanup
1. Fix or delete stuck processing records
2. Investigate failed analyses
3. Populate missing hash values

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-03  
**Next Review**: After implementing critical fixes
