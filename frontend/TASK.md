# Tasks

## In Progress

- **Debug AI Extraction and Resume Tables Population** - *Started: 2025-10-13*
  - ✅ Fixed column name mismatch (experience.job_title)
  - ✅ Fixed date format conversion (YYYY-MM → YYYY-MM-01)
  - ✅ Added comprehensive error handling and logging
  - ✅ Created migration 026_fix_experience_column_name.sql
  - ✅ Created debugging guide (docs/AI_EXTRACTION_DEBUGGING_GUIDE.md)
  - ✅ Created test script (scripts/test-extraction.sql)
  - ✅ Fixed "Resume not found" error (PGRST116) - used maybeSingle()
  - ✅ Added 500ms delay before extraction trigger to ensure DB commit
  - ⏳ Pending: Apply migration and test end-to-end extraction flow
  - Files: `app/api/extract-resume-data/route.ts`, `app/api/process-resume-upload/route.ts`, `supabase/migrations/026_fix_experience_column_name.sql`
  - Documentation: `docs/AI_EXTRACTION_DEBUGGING_GUIDE.md`, `docs/AI_EXTRACTION_FIXES_SUMMARY.md`

## Completed

- **Phase 1: Immediate Production Fixes** - *Completed: 2025-10-04*
  - ✅ Created database investigation scripts and cleanup automation
  - ✅ Applied critical database migration (upload_id NOT NULL, unique constraints, indexes)
  - ✅ Implemented rate limiting on 3 critical API routes (5-10 req/min)
  - ✅ Added 30-second timeout mechanism to edge function
  - ✅ Created comprehensive deployment documentation
  - Files: `scripts/investigate-production-issues.sql`, `scripts/cleanup-stuck-analyses.ts`, `supabase/migrations/019_fix_critical_database_issues.sql`
  - Documentation: `docs/PHASE_1_FINAL_SUMMARY.md`, `docs/DEPLOYMENT_CHECKLIST.md`

- **Fix Full-Width PDF Header** - *Completed: 2025-09-03*
  - Refactored `ArtisanHeader.tsx` by moving padding from the `<header>` to an inner `<div>`. This ensures the background color spans the full width of the page while maintaining content padding.

- **Fix Artisan Template Header Styling** - *Completed: 2025-09-03*
  - Updated `tailwindToInline.ts` to include missing class mappings for sizing (`w-16`, `h-24`, etc.), image fitting (`object-cover`), and borders (`border-2`). This resolves the oversized and misaligned profile picture in the PDF header.

- **Fix Artisan Template PDF Layout** - *Completed: 2025-09-03*
  - Modified `pdfExportUtils.ts` to traverse the DOM and find the parent flex container for PDF exports. This preserves the two-column layout by including all necessary container styles.
  - Expanded the `tailwindToInline.ts` utility to correctly convert flexbox and positioning classes to inline styles.
  - Removed a conflicting Puppeteer script in `generate-pdf/route.ts` that was overriding template styles.

- **Fix Artisan Template PDF Export** - *Completed: 2025-09-04*
  - Resolved "Could not load style" error by updating `pdfExportUtils.ts`.
  - The stylesheet processing logic in `exportElementToPDFWithPuppeteer` and `getElementAsPdfBase64WithPuppeteer` now gracefully handles absolute, relative, and data: URLs, preventing crashes on non-standard `href` attributes.

- **Fix PDF Export Styling Issues** - *Completed: 2025-09-04*
  - Injected `globals.css` into the Puppeteer page to ensure all Tailwind CSS styles from the resume templates are correctly applied in the final PDF output.

- **Fix PDF Export Styling Issues** - *Completed: 2025-09-03*
  - Investigated and resolved issues with unwanted UI elements and broken styles in the exported PDF.
  - Refined Puppeteer waiting logic to ensure all stylesheets are loaded before generation.
  - Corrected header styling by emulating print media type.
  - Resolved `waitForSelector` timeout by using the correct `.resume-template` class.
