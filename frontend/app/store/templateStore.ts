import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import templatesData from '@/data/templates';

export type Template = {
    uuid: string;
    name: string;
    description: string;
    image: string;
    categories: string[];
    is_premium?: boolean;
};

interface TemplateState {
    templates: Template[];
    selectedTemplate: Template | null;
    loading: boolean;
    lastFetched: number | null;
    setSelectedTemplate: (uuid: string) => void;
    setLoading: (loading: boolean) => void;
    fetchTemplates: () => Promise<void>;
    deleteTemplate: (uuid: string) => void;
    addTemplate: (template: Template) => void;
    updateTemplate: (template: Template) => void;
    clearCache: () => void;
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: templatesData,
      selectedTemplate: null,
      loading: false,
      lastFetched: null,
      setSelectedTemplate: (uuid) =>
        set((state) => ({
          selectedTemplate:
            state.templates.find((t) => t.uuid === uuid) || null,
        })),
      setLoading: (loading) => set({ loading }),
      fetchTemplates: async () => {
        // Check if data is fresh (less than 10 minutes old)
        const lastFetched = get().lastFetched;
        const now = Date.now();
        const isFresh = lastFetched && (now - lastFetched) < 1000 * 60 * 10;
        
        if (isFresh && get().templates.length > 0) {
          return;
        }
        
        set({ loading: true });
        // Simulate async fetch
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({ 
          templates: templatesData, 
          loading: false,
          lastFetched: Date.now()
        });
      },
      deleteTemplate: (uuid) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.uuid !== uuid),
        })),
      addTemplate: (template) =>
        set((state) => ({
          templates: [...state.templates, template],
        })),
      updateTemplate: (template) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.uuid === template.uuid ? { ...t, ...template } : t
          ),
        })),
      clearCache: () => set({ templates: templatesData, lastFetched: null }),
    }),
    {
      name: 'template-storage', // unique name for localStorage
      partialize: (state) => ({ 
        templates: state.templates,
        lastFetched: state.lastFetched
      }), // only persist templates and lastFetched
    }
  )
);