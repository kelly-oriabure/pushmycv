import type { ResumeData } from '@/lib/types';

// Helper for full name
export const getFullName = (personalDetails: ResumeData['personalDetails']) =>
  `${personalDetails.firstName} ${personalDetails.lastName}`.trim();

// Helper to check if a section should be displayed
export const hasContent = (data: any): boolean => {
  if (!data) return false;
  if (typeof data === 'string') return data.trim() !== '';
  if (Array.isArray(data)) {
    if (data.length === 0) return false;
    return data.some(item => hasContent(item));
  }
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data).some(([key, value]) => {
        // The hideReferences flag is a special case we need to check for
        if (key === 'hideReferences') return false; 
        return hasContent(value);
    });
  }
  return false;
};
