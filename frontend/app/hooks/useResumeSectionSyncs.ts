import { useEffect, useRef } from 'react';
import type { ResumeData } from '@/lib/types';
import { useSectionSync } from '@/lib/services/unifiedSyncService';

/**
 * Hook that tracks changes to individual resume sections and syncs them to normalized tables
 * Prevents race conditions by syncing each section independently
 */
export function useResumeSectionSyncs(
  resumeId: string,
  resumeData: ResumeData,
  config?: { debounceMs?: number; showToasts?: boolean }
) {
  // Track previous values to detect changes
  const prevDataRef = useRef<ResumeData>(resumeData);
  const changedSectionsRef = useRef<Set<keyof ResumeData>>(new Set());

  // Sync each section individually
  const personalDetailsSync = useSectionSync(
    resumeId,
    'personalDetails',
    resumeData.personalDetails,
    config
  );

  const professionalSummarySync = useSectionSync(
    resumeId,
    'professionalSummary',
    resumeData.professionalSummary,
    config
  );

  const educationSync = useSectionSync(
    resumeId,
    'education',
    resumeData.education,
    config
  );

  const employmentHistorySync = useSectionSync(
    resumeId,
    'employmentHistory',
    resumeData.employmentHistory,
    config
  );

  const skillsSync = useSectionSync(
    resumeId,
    'skills',
    resumeData.skills,
    config
  );

  const languagesSync = useSectionSync(
    resumeId,
    'languages',
    resumeData.languages,
    config
  );

  const referencesSync = useSectionSync(
    resumeId,
    'references',
    resumeData.references,
    config
  );

  const coursesSync = useSectionSync(
    resumeId,
    'courses',
    resumeData.courses,
    config
  );

  // Detect which sections have changed
  useEffect(() => {
    const changed = new Set<keyof ResumeData>();
    const current = resumeData;
    const prev = prevDataRef.current;

    // Compare each section
    if (JSON.stringify(current.personalDetails) !== JSON.stringify(prev.personalDetails)) {
      changed.add('personalDetails');
    }
    if (current.professionalSummary !== prev.professionalSummary) {
      changed.add('professionalSummary');
    }
    if (JSON.stringify(current.education) !== JSON.stringify(prev.education)) {
      changed.add('education');
    }
    if (JSON.stringify(current.employmentHistory) !== JSON.stringify(prev.employmentHistory)) {
      changed.add('employmentHistory');
    }
    if (JSON.stringify(current.skills) !== JSON.stringify(prev.skills)) {
      changed.add('skills');
    }
    if (JSON.stringify(current.languages) !== JSON.stringify(prev.languages)) {
      changed.add('languages');
    }
    if (JSON.stringify(current.references) !== JSON.stringify(prev.references)) {
      changed.add('references');
    }
    if (JSON.stringify(current.courses) !== JSON.stringify(prev.courses)) {
      changed.add('courses');
    }

    changedSectionsRef.current = changed;
    prevDataRef.current = resumeData;
  }, [resumeData]);

  // Return sync states for all sections
  return {
    personalDetails: personalDetailsSync,
    professionalSummary: professionalSummarySync,
    education: educationSync,
    employmentHistory: employmentHistorySync,
    skills: skillsSync,
    languages: languagesSync,
    references: referencesSync,
    courses: coursesSync,
    changedSections: changedSectionsRef.current,
  };
}

