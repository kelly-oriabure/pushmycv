import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { resumeListSlice, ResumeListState } from './slices/resumeListSlice';
import { createResumeEditorSlice, ResumeEditorState } from './slices/resumeEditorSlice';
import { createResumeSyncSlice, ResumeSyncState } from './slices/resumeSyncSlice';
import { Resume, SupabaseResumeRecord } from './types';

export type ResumeStore = ResumeListState & ResumeEditorState & ResumeSyncState & {
    loadResume: (resumeId: string, userId: string) => Promise<void>;
    templateId: string | null;
    setTemplateId: (id: string | null) => void;
};

export const useResumeStore = create<ResumeStore>()(
    devtools((set, get, store) => ({
        ...resumeListSlice(set, get),
        ...createResumeEditorSlice(set, get, store),
        ...createResumeSyncSlice(set, get, store),

        loadResume: async (resumeId: string, userId: string) => {
            try {
                set({ loading: true });
                // Load resume data
                const resumeData = await get().loadResumeData(resumeId, userId);
                if (resumeData) {
                    set({
                        resumeData,
                        currentResumeId: resumeId,
                        isDirty: false,
                        loading: false
                    });
                } else {
                    console.warn('No resume data found for ID:', resumeId);
                    set({ loading: false });
                }
            } catch (error) {
                console.error('Error loading resume:', error);
                set({
                    loading: false,
                    error: error instanceof Error ? error.message : 'Failed to load resume',
                    currentResumeId: resumeId,
                    isDirty: false
                });
            }
        },
    }))
);
