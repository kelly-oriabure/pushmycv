/**
 * Special resume IDs used for specific application states
 * - TEMP: Used for new, unsaved resumes
 */
export const RESUME_IDS = {
    TEMP: 'temp-resume-id',
} as const;

export type SpecialResumeId = typeof RESUME_IDS[keyof typeof RESUME_IDS];

export const isSpecialResumeId = (id: string): id is SpecialResumeId => {
    return Object.values(RESUME_IDS).includes(id as any);
};

// Type guard to check if a resume ID is a regular ID (not a special one)
export const isRegularResumeId = (id: string): boolean => {
    return !isSpecialResumeId(id);
};
