import templatesData from '@/data/templates';
import { templateMap } from '@/components/resume/templates/templateMap';
import type { Template } from '@/lib/types/resumeBuilder';

interface TemplateLoadResult {
  component: React.FC<any> | null;
  error: string | null;
  templateKey: string;
  isValid: boolean;
}

/**
 * Maps template UUIDs to local template keys for template configuration lookup
 */
export const UUID_TO_TEMPLATE_KEY: Record<string, string> = {
  // Artisan
  '1d6ede71-3930-4c35-992a-1abf04c1754e': 'artisan',
  
  // Cascade  
  '0178e367-31e2-4d01-a88b-ecdca6d7bda1': 'cascade',
  
  // Cool
  'f8e9bd05-7c00-48b5-80b6-12be8c9da219': 'cool',
  
  // Executive
  '4386291b-c33c-4b1e-9c95-b7acd29b5c7a': 'executive',
  
  // Milan
  '86e7c16b-99d9-4bd0-93f2-d42e3c827580': 'milan',
  
  // Modernist - DOES NOT DISPLAY AVATAR
  'f4885f34-4c8a-48c6-a74b-6598921998a1': 'modernist',
  
  // Simple White
  '6cdf186b-8931-4921-89b4-1990a47d4b27': 'simple-white',
  '9fa8d2fa-7904-4644-ba06-a564ca1d241a': 'simple-white', // Alternative UUID
};

/**
 * Convert a template UUID to a local template key with validation
 * @param templateUuid - The template UUID from the database
 * @returns The local template key (e.g., 'artisan', 'modernist')
 */
export function getTemplateKeyFromUuid(templateUuid?: string): string {
  if (!templateUuid) return 'cool'; // Default fallback
  
  const templateKey = UUID_TO_TEMPLATE_KEY[templateUuid];
  if (!templateKey) {
    console.warn(`Template UUID ${templateUuid} not found in mapping, using default 'cool'`);
    return 'cool';
  }
  
  return templateKey;
}

/**
 * Validate if a template exists and is properly configured
 * @param templateUuid - The template UUID to validate
 * @returns Validation result with component and error info
 */
export function validateAndGetTemplate(templateUuid?: string | null): TemplateLoadResult {
  // Handle null/undefined
  if (!templateUuid) {
    return {
      component: templateMap['cool'] || null,
      error: 'No template ID provided, using default',
      templateKey: 'cool',
      isValid: true // Default is considered valid
    };
  }
  
  // Handle 'default' case
  if (templateUuid === 'default') {
    return {
      component: templateMap['cool'] || null,
      error: null,
      templateKey: 'cool',
      isValid: true
    };
  }
  
  // Get template key from UUID
  const templateKey = UUID_TO_TEMPLATE_KEY[templateUuid];
  if (!templateKey) {
    return {
      component: templateMap['cool'] || null,
      error: `Template UUID "${templateUuid}" not found in mapping`,
      templateKey: 'cool',
      isValid: false
    };
  }
  
  // Check if template component exists
  const component = templateMap[templateKey];
  if (!component) {
    return {
      component: templateMap['cool'] || null,
      error: `Template component "${templateKey}" not found in templateMap`,
      templateKey: 'cool',
      isValid: false
    };
  }
  
  return {
    component,
    error: null,
    templateKey,
    isValid: true
  };
}

/**
 * Get template data by UUID with validation
 * @param templateUuid - The template UUID
 * @returns Template data object or null
 */
export function getTemplateByUuid(templateUuid?: string): Template | null {
  if (!templateUuid) return null;
  
  const template = templatesData.find(template => template.uuid === templateUuid);
  if (!template) {
    console.warn(`Template data not found for UUID: ${templateUuid}`);
    return null;
  }
  
  return template;
}

/**
 * Check if a template supports avatar display
 * @param templateKey - The template key
 * @returns Whether the template supports avatar display
 */
export function templateSupportsAvatar(templateKey: string): boolean {
  // Based on the comment in the original mapping
  const noAvatarTemplates = ['modernist'];
  return !noAvatarTemplates.includes(templateKey);
}

/**
 * Get all available template keys
 * @returns Array of all template keys
 */
export function getAllTemplateKeys(): string[] {
  return Object.values(UUID_TO_TEMPLATE_KEY);
}

/**
 * Get all available template UUIDs
 * @returns Array of all template UUIDs
 */
export function getAllTemplateUuids(): string[] {
  return Object.keys(UUID_TO_TEMPLATE_KEY);
}