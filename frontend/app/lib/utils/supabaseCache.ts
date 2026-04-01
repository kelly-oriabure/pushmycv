// Deprecated: caching removed—module left to avoid breaking imports
export async function getCachedTemplates() {
  throw new Error('supabaseCache has been removed. Use TemplateService directly.');
}

export async function getCachedTemplateById(_id: string) {
  throw new Error('supabaseCache has been removed. Use TemplateService directly.');
}

export function invalidateTemplateCache() { }

export const supabaseCache = {} as const;