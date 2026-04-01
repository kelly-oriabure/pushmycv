# Sync Implementation Migration Guide

## Overview
This guide helps migrate from the current multiple sync implementations to the unified `UnifiedSyncService`.

## Current Sync Implementations (TO BE REMOVED)

### 1. FormSyncService
- **Location**: `app/lib/services/formSyncService.ts`
- **Usage**: Generic form data syncing
- **Status**: ❌ DEPRECATED - Use `useFormSync` hook instead

### 2. Individual Component Sync Logic
- **Location**: Various form components (Courses.tsx, Skills.tsx, etc.)
- **Usage**: Ad-hoc sync implementations in each component
- **Status**: ❌ DEPRECATED - Use `useFormSync` hook instead

### 3. resumeSyncSlice (Partial)
- **Location**: `app/store/resumeStore/slices/resumeSyncSlice.ts`
- **Usage**: Data loading only (keep this part)
- **Status**: ⚠️ PARTIAL - Keep data loading, remove sync logic

## New Unified Implementation

### UnifiedSyncService
- **Location**: `app/lib/services/unifiedSyncService.ts`
- **Features**: 
  - ✅ Debouncing with configurable delays
  - ✅ Retry logic with exponential backoff
  - ✅ Error handling and recovery
  - ✅ Toast notifications
  - ✅ State management
  - ✅ Memory cleanup
  - ✅ Support for both resume and form data

### New Hooks

#### 1. useUnifiedSync (Resume Data)
```typescript
import { useUnifiedSync } from '@/lib/services/unifiedSyncService';

const { syncState, forceSave, cancelPendingSync, retryLastFailed } = useUnifiedSync(
  resumeId,
  resumeData,
  { debounceMs: 3000, showToasts: true }
);
```

#### 2. useFormSync (Form Data)
```typescript
import { useFormSync } from '@/lib/services/unifiedSyncService';

const { syncState, forceSave, cancelPendingSync, retryLastFailed } = useFormSync(
  recordId,
  formData,
  'resumes', // table name
  { debounceMs: 3000, showToasts: true }
);
```

#### 3. useFormSync (Component Helper)
```typescript
import { useFormSync } from '@/hooks/useFormSync';

const { form, syncState, handleSubmit } = useFormSync(
  formData,
  resumeId,
  resumeData,
  updateResumeData,
  'courses' // section key
);
```

## Migration Steps

### Step 1: Update Form Components
Replace individual sync logic with `useFormSync` hook:

**Before (Courses.tsx):**
```typescript
// Individual sync logic with timeouts and refs
const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const lastSyncedDataRef = useRef<string>('');

useEffect(() => {
  const subscription = form.watch((value) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      // Complex sync logic...
    }, getSyncDebounceTime());
  });
  // ... cleanup logic
}, [form, updateResumeData, resumeData.courses]);
```

**After (CoursesNew.tsx):**
```typescript
// Simple unified sync
const { form, syncState, handleSubmit } = useFormSync<CoursesFormData>(
  { courses: resumeData.courses.length > 0 ? resumeData.courses : [{ course: '', institution: '', startDate: '', endDate: '' }] },
  resumeId,
  resumeData,
  updateResumeData,
  'courses'
);
```

### Step 2: Add Sync Status Indicators
Add visual feedback for sync status:

```typescript
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';

// In component render:
<div className="flex justify-end">
  <SyncStatusIndicator syncState={syncState} />
</div>
```

### Step 3: Update Form Submissions
Use the unified handleSubmit:

```typescript
const onSubmit = async (data: FormData) => {
  await handleSubmit(data);
  onNext?.();
};
```

### Step 4: Remove Deprecated Files
After migration is complete, remove:
- `app/lib/services/formSyncService.ts`
- Individual sync logic from form components
- Any references to `getSyncDebounceTime` from individual components

### Step 5: Update Imports
Replace imports:
```typescript
// Remove these imports:
import { FormSyncServiceImpl } from '@/lib/services/formSyncService';
import { getSyncDebounceTime } from '@/lib/config/formConfig';

// Add these imports:
import { useFormSync } from '@/hooks/useFormSync';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
```

## Benefits After Migration

1. **Consistency**: All components use the same sync logic
2. **Reliability**: Centralized error handling and retry logic
3. **Performance**: Optimized debouncing and memory management
4. **User Experience**: Consistent toast notifications and status indicators
5. **Maintainability**: Single source of truth for sync behavior
6. **Debugging**: Centralized logging and error tracking

## Testing Checklist

- [ ] Form data syncs automatically after changes
- [ ] Sync status indicator shows correct states
- [ ] Toast notifications appear for success/error
- [ ] Retry logic works for failed syncs
- [ ] No memory leaks from timeouts
- [ ] Multiple components can sync simultaneously without conflicts
- [ ] Form submissions trigger immediate sync
- [ ] Network errors are handled gracefully

## Rollback Plan

If issues arise, you can temporarily rollback by:
1. Reverting component changes
2. Re-enabling individual sync logic
3. The old implementations are still available until fully removed

## Timeline

- **Phase 1**: Update 2-3 components (Courses, Skills) ✅
- **Phase 2**: Update remaining form components
- **Phase 3**: Remove deprecated implementations
- **Phase 4**: Testing and validation
- **Phase 5**: Documentation updates
