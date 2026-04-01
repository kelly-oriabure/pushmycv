'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { deepEqual } from '@/lib/utils/deepEqual';
import { useUnifiedSync } from '@/lib/services/unifiedSyncService';
import type { ResumeData } from '@/lib/types';

/**
 * Centralized debounce configuration
 */
export const getSyncDebounceTime = () => 3000; // 3 seconds

/**
 * Hook that replaces individual component sync logic
 * Provides a consistent interface for form synchronization
 */
export function useFormSync<T extends Record<string, any>>(
  formData: T,
  resumeId: string,
  resumeData: ResumeData,
  updateResumeData: <K extends keyof ResumeData>(section: K, data: ResumeData[K]) => void,
  sectionKey: keyof ResumeData,
  config?: {
    debounceMs?: number;
    showToasts?: boolean;
  }
) {
  const lastExternalDataRef = useRef<string>('');
  const form = useForm<T>({
    defaultValues: formData as any,
    mode: 'onChange',
  });

  // Use the unified sync service
  const { syncState, forceSave, cancelPendingSync, retryLastFailed } = useUnifiedSync(
    resumeId,
    resumeData,
    {
      debounceMs: config?.debounceMs || getSyncDebounceTime(),
      showToasts: config?.showToasts !== false,
    }
  );

  // Controlled form reset - only when data actually changes from external source
  useEffect(() => {
    const incomingDataString = JSON.stringify(formData);

    // Only reset if this is genuinely new external data (not from our own updates)
    if (incomingDataString !== lastExternalDataRef.current) {
      const currentData = form.getValues();

      // Only reset if form data is significantly different
      if (!deepEqual(currentData, formData)) {
        form.reset(formData);
      }

      lastExternalDataRef.current = incomingDataString;
    }
  }, [formData, form]);

  // Optimized form watching with unified sync
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Update the resume data in the store
      updateResumeData(sectionKey, value as ResumeData[keyof ResumeData]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [form, updateResumeData, sectionKey]);

  const handleSubmit = useCallback(async (data: T) => {
    // Force save when form is submitted
    await forceSave();
    return data;
  }, [forceSave]);

  return {
    form,
    syncState,
    handleSubmit,
    forceSave,
    cancelPendingSync,
    retryLastFailed,
  };
}