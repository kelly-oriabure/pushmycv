import { useCallback, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { deepEqual } from '@/lib/utils/deepEqual';

interface DebouncedFormResetConfig {
  /**
   * Delay before applying form reset (default: 300ms)
   * Prevents reset from overriding user input
   */
  resetDelay?: number;
  
  /**
   * Whether to ignore resets when user is actively typing
   * Determined by checking if form has focus
   */
  respectUserInput?: boolean;
}

/**
 * Hook for debounced form resets that don't interfere with user input
 * Solves the infinite loop problem between form.watch and form.reset
 */
export function useDebounceFormReset<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  incomingData: T,
  config: DebouncedFormResetConfig = {}
) {
  const { resetDelay = 300, respectUserInput = true } = config;
  
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIncomingDataRef = useRef<string>('');
  const isUserInteractingRef = useRef(false);

  // Track user interaction with form
  useEffect(() => {
    if (!respectUserInput) return;

    const handleFocusIn = () => {
      isUserInteractingRef.current = true;
    };

    const handleFocusOut = () => {
      // Delay setting to false to catch rapid focus changes
      setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 100);
    };

    const formElement = form.formState.isDirty ? document.activeElement?.closest('form') : null;
    
    if (formElement) {
      formElement.addEventListener('focusin', handleFocusIn);
      formElement.addEventListener('focusout', handleFocusOut);
      
      return () => {
        formElement.removeEventListener('focusin', handleFocusIn);
        formElement.removeEventListener('focusout', handleFocusOut);
      };
    }
  }, [form.formState.isDirty, respectUserInput]);

  const debouncedReset = useCallback(() => {
    // Clear existing timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    const incomingDataString = JSON.stringify(incomingData);
    
    // Skip if data hasn't changed
    if (incomingDataString === lastIncomingDataRef.current) {
      return;
    }

    // Skip if user is currently interacting with form
    if (respectUserInput && isUserInteractingRef.current) {
      console.log('Skipping form reset - user is interacting with form');
      return;
    }

    resetTimeoutRef.current = setTimeout(() => {
      const currentFormData = form.getValues();
      
      // Only reset if data is actually different
      if (!deepEqual(currentFormData, incomingData)) {
        console.log('Applying debounced form reset');
        form.reset(incomingData);
        lastIncomingDataRef.current = incomingDataString;
      }
      
      resetTimeoutRef.current = null;
    }, resetDelay);
  }, [form, incomingData, resetDelay, respectUserInput]);

  // Trigger debounced reset when incoming data changes
  useEffect(() => {
    debouncedReset();
    
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [debouncedReset]);

  // Force reset immediately (useful for external triggers)
  const forceReset = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    
    form.reset(incomingData);
    lastIncomingDataRef.current = JSON.stringify(incomingData);
  }, [form, incomingData]);

  // Cancel pending reset
  const cancelReset = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  return {
    forceReset,
    cancelReset,
  };
}