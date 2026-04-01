import { useCallback, useRef } from 'react';
import { deepEqual } from '@/lib/utils/deepEqual';
import { getDebounceTime } from '@/lib/config/formConfig';

/**
 * Hook for stable form field handling that prevents glitching during typing
 * Provides optimized onChange handlers that don't cause excessive re-renders
 */
export function useStableFormField() {
  const lastValueRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Creates a stable onChange handler that debounces updates
   */
  const createStableOnChange = useCallback((
    fieldOnChange: (value: any) => void,
    externalOnChange?: (value: any) => void,
    debounceMs = getDebounceTime('reset') // Use centralized config
  ) => {
    return (value: any) => {
      // Always update the field immediately for UI responsiveness
      fieldOnChange(value);
      
      // Debounce external updates to prevent excessive sync calls
      if (externalOnChange && value !== lastValueRef.current) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          if (value !== lastValueRef.current) {
            lastValueRef.current = value;
            externalOnChange(value);
          }
          timeoutRef.current = null;
        }, debounceMs);
      }
    };
  }, []);

  /**
   * Creates an optimized onChange for text fields
   */
  const createTextFieldOnChange = useCallback((
    field: { onChange: (value: any) => void; value: any },
    externalHandler?: (value: string) => void
  ) => {
    return createStableOnChange(
      (e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value),
      externalHandler ? (e: React.ChangeEvent<HTMLInputElement>) => externalHandler(e.target.value) : undefined,
      getDebounceTime('validation') // Use validation debounce from config
    );
  }, [createStableOnChange]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    createStableOnChange,
    createTextFieldOnChange,
    cleanup,
  };
}

/**
 * Hook for preventing form reset conflicts during user input
 */
export function useFormResetGuard() {
  const isUserTypingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markUserTyping = useCallback(() => {
    isUserTypingRef.current = true;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Clear typing flag after user stops typing for 1 second
    typingTimeoutRef.current = setTimeout(() => {
      isUserTypingRef.current = false;
    }, 1000);
  }, []);

  const isUserTyping = useCallback(() => {
    return isUserTypingRef.current;
  }, []);

  const cleanup = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    isUserTypingRef.current = false;
  }, []);

  return {
    markUserTyping,
    isUserTyping,
    cleanup,
  };
}