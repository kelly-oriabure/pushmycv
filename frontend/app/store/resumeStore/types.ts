import type { ResumeData } from '@/lib/types';
import type { Json } from '@/integrations/supabase/types';

export interface Resume {
  id: string;
  title: string;
  score: string;
  download: string;
  send: string;
  updatedAt: string;
  template: string;
  template_id: string | null; // UUID
  color: string | null;
  isNew: boolean;
  thumbnail: string;
  created_at: string | null;
  template_name: string | null;
  template_url: string;
  data: ResumeData;
}

export interface SupabaseResumeRecord {
  id: string;
  user_id: string;
  title: string | null;
  template_name: string | null;
  created_at: string | null;
  updated_at: string | null;
  custom_sections: Json | null; // JSONB data structure
  template_id: string | null; // UUID
  color: string | null;
  templates?: {
    thumbnail_url?: string;
  };
}

export interface ResumeListState {
  resumes: Resume[];
  currentResumeRecord: SupabaseResumeRecord | null;
  loading: boolean;
  error: string | null;
  resumeData: ResumeData;
  createResume: (title: string, userId: string, templateId?: string, templateName?: string, color?: string) => Promise<string | null>;
  deleteResume: (id: string) => Promise<boolean>;
  updateResumeTitle: (id: string, title: string) => Promise<void>;
  duplicateResume: (id: string, userId: string) => Promise<string | null>;
  fetchResumes: (userId: string) => Promise<void>;
}

export interface ResumeState extends ResumeListState {
  // Resume data for the current resume being edited
  resumeData: ResumeData;
  currentResumeId: string | null;
  // List of all user's resumes
  resumes: Resume[];
  loading: boolean;
  error: string | null;

  // Actions
  updateResumeData: (section: keyof ResumeData, data: unknown) => void;
  setCurrentResumeId: (id: string, userId?: string) => void;
  resetResumeData: () => void;
  fetchResume: (id: string, userId: string) => Promise<ResumeData | null>;
  initialize: (userId: string) => Promise<void>;
}
