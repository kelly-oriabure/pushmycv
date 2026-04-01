import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TemplateService } from '@/lib/services/templateService';
import type { Template } from '@/lib/types/resumeBuilder';

const templateService = new TemplateService();

// Query key constants
const TEMPLATE_KEYS = {
  all: ['templates'] as const,
  lists: () => [...TEMPLATE_KEYS.all, 'list'] as const,
  details: (id: string) => [...TEMPLATE_KEYS.all, 'detail', id] as const,
};

/**
 * Hook to fetch all templates with caching
 */
export const useTemplates = () => {
  return useQuery<Template[], Error>({
    queryKey: TEMPLATE_KEYS.lists(),
    queryFn: async () => {
      const templates = await templateService.getTemplates();
      return templates;
    },
    // Cache templates for 10 minutes
    staleTime: 1000 * 60 * 10,
    // Keep in cache for 30 minutes
    gcTime: 1000 * 60 * 30,
  });
};

/**
 * Hook to fetch a single template by ID with caching
 */
export const useTemplate = (id: string) => {
  return useQuery<Template, Error>({
    queryKey: TEMPLATE_KEYS.details(id),
    queryFn: async () => {
      const template = await templateService.getTemplateById(id);
      if (!template) {
        throw new Error(`Template with ID ${id} not found`);
      }
      return template;
    },
    enabled: !!id,
  });
};

/**
 * Helper function to invalidate template cache
 */
export const useInvalidateTemplates = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAllTemplates: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
    },
    invalidateTemplateList: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.lists() });
    },
    invalidateTemplate: (id: string) => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.details(id) });
    },
  };
};