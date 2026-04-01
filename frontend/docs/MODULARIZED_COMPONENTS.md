# Modularized Components Reference

Based on my analysis of the codebase, here is a comprehensive list of all modularized components related to the resume upload and analysis workflow:

## 1. Core Service Modules

### Orchestrator Service
- **File**: `app/lib/services/resumeUploadService.ts`
- **Function**: `processPdfUpload`
- **Purpose**: Single entry point for processing PDF uploads, coordinating text extraction and duplicate detection
- **Key Features**:
  - Extracts text and hashes using adapter functions
  - Performs duplicate detection
  - Returns structured results without side effects
  - Designed for reuse across different routes

## 2. Text Extraction Modules

### Text Extraction Adapter
- **File**: `app/lib/text-extraction/pdf.ts`
- **Functions**: `extractTextFromPdf`, `getPrimaryContact`
- **Purpose**: Adapter module that exports functions from the legacy implementation
- **Key Features**:
  - Pass-through to existing implementation
  - Allows imports from new path while maintaining behavior

### Legacy Text Extraction Implementation
- **File**: `app/lib/pdfTextExtractor.ts`
- **Functions**: `extractTextFromPdf`, `getPrimaryContact`
- **Purpose**: Core implementation for PDF text extraction and contact information extraction
- **Key Features**:
  - Uses pdf-parse for text extraction
  - Extracts emails and phones via regex
  - Generates content hashing for duplicate detection
  - Normalizes extracted data

## 3. Duplicate Detection Modules

### Duplicate Detection Adapter
- **File**: `app/lib/duplicates/detection.ts`
- **Function**: `detectDuplicateResume`
- **Purpose**: Adapter module that exports functions from the legacy implementation
- **Key Features**:
  - Pass-through to existing implementation
  - Exposes detection utilities under new path

### Legacy Duplicate Detection Implementation
- **File**: `app/lib/duplicateDetection.ts`
- **Function**: `detectDuplicateResume`
- **Purpose**: Core implementation for duplicate resume detection
- **Key Features**:
  - Multi-tier duplicate checks
  - Exact duplicate by composite hash
  - Partial match by email and phone hash
  - Individual hash matches for logging
  - Returns detailed detection results

## 4. Repository Modules

### Resume Uploads Repository
- **File**: `app/lib/repositories/resumeUploadsRepo.ts`
- **Functions**: `createResumeUpload`, `updateResumeUpload`
- **Purpose**: Repository layer for resume_uploads table operations
- **Key Features**:
  - Thin and focused on DB I/O
  - Business logic stays in services
  - Consistent error handling
  - Typed interfaces for create/update operations

## 5. Edge Function Modules

### Resume Analysis Service
- **File**: `app/lib/edge/resumeAnalysis.ts`
- **Function**: `startResumeAnalysis`
- **Purpose**: Centralized function to start resume analysis via Edge Function
- **Key Features**:
  - Centralizes payload building and validation
  - Ensures idempotency header for downstream systems
  - Typed request and response objects

### Generic Edge Function Invoker
- **File**: `app/lib/edge/invokeEdgeFunction.ts`
- **Function**: `invokeEdgeFunction`
- **Purpose**: Generic invoker for Supabase Edge Functions
- **Key Features**:
  - Centralizes headers, timeouts, and error handling
  - Promise.race-based timeout implementation
  - Consistent error handling across the app

## 6. Shared Types

### Resume Types
- **File**: `app/lib/types/resume.ts`
- **Types**: 
  - `DuplicateAction`
  - `ExtractedContactInfo`
  - `PdfTextExtractionResult`
  - `DuplicateDetectionResult`
  - `ResumeUploadCreateInput`
  - `ResumeUploadUpdateInput`
  - `ProcessUploadParams`
  - `ProcessUploadResult`
- **Purpose**: Shared types for the resume upload workflow
- **Key Features**:
  - Minimal and stable to avoid churn across modules
  - Provides consistent data contracts

## 7. Test Modules

### Orchestrator Tests
- **File**: `tests/services/processPdfUpload.test.ts`
- **Purpose**: Tests for the processPdfUpload orchestrator
- **Key Features**:
  - Mocks adapter functions for isolated testing
  - Tests create, duplicate, and update scenarios

### Repository Tests
- **File**: `tests/repositories/resumeUploadsRepo.test.ts`
- **Purpose**: Tests for the resumeUploadsRepo repository methods
- **Key Features**:
  - Mocks Supabase client for isolated testing
  - Tests success and failure cases

### Adapter Tests
- **File**: `tests/adapters/getPrimaryContact.test.ts`
- **Purpose**: Tests for the getPrimaryContact adapter function
- **Key Features**:
  - Tests various contact information scenarios
  - Validates email and phone extraction logic
