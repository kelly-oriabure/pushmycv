/**
 * Centralized form configuration for consistent behavior across all resume forms
 * Based on project specifications for auto-save debounce timing
 */

export const FORM_CONFIG = {
  /**
   * Debounce timing configuration (in milliseconds)
   * Following project specification: 3-second debounce for auto-save operations
   */
  debounce: {
    /** Main sync debounce - used for auto-save operations */
    sync: 3000, // 3 seconds - project requirement
    
    /** Form reset debounce - used to prevent conflicts during user input */
    reset: 300, // 300ms - quick response for form resets
    
    /** Field validation debounce - used for real-time validation */
    validation: 500, // 500ms - balanced for UX
    
    /** Search/filter debounce - used for search inputs */
    search: 300, // 300ms - responsive search experience
  },
  
  /**
   * Form behavior configuration
   */
  behavior: {
    /** Whether to respect user input and prevent resets during typing */
    respectUserInput: true,
    
    /** Whether to show sync status indicators */
    showSyncStatus: true,
    
    /** Whether to enable optimistic updates */
    enableOptimisticUpdates: true,
  },
  
  /**
   * Validation configuration
   */
  validation: {
    /** Whether to validate on change */
    validateOnChange: false,
    
    /** Whether to validate on blur */
    validateOnBlur: true,
    
    /** Whether to validate on submit */
    validateOnSubmit: true,
  },
} as const;

/**
 * Type-safe accessor for debounce timings
 */
export type DebounceType = keyof typeof FORM_CONFIG.debounce;

/**
 * Helper function to get debounce timing by type
 * @param type - The type of debounce timing needed
 * @returns The debounce time in milliseconds
 */
export const getDebounceTime = (type: DebounceType): number => {
  return FORM_CONFIG.debounce[type];
};

/**
 * Helper function to get sync debounce time (most commonly used)
 * @returns The sync debounce time in milliseconds
 */
export const getSyncDebounceTime = (): number => {
  return FORM_CONFIG.debounce.sync;
};

/**
 * Helper function to get reset debounce time
 * @returns The reset debounce time in milliseconds
 */
export const getResetDebounceTime = (): number => {
  return FORM_CONFIG.debounce.reset;
};