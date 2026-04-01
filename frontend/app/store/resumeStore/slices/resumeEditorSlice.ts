import type { ResumeData } from '@/lib/types';
import { initialResumeData } from '@/lib/types';
import { clearStoredResumeId, getStoredResumeId, storeResumeId } from '../helpers';
import { RESUME_IDS, isRegularResumeId } from '@/constants/resume';
import type { StateCreator } from 'zustand';
import type { ResumeStore } from '../index';

export interface ResumeEditorState {
    currentResumeId: string | null;
    resumeData: ResumeData;
    isDirty: boolean;
    lastSaved: Date | null;
    templateId: string | null;
    setTemplateId: (id: string | null) => void;
    setCurrentResume: (id: string | null) => void;
    setResumeData: (data: ResumeData) => void;
    updateSection: <K extends keyof ResumeData>(section: K, data: ResumeData[K]) => void;
    resetResume: () => void;
    markDirty: () => void;
    markClean: () => void;
    // Backward-compatible methods
    setCurrentResumeId: (id: string, userId?: string) => void;
    updateResumeData: <K extends keyof ResumeData>(section: K, data: ResumeData[K]) => void;
    resetResumeData: () => void;
    initialize: (userId: string) => Promise<void>;
}

export const createResumeEditorSlice: StateCreator<
    ResumeStore,
    [],
    [],
    ResumeEditorState
> = (set, get) => ({
    currentResumeId: null,
    resumeData: initialResumeData,
    isDirty: false,
    lastSaved: null,
    templateId: null,
    setTemplateId: (id) => set({ templateId: id }),

    setCurrentResume: (id) => set({ currentResumeId: id, isDirty: false }),
    setResumeData: (data) => set({ resumeData: data, isDirty: false }),

    updateSection: (section, data) => set((state) => ({
        resumeData: { ...state.resumeData, [section]: data },
        isDirty: true,
    })),

    resetResume: () => set({
        resumeData: initialResumeData,
        isDirty: false,
        lastSaved: null,
    }),

    markDirty: () => set({ isDirty: true }),
    markClean: () => set({ isDirty: false }),

    // Backward-compatible methods
    setCurrentResumeId: (id, userId) => {
        if (userId) {
            storeResumeId(userId, id);
        }
        set({ currentResumeId: id, isDirty: false });
    },
    updateResumeData: (section, data) => get().updateSection(section, data),
    resetResumeData: () => get().resetResume(),
    initialize: async (userId: string) => {
        if (!userId) return;
        try {
            await get().fetchResumes(userId);

            const storedResumeId = getStoredResumeId(userId);
            if (storedResumeId) {
                if (isRegularResumeId(storedResumeId)) {
                    const exists = (get() as ResumeStore).resumes?.some((r) => r.id === storedResumeId);
                    if (!exists) {
                        clearStoredResumeId(userId);
                        set({ currentResumeId: null });
                    } else {
                        await (get() as ResumeStore).loadResume?.(storedResumeId, userId);
                    }
                } else {
                    set({ currentResumeId: storedResumeId });
                }
            }
        } catch (error) {
            console.error('Error during resume store initialization:', error);
        }
    },
});
