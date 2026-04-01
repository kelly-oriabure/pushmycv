import type { TemplateDefinition } from './types';
import { artisanDefinition } from './artisan';
import { cascadeDefinition } from './cascade';
import { coolDefinition } from './cool';
import { executiveDefinition } from './executive';
import { milanDefinition } from './milan';
import { modernistDefinition } from './modernist';
import { simpleWhiteDefinition } from './simpleWhite';

const TEMPLATE_DEFINITIONS: Record<string, TemplateDefinition> = {
  [artisanDefinition.key]: artisanDefinition,
  [cascadeDefinition.key]: cascadeDefinition,
  [coolDefinition.key]: coolDefinition,
  [executiveDefinition.key]: executiveDefinition,
  [milanDefinition.key]: milanDefinition,
  [modernistDefinition.key]: modernistDefinition,
  [simpleWhiteDefinition.key]: simpleWhiteDefinition
};

export const getTemplateDefinition = (templateKey: string): TemplateDefinition | null => {
  return TEMPLATE_DEFINITIONS[templateKey] ?? null;
};

export const isConfigDrivenTemplate = (templateKey: string): boolean => {
  return Boolean(TEMPLATE_DEFINITIONS[templateKey]);
};
