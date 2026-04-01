/**
 * Template-specific configuration for form field visibility
 * This determines which form fields should be shown/hidden based on the selected template
 */

export interface TemplateFieldConfig {
  /** Whether to show the avatar/photo upload field */
  showAvatar: boolean;
  /** Whether to show address fields */
  showAddress: boolean;
  /** Whether to show phone field */
  showPhone: boolean;
  /** Whether to show email field */
  showEmail: boolean;
  /** Template-specific field requirements */
  requiredFields: string[];
}

export interface TemplateConfig {
  id: string;
  name: string;
  fields: TemplateFieldConfig;
}

/**
 * Configuration for each template defining which fields to show/hide
 */
export const TEMPLATE_CONFIGS: Record<string, TemplateFieldConfig> = {
  // Templates that display avatars
  'artisan': {
    showAvatar: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    requiredFields: ['jobTitle', 'firstName', 'lastName', 'email', 'phone']
  },
  'cascade': {
    showAvatar: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    requiredFields: ['jobTitle', 'firstName', 'lastName', 'email', 'phone']
  },
  'simple-white': {
    showAvatar: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    requiredFields: ['jobTitle', 'firstName', 'lastName', 'email', 'phone']
  },
  'cool': {
    showAvatar: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    requiredFields: ['jobTitle', 'firstName', 'lastName', 'email', 'phone']
  },
  'milan': {
    showAvatar: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    requiredFields: ['jobTitle', 'firstName', 'lastName', 'email', 'phone']
  },
  'executive': {
    showAvatar: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    requiredFields: ['jobTitle', 'firstName', 'lastName', 'email', 'phone']
  },
  
  // Templates that do NOT display avatars
  'modernist': {
    showAvatar: false,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    requiredFields: ['jobTitle', 'firstName', 'lastName', 'email', 'phone']
  },
  
  // Default fallback configuration
  'default': {
    showAvatar: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    requiredFields: ['jobTitle', 'firstName', 'lastName', 'email']
  }
};

/**
 * Get template configuration for a given template ID
 * @param templateId - The template identifier
 * @returns Template field configuration
 */
export function getTemplateConfig(templateId?: string): TemplateFieldConfig {
  if (!templateId) {
    return TEMPLATE_CONFIGS.default;
  }
  
  return TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS.default;
}

/**
 * Check if a template shows avatar/photo field
 * @param templateId - The template identifier
 * @returns boolean indicating if avatar should be shown
 */
export function templateShowsAvatar(templateId?: string): boolean {
  return getTemplateConfig(templateId).showAvatar;
}

/**
 * Get list of required fields for a template
 * @param templateId - The template identifier
 * @returns Array of required field names
 */
export function getTemplateRequiredFields(templateId?: string): string[] {
  return getTemplateConfig(templateId).requiredFields;
}