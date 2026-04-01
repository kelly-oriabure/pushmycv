# Resume Builder Modular Architecture

This document describes the modular architecture of the resume builder system, which has been refactored to improve maintainability, testability, and extensibility.

## Architecture Overview

The resume builder system follows a layered architecture with clear separation of concerns:

1. **UI Layer** - React components that handle user interaction
2. **Service Layer** - Business logic and workflow coordination
3. **Repository Layer** - Data access abstraction
4. **Data Layer** - Supabase database and static template data

```
UI Components
    ↓
Service Layer (Orchestrators & Services)
    ↓
Repository Layer
    ↓
Data Layer (Supabase & Static Data)
```

## Components

### 1. UI Layer

The UI layer consists of React components that handle user interactions and display data. Components consume services and repositories through dependency injection rather than directly accessing data sources.

Key components:
- Resume builder page (`app/(protected)/resume/builder/[id]/page.tsx`)
- Template selector
- Form components for each resume section

### 2. Service Layer

The service layer contains business logic and workflow coordination:

#### ResumeOrchestrator

Coordinates complex workflows for resume operations:
- Creating new resumes with template validation
- Loading full resume data (including all sections) for editing
- Saving resume changes by synchronizing all sections
- Changing the resume template

#### TemplateService

Handles template selection and application logic:
- Fetching available templates
- Applying a template to a resume

#### SyncService

Manages debounced synchronization of resume data:
- Scheduling sync operations with debouncing
- Canceling pending sync operations
- Performing immediate sync

### 3. Repository Layer

The repository layer abstracts data access:

#### ResumeRepository

Encapsulates all database operations for resumes and related sections:
- CRUD operations for resumes
- CRUD operations for resume sections (education, experience, skills, etc.)
- Error handling and data mapping

#### TemplateRepository

Provides access to template metadata:
- Currently uses static template data
- Methods to get all templates or by ID/UUID

### 4. Data Layer

The data layer consists of:
- Supabase database for resume data storage
- Static template data (`app/lib/data/templates.ts`)

## Data Flow

1. UI components call service methods to perform operations
2. Services coordinate workflows and call repository methods
3. Repositories interact with the Supabase database or static data
4. Data flows back through repositories → services → UI components

## Key Benefits

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Testability**: Each component can be unit tested in isolation
3. **Maintainability**: Changes to one layer don't necessarily affect others
4. **Extensibility**: New features can be added with minimal impact to existing code
5. **Error Handling**: Centralized error handling in repositories and services

## Implementation Details

### Debounced Sync

The SyncService implements debounced synchronization to avoid excessive backend calls while ensuring data consistency:
- User edits schedule a sync operation
- New edits cancel previous pending syncs
- Sync occurs after a delay (1000ms by default) with no new edits
- Immediate sync is available for explicit save operations

### Template Application

When a template is applied to a resume:
1. TemplateService validates the template exists
2. Resume data is updated with template ID, name, and color
3. UI updates to reflect the new template

### Error Handling

All repository and service methods include proper error handling:
- Database errors are caught and re-thrown with meaningful messages
- Invalid template IDs are validated and appropriate errors thrown
- Unauthorized access to resumes is checked and prevented

## Testing

Each component has comprehensive unit tests:
- ResumeOrchestrator tests cover all workflow scenarios
- TemplateService tests validate template operations
- SyncService tests verify debouncing behavior
- Repository tests ensure proper data access and error handling

## Future Extensions

The modular architecture enables several future enhancements:
1. Dynamic templates from database
2. Template categories and filtering
3. Advanced resume analytics
4. Additional sync strategies
5. Offline support with local storage

## Usage Examples

### Creating a New Resume

```typescript
const orchestrator = new ResumeOrchestrator();
const newResume = await orchestrator.createNewResume({
  userId: 'user-123',
  title: 'My Resume',
  templateId: 'template-456'
});
```

### Loading Resume Data

```typescript
const orchestrator = new ResumeOrchestrator();
const resumeData = await orchestrator.loadResumeForEditing('resume-123', 'user-123');
```

### Applying a Template

```typescript
const templateService = new TemplateService();
const updatedResume = await templateService.applyTemplate({
  userId: 'user-123',
  templateId: 'template-456',
  color: '#000000'
});
```

### Scheduling a Sync

```typescript
const syncService = new SyncService();
syncService.scheduleSync({
  resumeId: 'resume-123',
  data: resumeData
}, 1000);
```

### Immediate Sync

```typescript
const syncService = new SyncService();
await syncService.immediateSync({
  resumeId: 'resume-123',
  data: resumeData
});
```
