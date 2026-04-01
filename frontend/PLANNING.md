# JobEazy Project Planning

## Project Overview
JobEazy is a resume builder and job application management platform with AI-powered resume extraction and analysis capabilities.

## Architecture

### Core Technologies
- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **AI Services**: OpenRouter (GPT-4o-mini) for resume extraction
- **Storage**: Supabase Storage for PDF files
- **Authentication**: Supabase Auth

### Key Features
1. **Resume Builder** - Modular resume builder with multiple templates
2. **AI Resume Extraction** - Automatic parsing of uploaded PDFs
3. **Resume Analysis** - n8n workflow for resume scoring
4. **Duplicate Detection** - Hash-based duplicate resume detection
5. **Secure PII Storage** - Encrypted storage for personal information

## Code Structure

### File Organization
- `/app` - Next.js app directory
  - `/api` - API routes
  - `/components` - React components
  - `/hooks` - Custom React hooks
  - `/lib` - Utility libraries and services
  - `/store` - State management (Zustand)
  - `/types` - TypeScript type definitions
- `/supabase/migrations` - Database migrations
- `/tests` - Unit tests (Pytest-style for TypeScript)
- `/docs` - Documentation

### Naming Conventions
- **Files**: camelCase for components, kebab-case for utilities
- **Components**: PascalCase
- **Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE

### Modular Architecture
- **Services**: Business logic layer (`/lib/services`)
- **Repositories**: Database access layer (`/lib/repositories`)
- **Adapters**: Integration layer (`/lib/adapters`)
- **Orchestrators**: Workflow coordination (`/lib/services/*Orchestrator.ts`)

## Database Schema

### Core Tables
- `resumes` - Main resume records
- `resume_uploads` - Uploaded PDF files and metadata
- `resume_analyses` - Resume analysis results from n8n
- `personal_details` - Personal information (plain text - legacy)
- `personal_details_secure` - Encrypted personal information (new)
- `education` - Education history
- `experience` - Work experience
- `skills` - Skills list
- `languages` - Languages spoken
- `courses` - Courses and certifications
- `professional_summaries` - Professional summary text

### Security
- **RLS Policies**: Row-level security on all tables
- **Encryption**: PII encrypted at rest in `*_secure` tables
- **Hashing**: Salted SHA-256 hashes for duplicate detection

## AI Resume Extraction Workflow

### Process Flow
1. User uploads PDF → `POST /api/process-resume-upload`
2. PDF text extracted → stored in `resume_uploads.extracted_text`
3. Resume record created → `resumes` table
4. Async AI extraction triggered → `POST /api/extract-resume-data`
5. AI extracts structured data → OpenRouter API
6. Data inserted into section tables → `personal_details`, `education`, etc.
7. Extraction status updated → `resumes.extraction_status`

### Key Files
- `app/lib/services/aiResumeExtractor.ts` - AI extraction service
- `app/api/extract-resume-data/route.ts` - Extraction API endpoint
- `app/api/process-resume-upload/route.ts` - Upload handler
- `supabase/migrations/025_add_extraction_status.sql` - Status tracking

## Style Guidelines

### Code Style
- **Max file length**: 500 lines
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Comments**: JSDoc for functions, inline for complex logic

### Component Patterns
- Functional components with hooks
- Props destructuring
- Early returns for error states
- Separate business logic from UI

### Error Handling
- Try-catch blocks for async operations
- Meaningful error messages
- Logging for debugging
- User-friendly error displays

## Testing Strategy

### Unit Tests
- Location: `/tests` directory mirroring `/app` structure
- Framework: Jest/Vitest with React Testing Library
- Coverage: Minimum 1 happy path, 1 edge case, 1 failure case
- Naming: `*.test.ts` or `*.test.tsx`

### Test Requirements
- Test new features before merging
- Update tests when logic changes
- Mock external dependencies
- Test error scenarios

## Development Workflow

### Task Management
- Track tasks in `TASK.md`
- Mark completed tasks immediately
- Add discovered tasks during development
- Include dates for all tasks

### Git Workflow
- Feature branches for new work
- Descriptive commit messages
- Review before merging
- Keep commits focused and atomic

## Known Issues & Constraints

### Current Challenges
1. **Dual Table System**: Both `personal_details` and `personal_details_secure` exist
2. **Migration Status**: Some migrations may not be applied in all environments
3. **Service Role Auth**: Internal API calls use service role key for authentication

### Technical Debt
- Consolidate secure and non-secure PII tables
- Improve error handling in extraction flow
- Add comprehensive logging
- Implement retry mechanisms

## Future Enhancements

### Planned Features
- Multi-language support for extraction
- Batch resume processing
- Advanced duplicate detection
- Resume version history
- Template customization

### Performance Optimizations
- Caching strategies
- Database query optimization
- Edge function deployment
- CDN for static assets

## Environment Variables

### Required
- `OPENROUTER_API_KEY` - OpenRouter API key for AI extraction
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_APP_URL` - Application URL

### Optional
- `NODE_ENV` - Environment (development/production)
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase key

## Documentation

### Key Documents
- `TASK.md` - Task tracking
- `PLANNING.md` - This file
- `docs/AI_RESUME_EXTRACTION.md` - AI extraction system
- `docs/RESUME_BUILDER_MODULAR_ARCHITECTURE.md` - Resume builder architecture
- `docs/PLAN_RESUME_UPLOAD_MODULARIZATION.md` - Upload modularization plan

### API Documentation
- Inline JSDoc comments
- OpenAPI/Swagger (planned)
- README files in key directories
