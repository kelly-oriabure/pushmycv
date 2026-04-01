import { FormData, FormDataAdapter } from '@/lib/types/formData';

/**
 * Adapter for transforming form data between frontend and storage formats
 */
export class FormDataAdapterImpl<T extends FormData = FormData> implements FormDataAdapter<T> {
  /**
   * Transform form data to storage format
   */
  toStorageFormat(data: T): any {
    // For now, return data as-is
    // In the future, this could handle transformations like:
    // - Converting complex objects to JSON strings
    // - Normalizing date formats
    // - Removing temporary or UI-only fields
    return data;
  }
  
  /**
   * Transform data from storage format to form data
   */
  fromStorageFormat(data: any): T {
    // For now, return data as-is
    // In the future, this could handle transformations like:
    // - Parsing JSON strings to objects
    // - Converting string dates to Date objects
    // - Adding default values for missing fields
    return data as T;
  }
  
  /**
   * Validate data from storage
   */
  validate(data: any): boolean {
    // Basic validation - check if data is an object
    if (!data || typeof data !== 'object') return false;
    
    // Add more specific validation as needed
    return true;
  }
  
  /**
   * Normalize data to ensure consistency
   */
  normalize(data: T): T {
    // Create a deep copy to avoid mutating the original
    const normalized = JSON.parse(JSON.stringify(data));
    
    // Add normalization logic as needed
    // For example:
    // - Trim string values
    // - Ensure arrays are properly formatted
    // - Set default values for missing fields
    
    return normalized;
  }
  
  /**
   * Sanitize data to remove sensitive or unnecessary information
   */
  sanitize(data: T): T {
    // Create a deep copy to avoid mutating the original
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Add sanitization logic as needed
    // For example:
    // - Remove sensitive fields
    // - Clear temporary data
    
    return sanitized;
  }
}

// Export a default instance
export const formDataAdapter = new FormDataAdapterImpl<FormData>();
