import { getSupabaseClient } from '@/integrations/supabase/client';
import type { Resume, SupabaseResumeRecord } from '../types';
import { StateCreator } from 'zustand';
import { initialResumeData } from '@/lib/types';

export interface ResumeListState {
    resumes: Resume[];
    currentResumeRecord: SupabaseResumeRecord | null;
    loading: boolean;
    error: string | null;
    resumeData: import('@/lib/types').ResumeData;
    isCreatingResume: boolean;
    createResume: (title: string, userId: string, templateId?: string, templateName?: string, color?: string) => Promise<string | null>;
    deleteResume: (id: string) => Promise<boolean>;
    updateResumeTitle: (id: string, title: string) => Promise<void>;
    duplicateResume: (id: string, userId: string) => Promise<string | null>;
    fetchResumes: (userId: string) => Promise<void>;
}

type SetState = Parameters<StateCreator<ResumeListState>>[0];
type GetState = Parameters<StateCreator<ResumeListState>>[1];

export const resumeListSlice = (set: SetState, get: GetState): ResumeListState => ({
    resumes: [],
    currentResumeRecord: null,
    loading: false,
    error: null,
    resumeData: initialResumeData,
    isCreatingResume: false,

    fetchResumes: async (userId: string) => {
        const supabase = getSupabaseClient();
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('resumes')
                .select('id, title, template_id, template_name, color, custom_sections, created_at, updated_at, user_id')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            // Map DB data to Resume type
            const resumes = (data || []).map((item: SupabaseResumeRecord) => ({
                id: item.id,
                title: item.title || '',
                score: '',
                download: '',
                send: '',
                updatedAt: item.updated_at || '',
                template: item.template_name || '',
                template_id: item.template_id,
                color: item.color || '#000000',
                isNew: false,
                thumbnail: '',
                created_at: item.created_at,
                template_name: item.template_name,
                template_url: '',
                data: {
                    ...initialResumeData,
                    ...(item.custom_sections && typeof item.custom_sections === 'object' && !Array.isArray(item.custom_sections) ? item.custom_sections : {})
                },
            }));

            set({ resumes, loading: false });
        } catch (error) {
            set({ error: 'Failed to fetch resumes', loading: false });
        }
    },

    createResume: async (
        title: string,
        userId: string,
        templateId?: string,
        templateName?: string,
        color?: string
    ) => {
        const supabase = getSupabaseClient();

        // Enhanced logging for debugging
        console.log('=== CREATE RESUME DEBUG START ===');
        console.log('Input parameters:', { title, userId, templateId, templateName, color });
        console.log('Title type:', typeof title, 'Length:', title?.length);
        console.log('UserId type:', typeof userId, 'Length:', userId?.length);
        console.log('TemplateId type:', typeof templateId, 'Value:', templateId);
        console.log('TemplateName type:', typeof templateName, 'Value:', templateName);
        console.log('Color type:', typeof color, 'Value:', color);

        // Check if we're already creating a resume to prevent duplicates
        const currentState = get();
        if (currentState.isCreatingResume) {
            console.log('⚠️ Resume creation already in progress, skipping duplicate request');
            return null;
        }

        // Set creating flag to prevent duplicates
        set(state => ({ ...state, isCreatingResume: true }));

        // Check user authentication state
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log('Current session:', {
                hasSession: !!session,
                userId: session?.user?.id,
                userEmail: session?.user?.email,
                sessionError: sessionError
            });

            if (!session) {
                console.error('❌ No active session found');
                throw new Error('User not authenticated');
            }

            if (session.user.id !== userId) {
                console.error('❌ Session user ID mismatch:', {
                    sessionUserId: session.user.id,
                    providedUserId: userId
                });
                throw new Error('User ID mismatch');
            }
        } catch (authError) {
            console.error('❌ Authentication check failed:', authError);
            throw authError;
        }

        // Prepare insert data
        const insertData = {
            title,
            user_id: userId,
            template_id: templateId,
            template_name: templateName,
            color: color || '#000000',
        };
        console.log('Insert data prepared:', insertData);

        try {
            console.log('🔄 Attempting database insert...');
            // Use a more robust approach without .single() to avoid coercion errors
            const { data, error } = await supabase
                .from('resumes')
                .insert(insertData)
                .select('id, title, template_id, template_name, color, custom_sections, created_at, updated_at, user_id');

            if (error) {
                console.error('❌ Supabase insert error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                    fullError: error
                });
                throw error;
            }

            // Check if data is returned and handle accordingly
            if (!data || data.length === 0) {
                console.error('❌ No data returned from insert operation');
                throw new Error('Failed to create resume: No data returned');
            }

            // Get the first (and should be only) record
            const resumeRecord = data[0];
            console.log('✅ Resume created successfully in database:', resumeRecord);

            // Map DB data to Resume type
            const resume: Resume = {
                id: resumeRecord.id,
                title: resumeRecord.title || '',
                score: '',
                download: '',
                send: '',
                updatedAt: resumeRecord.updated_at || '',
                template: resumeRecord.template_name || '',
                template_id: resumeRecord.template_id,
                color: resumeRecord.color || '#000000',
                isNew: true,
                thumbnail: '',
                created_at: resumeRecord.created_at,
                template_name: resumeRecord.template_name,
                template_url: '',
                data: initialResumeData,
            };

            set(state => ({
                resumes: [resume, ...state.resumes],
                currentResumeId: resumeRecord.id, // This is currentResumeId from resumeEditorSlice
                resumeData: get().resumeData // Keep existing resume data
            }));

            console.log('✅ Resume added to state, returning ID:', resumeRecord.id);
            console.log('=== CREATE RESUME DEBUG END ===');

            // Clear creating flag
            set(state => ({ ...state, isCreatingResume: false }));
            return resumeRecord.id;
        } catch (error) {
            console.error('❌ Error in createResume:', {
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                errorStack: error instanceof Error ? error.stack : undefined,
                fullError: error,
                inputParams: { title, userId, templateId, templateName, color }
            });
            console.log('=== CREATE RESUME DEBUG END (ERROR) ===');

            // Clear creating flag on error
            set(state => ({ ...state, isCreatingResume: false }));
            return null;
        }
    },

    deleteResume: async (id: string) => {
        const supabase = getSupabaseClient();
        set({ loading: true, error: null });
        try {
            const { error } = await supabase
                .from('resumes')
                .delete()
                .eq('id', id);
            if (error) throw error;
            set((state) => ({ resumes: state.resumes.filter((resume) => resume.id !== id), loading: false }));
            return true;
        } catch (error) {
            set({ error: 'Failed to delete resume', loading: false });
            return false;
        }
    },

    updateResumeTitle: async (id: string, title: string) => {
        const supabase = getSupabaseClient();
        set({ loading: true, error: null });
        try {
            await (supabase.from('resumes') as any).update({ title, updated_at: new Date().toISOString() })
                .eq('id', id);
            set((state) => ({
                resumes: state.resumes.map((resume) =>
                    resume.id === id ? { ...resume, title } : resume
                ),
                loading: false,
            }));
        } catch (error) {
            set({ error: 'Failed to update resume title', loading: false });
        }
    },

    duplicateResume: async (id: string, userId: string) => {
        const supabase = getSupabaseClient();
        set({ loading: true, error: null });
        try {
            const { data: source, error: sourceError } = await (supabase.from('resumes') as any)
                .select('title, template_id, template_name, color, custom_sections')
                .eq('id', id)
                .eq('user_id', userId)
                .single();

            if (sourceError) throw sourceError;

            const sourceTitle: string = source?.title || 'Untitled Resume';
            const copiedTitleBase = `${sourceTitle} (Copy)`;
            const copiedTitle = copiedTitleBase.length > 120 ? copiedTitleBase.slice(0, 120) : copiedTitleBase;

            const { data: inserted, error: insertError } = await (supabase.from('resumes') as any)
                .insert({
                    user_id: userId,
                    title: copiedTitle,
                    template_id: source?.template_id ?? null,
                    template_name: source?.template_name ?? null,
                    color: source?.color ?? '#000000',
                    custom_sections: source?.custom_sections ?? {},
                })
                .select('id, title, template_id, template_name, color, custom_sections, created_at, updated_at, user_id');

            if (insertError) throw insertError;

            const resumeRecord = inserted?.[0];
            if (!resumeRecord?.id) {
                set({ loading: false });
                return null;
            }

            const resume: Resume = {
                id: resumeRecord.id,
                title: resumeRecord.title || '',
                score: '',
                download: '',
                send: '',
                updatedAt: resumeRecord.updated_at || '',
                template: resumeRecord.template_name || '',
                template_id: resumeRecord.template_id,
                color: resumeRecord.color || '#000000',
                isNew: true,
                thumbnail: '',
                created_at: resumeRecord.created_at,
                template_name: resumeRecord.template_name,
                template_url: '',
                data: {
                    ...initialResumeData,
                    ...(resumeRecord.custom_sections && typeof resumeRecord.custom_sections === 'object' && !Array.isArray(resumeRecord.custom_sections)
                        ? resumeRecord.custom_sections
                        : {}),
                },
            };

            set((state) => ({
                resumes: [resume, ...state.resumes],
                loading: false,
            }));

            return resumeRecord.id;
        } catch (error) {
            set({ error: 'Failed to duplicate resume', loading: false });
            return null;
        }
    },
});
