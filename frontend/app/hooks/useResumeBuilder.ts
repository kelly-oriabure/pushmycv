'use client';

import { useEffect, useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';

export const useResumeBuilder = () => {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const [color, setColor] = useState<string>('#000000');

  const {
    resumeData,
    updateResumeData,
    currentResumeId,
    setCurrentResumeId,
    templateId,
    setTemplateId,
    createResume,
    fetchResumes,
    resetResumeData,
    setResumeData,
    initialize,
    loading,
    loadResume
  } = useResumeStore();

  // Only initialize Zustand store for user
  useEffect(() => {
    if (user?.id) {
      initialize(user.id);
    }
  }, [user?.id, initialize]);

  // Remove all Supabase fetching for template_id/color
  // Only set templateId from local state or URL (handled in page)

  useEffect(() => {
    console.log('[useResumeBuilder] color state changed:', color);
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
    loadResume,
    createResume,
    fetchResumes,
    resetResumeData,
    setResumeData,
  };
};
