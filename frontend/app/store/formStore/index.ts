import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FormData } from '@/lib/types/formData';
import { createFormDataSlice, FormDataState } from './slices/formDataSlice';
import { formSyncSlice, FormSyncState } from './slices/formSyncSlice';
import { initialResumeData } from '@/lib/types';

export type FormStore<T extends FormData = FormData> = FormDataState<T> & FormSyncState & {
  initializeForm: (id: string) => Promise<void>;
  loadFormData: (id: string) => Promise<T | null>;
  saveFormData: (id: string, data: T) => Promise<void>;
};

// Create a store factory function
export const createFormStore = <T extends FormData>(initialData: T) => create<FormStore<T>>()(
  devtools((set, get, store) => ({
    ...createFormDataSlice(initialData)(set, get, store),
    ...formSyncSlice(set, get, store),
    
    initializeForm: async (id: string) => {
      try {
        set({ currentFormId: id });
        // Load form data if needed
        // const data = await get().loadFormData(id);
        // if (data) {
        //   set({ formData: data });
        // }
      } catch (error) {
        console.error('Error initializing form:', error);
      }
    },
    
    loadFormData: async (id: string) => {
      // This would typically call a service to load data
      // For now, we'll just return null to indicate no data
      return null;
    },
    
    saveFormData: async (id: string, data: T) => {
      try {
        get().markSyncStart();
        // This would typically call a service to save data
        // For now, we'll just simulate success
        get().markSyncSuccess();
      } catch (error) {
        console.error('Error saving form data:', error);
        get().markSyncError(error instanceof Error ? error.message : 'Failed to save');
      }
    }
  }))
);

// Export a default store for resume forms
export const useResumeFormStore = createFormStore(initialResumeData);
