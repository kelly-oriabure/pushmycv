# Resume Builder Form Tables - Database Schema Summary

**Created:** December 2024  
**Project:** JobEasy - Resume Builder Database Tables  
**Status:** ✅ All tables created successfully

---

## Overview

Created **8 database tables** for storing resume form data, replacing the JSONB storage approach with normalized relational tables. Each table has proper foreign key relationships with the `resumes` table and comprehensive Row Level Security (RLS) policies.

---

## Tables Created

### 1. **resume_personal_details** (1:1 relationship with resumes)
**Purpose:** Stores personal information for each resume

**Fields:**
- `id` (UUID, Primary Key)
- `resume_id` (UUID, Foreign Key → resumes.id, UNIQUE)
- `job_title` (TEXT, nullable)
- `photo_url` (TEXT, nullable)
- `first_name` (TEXT, NOT NULL)
- `last_name` (TEXT, NOT NULL)
- `email` (TEXT, NOT NULL)
- `phone` (TEXT, NOT NULL)
- `address` (TEXT, nullable)
- `city_state` (TEXT, nullable)
- `country` (TEXT, nullable)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_resume_personal_details_resume_id`

**Constraints:**
- Unique constraint on `resume_id` (one record per resume)

---

### 2. **resume_professional_summary** (1:1 relationship with resumes)
**Purpose:** Stores professional summary/profile text

**Fields:**
- `id` (UUID, Primary Key)
- `resume_id` (UUID, Foreign Key → resumes.id, UNIQUE)
- `summary` (TEXT, default: empty string)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_resume_professional_summary_resume_id`

**Constraints:**
- Unique constraint on `resume_id` (one record per resume)

---

### 3. **resume_education** (1:many relationship with resumes)
**Purpose:** Stores education entries (multiple per resume)

**Fields:**
- `id` (UUID, Primary Key)
- `resume_id` (UUID, Foreign Key → resumes.id)
- `school` (TEXT, NOT NULL)
- `degree` (TEXT, NOT NULL)
- `start_date` (TEXT, NOT NULL) - Format: YYYY-MM
- `end_date` (TEXT, NOT NULL) - Format: YYYY-MM
- `location` (TEXT, nullable)
- `description` (TEXT, nullable) - Rich text HTML content
- `display_order` (INTEGER, default: 0)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_resume_education_resume_id`
- `idx_resume_education_display_order`

---

### 4. **resume_employment_history** (1:many relationship with resumes)
**Purpose:** Stores employment/work experience entries (multiple per resume)

**Fields:**
- `id` (UUID, Primary Key)
- `resume_id` (UUID, Foreign Key → resumes.id)
- `job_title` (TEXT, NOT NULL)
- `employer` (TEXT, NOT NULL)
- `start_date` (TEXT, NOT NULL) - Format: YYYY-MM
- `end_date` (TEXT, NOT NULL) - Format: YYYY-MM
- `location` (TEXT, nullable)
- `description` (TEXT, nullable) - Rich text HTML content
- `display_order` (INTEGER, default: 0)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_resume_employment_history_resume_id`
- `idx_resume_employment_history_display_order`

---

### 5. **resume_skills** (1:many relationship with resumes)
**Purpose:** Stores skill entries with proficiency levels (multiple per resume)

**Fields:**
- `id` (UUID, Primary Key)
- `resume_id` (UUID, Foreign Key → resumes.id)
- `name` (TEXT, NOT NULL)
- `level` (INTEGER, NOT NULL, default: 100) - Range: 0-100
- `display_order` (INTEGER, default: 0)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_resume_skills_resume_id`
- `idx_resume_skills_display_order`

**Constraints:**
- Check constraint: `level >= 0 AND level <= 100`

---

### 6. **resume_languages** (1:many relationship with resumes)
**Purpose:** Stores language entries (multiple per resume)

**Fields:**
- `id` (UUID, Primary Key)
- `resume_id` (UUID, Foreign Key → resumes.id)
- `name` (TEXT, NOT NULL) - e.g., "English (Native)", "Spanish (Fluent)"
- `display_order` (INTEGER, default: 0)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_resume_languages_resume_id`
- `idx_resume_languages_display_order`

---

### 7. **resume_references** (1:many relationship with resumes)
**Purpose:** Stores reference entries (multiple per resume)

**Fields:**
- `id` (UUID, Primary Key)
- `resume_id` (UUID, Foreign Key → resumes.id)
- `name` (TEXT, NOT NULL)
- `company` (TEXT, nullable) - Company and job title
- `phone` (TEXT, nullable)
- `email` (TEXT, nullable)
- `display_order` (INTEGER, default: 0)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_resume_references_resume_id`
- `idx_resume_references_display_order`

---

### 8. **resume_references_settings** (1:1 relationship with resumes)
**Purpose:** Stores reference visibility settings

**Fields:**
- `id` (UUID, Primary Key)
- `resume_id` (UUID, Foreign Key → resumes.id, UNIQUE)
- `hide_references` (BOOLEAN, default: false)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_resume_references_settings_resume_id`

**Constraints:**
- Unique constraint on `resume_id` (one settings record per resume)

---

### 9. **resume_courses** (1:many relationship with resumes)
**Purpose:** Stores course/certification entries (multiple per resume)

**Fields:**
- `id` (UUID, Primary Key)
- `resume_id` (UUID, Foreign Key → resumes.id)
- `course` (TEXT, NOT NULL) - Course name
- `institution` (TEXT, NOT NULL)
- `start_date` (TEXT, NOT NULL) - Format: YYYY-MM
- `end_date` (TEXT, NOT NULL) - Format: YYYY-MM
- `display_order` (INTEGER, default: 0)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_resume_courses_resume_id`
- `idx_resume_courses_display_order`

---

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with comprehensive policies:

**Policies Applied:**
1. **SELECT** - Users can only view their own resume data
2. **INSERT** - Users can only insert data for their own resumes
3. **UPDATE** - Users can only update their own resume data
4. **DELETE** - Users can only delete their own resume data

**Policy Logic:**
All policies check ownership via:
```sql
EXISTS (
    SELECT 1 FROM resumes
    WHERE resumes.id = <table>.resume_id
    AND resumes.user_id = auth.uid()
)
```

This ensures that:
- Users can only access resumes they own
- Foreign key relationships maintain data integrity
- Cascading deletes work correctly (when a resume is deleted, all related data is deleted)

---

## Database Features

### Foreign Key Constraints
All tables have foreign key constraints to `resumes.id` with `ON DELETE CASCADE`:
- When a resume is deleted, all related form data is automatically deleted
- Maintains referential integrity

### Automatic Timestamps
All tables include:
- `created_at` - Set automatically on INSERT
- `updated_at` - Set automatically on UPDATE via triggers

### Display Order
All "many" tables include `display_order` field:
- Allows ordering of entries (education, employment, skills, etc.)
- Default value: 0
- Indexed for efficient sorting queries

### Indexes
Performance indexes created for:
- Foreign key lookups (`resume_id`)
- Display order sorting (`resume_id, display_order`)

---

## Data Types Used

### Text Fields
- **TEXT** - Used for all string fields (flexible, no length limit)
- Supports rich text HTML content in description fields

### UUID
- **UUID** - Used for all primary keys and foreign keys
- Generated automatically using `gen_random_uuid()`

### Integer
- **INTEGER** - Used for:
  - Skill level (0-100)
  - Display order

### Boolean
- **BOOLEAN** - Used for:
  - Hide references setting

### Timestamps
- **TIMESTAMPTZ** - Used for:
  - Created at
  - Updated at
- Automatically set via triggers

---

## Migration Files Created

1. `create_resume_personal_details_table`
2. `create_resume_professional_summary_table`
3. `create_resume_education_table`
4. `create_resume_employment_history_table`
5. `create_resume_skills_table`
6. `create_resume_languages_table`
7. `create_resume_references_table` (includes settings table)
8. `create_resume_courses_table`

---

## Relationships Summary

```
resumes (1) ──── (1) resume_personal_details
          │
          ├── (1) resume_professional_summary
          │
          ├── (1) resume_references_settings
          │
          ├── (M) resume_education
          │
          ├── (M) resume_employment_history
          │
          ├── (M) resume_skills
          │
          ├── (M) resume_languages
          │
          ├── (M) resume_references
          │
          └── (M) resume_courses
```

---

## Next Steps

### Frontend Integration
1. Update repository layer to use new tables instead of JSONB
2. Modify sync service to write to normalized tables
3. Update data loading logic to fetch from tables
4. Create migration script to move existing JSONB data to tables (if needed)

### Benefits of Normalized Tables
- ✅ Better query performance (indexed fields)
- ✅ Easier to query specific sections
- ✅ Better data integrity (foreign keys)
- ✅ Easier to add new features (analytics, reporting)
- ✅ Better support for complex queries
- ✅ Easier to maintain and debug

---

## Security Notes

⚠️ **Security Advisor Warnings:**
- Some trigger functions have mutable search_path warnings (non-critical)
- These are PostgreSQL best practices but don't affect functionality
- Can be fixed by adding `SET search_path = ''` to functions

✅ **RLS Policies:**
- All tables have proper RLS policies
- Users can only access their own data
- Policies are enforced at the database level

---

**Status:** ✅ All tables created successfully with proper relationships and security policies

