// TypeScript types for Resume Score feature

export interface ScoreBreakdown {
  formatting: number;
  keywords: number;
  experience: number;
  education: number;
  skills: number;
}

export interface ResumeAnalysis {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  job_title: string;
  overall_score: number | null;
  score_breakdown: ScoreBreakdown | null;
  suggestions: string[] | null;
  ats_score: number | null;
  status: 'processing' | 'completed' | 'failed';
  error_message: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadResumeRequest {
  file: File;
  jobTitle: string;
}

export interface UploadResumeResponse {
  analysisId: string;
  message: string;
}

export type AnalysisStatusResponse = ResumeAnalysis;

export interface AnalysisHistoryResponse {
  analyses: ResumeAnalysis[];
  total: number;
  hasMore: boolean;
}

export interface AnalysisResult {
  analysisId: string;
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  suggestions: string[];
  atsScore: number;
  status: 'completed' | 'failed';
  errorMessage?: string;
}

export interface EdgeFunctionRequest {
  analysisId: string;
  filePath: string;
  jobTitle: string;
}

export interface N8nWebhookRequest {
  analysisId: string;
  fileUrl: string;
  jobTitle: string;
  callbackUrl: string;
}

export type AnalysisState = 'upload' | 'analyzing' | 'completed';

export const JOB_TITLES = [
  'Software Developer',
  'Data Scientist',
  'Product Manager',
  'Marketing Manager',
  'Sales Representative',
  'Business Analyst',
  'UX/UI Designer',
  'Project Manager'
] as const;

export type JobTitle = typeof JOB_TITLES[number];

export interface ResumeUploadFormProps {
  onUploadSuccess: (uploadId: string, file: File, jobTitle: string, imageUrl?: string, pdfUrl?: string) => void;
}

export interface ScoreDashboardProps {
  uploadedFile?: File | null;
  jobTitle?: string;
  resumeUrl?: string | null;
  imageUrl?: string | null;
}

export interface LoadingAnalysisProps {
  analysisId: string;
  onComplete: () => void;
}

// Error types
export interface ApiError {
  error: string;
  code?: string;
}

// API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
}

// Utility types for form handling
export interface UploadFormData {
  selectedJobTitle: string;
  file: File | null;
  isUploading: boolean;
}

export interface ScoreDisplayData {
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  suggestions: string[];
  atsScore: number;
  jobTitle: string;
  fileName: string;
  createdAt: string;
}