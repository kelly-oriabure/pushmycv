
// Helper functions for localStorage
const RESUME_STORAGE_KEY = 'PushMyCV_current_resume_id';
const RESUME_DRAFT_KEY = 'PushMyCV_draft';

export const getStoredResumeId = (userId: string): string | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(`${RESUME_STORAGE_KEY}_${userId}`);
  return stored && stored !== 'undefined' ? stored : null;
};

export const storeResumeId = (userId: string, resumeId: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${RESUME_STORAGE_KEY}_${userId}`, resumeId);
  }
};

export const clearStoredResumeId = (userId: string) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${RESUME_STORAGE_KEY}_${userId}`);
  }
};

export const getDraftKey = (userId: string) => `${RESUME_DRAFT_KEY}_${userId}`;

export const loadDraft = <T = unknown>(userId: string): T | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(getDraftKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const saveDraft = (userId: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getDraftKey(userId), JSON.stringify(value));
};

export const clearDraft = (userId: string) => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getDraftKey(userId));
};
