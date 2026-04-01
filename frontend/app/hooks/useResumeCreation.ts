'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useResumeStore } from '@/store/resumeStore';
import { useToast } from '@/hooks/use-toast';
import { RESUME_IDS } from '@/constants/resume';

interface UseResumeCreationOptions {
    onSuccess?: (resumeId: string) => void;
    onError?: (error: Error) => void;
    redirectToBuilder?: boolean;
    defaultTemplateId?: string;
    defaultTemplateName?: string;
    defaultTemplateUrl?: string;
}

export const useResumeCreation = (options: UseResumeCreationOptions = {}) => {
    const {
        onSuccess,
        onError,
        redirectToBuilder = true,
        defaultTemplateId = null,
        defaultTemplateName = null,
        defaultTemplateUrl = null
    } = options;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
    const [pendingResumeName, setPendingResumeName] = useState<string | null>(null);
    const [creationMethod, setCreationMethod] = useState<'scratch' | 'upload' | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(defaultTemplateId);
    const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(defaultTemplateName);
    const [selectedTemplateUrl, setSelectedTemplateUrl] = useState<string | null>(defaultTemplateUrl);

    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const {
        setCurrentResumeId,
        resetResumeData
    } = useResumeStore();

    // Step 3: Final creation logic after name is entered
    const handleResumeNameContinue = async (title: string) => {
        if (!creationMethod) return; // Should not happen

        setIsCreateModalOpen(false);

        // For both 'scratch' and 'upload', create a resume and redirect
        await handleCreateFromScratch(title);
    };

    // Step 2: User has chosen a method, now ask for the name.
    const handleMethodSelection = (method: 'scratch' | 'upload') => {
        setCreationMethod(method);
        setIsMethodModalOpen(false);
        setIsCreateModalOpen(true);
    };

    // Handler for "Create from scratch"
    const handleCreateFromScratch = async (title: string) => {
        if (!user?.id || !title.trim()) {
            toast({
                title: "Invalid name",
                description: "Please enter a valid resume name.",
                variant: "destructive",
            });
            closeModals(); // Reset everything on failure
            return;
        }

        try {
            // Use default template (Artisan) if no template is selected
            const defaultTemplateId = "1d6ede71-3930-4c35-992a-1abf04c1754e";
            const defaultTemplateName = "Artisan";

            const templateIdToUse = selectedTemplateId || defaultTemplateId;
            const templateNameToUse = selectedTemplateName || defaultTemplateName;

            setCurrentResumeId(RESUME_IDS.TEMP);
            resetResumeData();

            toast({
                title: "Draft started",
                description: "Your resume will be saved when you click Save in the builder.",
            });

            closeModals();

            if (redirectToBuilder) {
                router.push(
                    `/resume/builder/${RESUME_IDS.TEMP}?templateId=${templateIdToUse}&templateName=${encodeURIComponent(
                        templateNameToUse
                    )}&draftTitle=${encodeURIComponent(title.trim())}`
                );
            }
        } catch (error) {
            console.error('Error creating resume:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create resume. Please try again.';

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });

            onError?.(error instanceof Error ? error : new Error(errorMessage));
            closeModals();
        }
    };

    // Handler for "Upload existing resume"
    const handleUploadExisting = (title: string) => {
        // No longer needed, handled by handleCreateFromScratch
    };

    // Step 1: Open the creation flow, starting with method selection
    const openCreateResume = (templateId: string, templateName: string) => {
        if (!templateId || !templateName) {
            toast({
                title: "Error",
                description: "Template ID and Name are required to create a resume.",
                variant: "destructive",
            });
            return;
        }
        setSelectedTemplateId(templateId);
        setSelectedTemplateName(templateName);
        setIsMethodModalOpen(true); // Start with the method modal
    };

    // Close all modals and reset state
    const closeModals = () => {
        setIsCreateModalOpen(false);
        setIsMethodModalOpen(false);
        setPendingResumeName(null);
        setCreationMethod(null);
        setSelectedTemplateId(null);
        setSelectedTemplateName(null);
        setSelectedTemplateUrl(null);
    };

    return {
        // State
        isCreateModalOpen,
        isMethodModalOpen,
        pendingResumeName, // This might be deprecated or used differently now
        selectedTemplateId,
        selectedTemplateName,
        selectedTemplateUrl,

        // Actions
        openCreateResume,
        closeModals,
        handleResumeNameContinue,
        handleMethodSelection, // Expose the new handler
        // Keep old handlers if they are used directly by UI components
        handleCreateFromScratch,
        handleUploadExisting,
        setSelectedTemplateId,
        setSelectedTemplateName,
        setSelectedTemplateUrl,

        // Modal props for easy spreading
        createModalProps: {
            isOpen: isCreateModalOpen,
            onOpenChange: setIsCreateModalOpen,
            onCreateResume: handleResumeNameContinue,
        },
        methodModalProps: {
            isOpen: isMethodModalOpen,
            onOpenChange: setIsMethodModalOpen,
            onSelectMethod: handleMethodSelection,
        }
    };
};
