# Resume Analysis System Enhancement - Task List

## Overview
This document tracks all tasks for implementing the enhanced resume analysis system with duplicate detection, improved database schema, and performance optimizations.

## Database Schema Changes

### High Priority
- [ ] **Create `resume_uploads` table migration**
  - Add fields: `id`, `user_id`, `file_path`, `file_name`, `file_type`, `file_size`, `upload_time`
  - Add duplicate detection fields: `email_hash`, `phone_hash`, `content_hash`
  - Add extracted data fields: `extracted_email`, `extracted_phone`
  - Set up RLS policies and permissions

- [ ] **Create `resume_analyses` table migration**
  - Add fields: `id`, `resume_upload_id` (FK), `job_title`, `analysis_date`
  - Add individual score fields: `ats_score`, `tone_score`, `content_score`, `structure_score`, `skills_score`, `email_score`, `length_score`, `brevity_score`
  - Add `overall_score` (calculated average)
  - Add JSONB fields: `score_breakdown`, `suggestions`, `tips`
  - Add `n8n_response` JSONB field for full webhook data
  - Set up RLS policies and permissions

- [ ] **Apply database migrations**
  - Run migrations on Supabase
  - Verify table creation and permissions
  - Test foreign key relationships

### Medium Priority
- [ ] **Data migration from existing `resume_analyses` table**
  - Create migration script to transfer existing data
  - Map old schema to new two-table structure
  - Preserve existing analysis data
  - Verify data integrity after migration

## Backend Implementation

### High Priority
- [ ] **Update upload API (`/api/upload-to-supabase-analyses/route.ts`)**
  - Extract email and phone from resume content
  - Generate content hash (MD5/SHA-256)
  - Create composite hash from email + phone + content
  - Check for existing duplicates before processing
  - Insert into `resume_uploads` table
  - Return upload ID and duplicate status

- [ ] **Update resume-analysis edge function**
  - Modify to work with new `resume_analyses` table
  - Accept `resume_upload_id` instead of creating new records
  - Parse n8n webhook response into individual score fields
  - Calculate `overall_score` as average of individual scores
  - Store full n8n response in `n8n_response` JSONB field
  - Handle duplicate detection logic

- [ ] **Implement duplicate detection logic**
  - Create hash generation utilities
  - Implement email/phone extraction from PDF
  - Add duplicate checking before analysis
  - Return existing analysis for duplicates

### Medium Priority
- [ ] **Add email/phone extraction service**
  - Implement PDF text extraction
  - Create regex patterns for email/phone detection
  - Add validation for extracted data
  - Handle edge cases (multiple emails/phones)

- [ ] **Create hash generation utilities**
  - Implement MD5/SHA-256 hashing functions
  - Create composite hash generation
  - Add salt for security (optional)

## Frontend Implementation

### High Priority
- [ ] **Update ScoreDashboard component**
  - Display individual scores (ATS, tone, content, structure, skills, email, length, brevity)
  - Show overall score prominently
  - Render tips and suggestions from JSONB fields
  - Add loading states for better UX

- [ ] **Update resume upload page**
  - Handle duplicate detection responses
  - Show duplicate warning to users
  - Provide option to re-analyze or view existing analysis
  - Add progress indicators

- [ ] **Enhance error handling**
  - Add specific error messages for duplicate detection
  - Improve network error handling
  - Add retry mechanisms for failed requests

### Medium Priority
- [ ] **Add duplicate management UI**
  - Show list of user's previous uploads
  - Allow users to view/compare analyses
  - Provide option to delete old analyses

- [ ] **Implement progressive loading**
  - Show partial results as they become available
  - Add skeleton loaders for better UX
  - Implement real-time updates via polling/websockets

## Performance Optimizations

### High Priority
- [ ] **Implement caching strategy**
  - Cache analysis results in database
  - Add Redis/memory caching for frequent queries
  - Implement cache invalidation logic

- [ ] **Optimize n8n webhook calls**
  - Move to background processing
  - Implement queue system for analysis requests
  - Add webhook response caching

### Medium Priority
- [ ] **Add database indexing**
  - Index on `email_hash`, `phone_hash`, `content_hash`
  - Index on `user_id` and `upload_time`
  - Optimize query performance

- [ ] **Implement background job processing**
  - Set up job queue (Bull/Agenda)
  - Move heavy processing to background
  - Add job status tracking

## Testing & Validation

### High Priority
- [ ] **Test duplicate detection**
  - Upload same resume multiple times
  - Verify hash generation accuracy
  - Test email/phone extraction

- [ ] **Test database operations**
  - Verify foreign key relationships
  - Test RLS policies
  - Validate data integrity

- [ ] **Test n8n webhook integration**
  - Verify response parsing
  - Test score calculation
  - Validate JSONB storage

### Medium Priority
- [ ] **Performance testing**
  - Load test with multiple concurrent uploads
  - Measure response times
  - Test caching effectiveness

- [ ] **End-to-end testing**
  - Test complete user flow
  - Verify UI updates
  - Test error scenarios

## Security & Compliance

### High Priority
- [ ] **Review RLS policies**
  - Ensure users can only access their own data
  - Test policy enforcement
  - Add audit logging

- [ ] **Secure hash storage**
  - Review hash generation security
  - Consider adding salt to hashes
  - Implement secure comparison methods

### Medium Priority
- [ ] **Add rate limiting**
  - Limit upload frequency per user
  - Prevent abuse of analysis endpoints
  - Add monitoring and alerting

## Deployment & Monitoring

### High Priority
- [ ] **Deploy database changes**
  - Apply migrations to production
  - Monitor for issues
  - Prepare rollback plan

- [ ] **Deploy backend updates**
  - Update edge functions
  - Deploy API changes
  - Test in production environment

### Medium Priority
- [ ] **Add monitoring and logging**
  - Track duplicate detection rates
  - Monitor analysis processing times
  - Add error tracking and alerting

- [ ] **Performance monitoring**
  - Set up APM tools
  - Monitor database performance
  - Track user experience metrics

## Documentation

### Low Priority
- [ ] **Update API documentation**
  - Document new endpoints
  - Update request/response schemas
  - Add examples for duplicate detection

- [ ] **Create user documentation**
  - Explain duplicate detection feature
  - Document new scoring system
  - Add troubleshooting guide

---

## Notes
- Tasks are organized by priority: High (critical for MVP), Medium (important for full feature), Low (nice-to-have)
- Dependencies between tasks should be considered when planning implementation order
- Regular testing should be performed after each major component is implemented
- Consider implementing feature flags for gradual rollout of new functionality

## Progress Tracking
- **Total Tasks**: 47
- **Completed**: 0
- **In Progress**: 0
- **Remaining**: 47

Last Updated: $(date)