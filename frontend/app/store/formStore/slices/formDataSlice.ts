import type { FormData } from '@/lib/types/formData';
import type { StateCreator } from 'zustand';

export interface FormDataState<T extends FormData = FormData> {
  currentFormId: string | null;
  formData: T;
  isDirty: boolean;
  isValid: boolean;
  validationErrors: Record<string, string>;
  
  // Actions
  setCurrentFormId: (id: string | null) => void;
  updateFormData: <K extends keyof T>(section: K, data: T[K]) => void;
  updateSection: <K extends keyof T>(section: K, data: T[K]) => void;
  resetFormData: () => void;
  markDirty: () => void;
  markClean: () => void;
  setValidation: (isValid: boolean, errors?: Record<string, string>) => void;
}

export const createFormDataSlice = <T extends FormData>(
  initialData: T
): StateCreator<FormDataState<T>, [], [], FormDataState<T>> => (set, get) => ({
  currentFormId: null,
  formData: initialData,
  isDirty: false,
  isValid: true,
  validationErrors: {},
  
  setCurrentFormId: (id) => set({ currentFormId: id }),
  
  updateFormData: (section, data) => set((state) => ({
    formData: { ...state.formData, [section]: data },
    isDirty: true
  })),
  
  updateSection: (section, data) => get().updateFormData(section, data),
  
  resetFormData: () => set({
    formData: initialData,
    isDirty: false,
    isValid: true,
    validationErrors: {}
  }),
  
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  
  setValidation: (isValid, errors = {}) => set({
    isValid,
    validationErrors: errors
  })
});
