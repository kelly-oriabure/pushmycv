// Shared types for form data syncing across the application

// Define valid table names for Supabase
export type ValidTableNames = 
  | 'courses' 
  | 'resumes' 
  | 'education' 
  | 'profiles' 
  | 'experience' 
  | 'skills' 
  | 'languages' 
  | 'references' 
  | 'internships' 
  | 'resume_analyses' 
  | 'template_categories';

// Generic form data interface
export interface FormSectionData {
  [key: string]: any;
}

export interface FormData {
  [sectionName: string]: FormSectionData | FormSectionData[];
}

// Sync status types
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncTime: string | null;
  error: string | null;
  isDirty: boolean;
}

// Repository interfaces
export interface FormDataRepository<T extends FormData = FormData> {
  create: (data: T, options?: { userId?: string; title?: string }) => Promise<string>;
  read: (id: string) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<boolean>;
  delete: (id: string) => Promise<boolean>;
  
  // Section-specific operations
  updateSection: <K extends keyof T>(
    id: string, 
    section: K, 
    data: T[K]
  ) => Promise<boolean>;
  
  // Batch operations
  updateMultipleSections: (
    id: string, 
    sections: Partial<T>
  ) => Promise<boolean>;
}

// Service interfaces
export interface FormSyncService<T extends FormData = FormData> {
  scheduleSync: (id: string, data: T, delay?: number) => void;
  syncImmediately: (id: string, data: T) => Promise<void>;
  cancelPendingSync: () => void;
  getSyncState: () => SyncState;
}

export interface FormDataOrchestrator<T extends FormData = FormData> {
  load: (id: string) => Promise<T | null>;
  save: (id: string, data: T) => Promise<void>;
  validate: (data: T) => boolean;
  transformForStorage: (data: T) => any;
  transformFromStorage: (data: any) => T;
}

// Hook interfaces
export interface UseFormSyncReturn<T extends FormData = FormData> {
  formData: T;
  updateFormData: <K extends keyof T>(section: K, data: T[K]) => void;
  syncStatus: SyncStatus;
  lastSyncTime: string | null;
  syncError: string | null;
  isDirty: boolean;
  scheduleSync: (delay?: number) => void;
  syncImmediately: () => Promise<void>;
  resetForm: () => void;
}

// Adapter interfaces
export interface FormDataAdapter<T extends FormData = FormData> {
  toStorageFormat: (data: T) => any;
  fromStorageFormat: (data: any) => T;
  validate: (data: any) => boolean;
}
