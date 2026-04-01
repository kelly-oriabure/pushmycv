'use client';

import { useEffect, useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';
import { ResumeOrchestrator } from '@/lib/services/resumeOrchestrator';
import { ResumeData } from '@/lib/types';
import { getSupabaseClient } from '@/integrations/supabase/client';

export const useResumeBuilderModular = () => {
    const params = useParams();
    const id = params?.id as string;
    const { user } = useAuth();
    const [color, setColor] = useState<string>('#000000');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    const resumeOrchestrator = new ResumeOrchestrator(getSupabaseClient());

    const {
        resumeData,
        updateResumeData,
        currentResumeId,
        setCurrentResumeId,
        templateId,
        setTemplateId,
        initialize,
        loading
    } = useResumeStore();

    // Only initialize Zustand store for user
    useEffect(() => {
        if (user?.id) {
            initialize(user.id);
        }
    }, [user?.id, initialize]);

    // Load resume data using the new orchestrator
    useEffect(() => {
        const loadResumeData = async () => {
            if (!id || !user?.id || id === 'temp-resume-id') {
                return;
            }

            setIsLoading(true);
            try {
                const loadedResume = await resumeOrchestrator.loadResume(id);
                if (loadedResume) {
                    // Update Zustand store with loaded data directly
                    updateResumeData('personalDetails', loadedResume.personalDetails);
                    updateResumeData('professionalSummary', loadedResume.professionalSummary);
                    updateResumeData('education', loadedResume.education);
                    updateResumeData('employmentHistory', loadedResume.employmentHistory);
                    updateResumeData('skills', loadedResume.skills);
                    updateResumeData('languages', loadedResume.languages);
                    updateResumeData('references', loadedResume.references);
                    updateResumeData('courses', loadedResume.courses);
                    updateResumeData('internships', loadedResume.internships);
                }
            } catch (error) {
                console.error('Error loading resume data:', error);
            } finally {
                setIsLoading(false);
                setIsInitialized(true); // Mark as initialized after loading attempt
            }
        };

        loadResumeData();
    }, [id, user?.id]);

    // Data is now synced automatically via useUnifiedSync in the page component
    // No manual sync scheduling needed here

    useEffect(() => {
        console.log('[useResumeBuilderModular] color state changed:', color);
    }, [color]);

    return {
        resumeData,
        updateResumeData,
        currentResumeId,
        setCurrentResumeId,
        templateId,
        setTemplateId,
        color,
        setColor,
        user,
        isLoading
    };
};
