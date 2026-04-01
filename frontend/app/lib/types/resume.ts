// Shared types for the resume upload workflow
// Keep minimal and stable to avoid churn across modules.

export type DuplicateAction = 'create' | 'duplicate' | 'update' | 'use_existing';

export interface ExtractedContactInfo {
    emails: string[];
    phones: string[];
    primaryEmail: string | null;
    primaryPhone: string | null;
}

export interface PdfTextExtractionResult {
    text: string;
    contentHash: string | null;
    emailHash: string | null;
    phoneHash: string | null;
    compositeHash: string | null;
    contact: ExtractedContactInfo;
}

export interface DuplicateDetectionResult {
    action: DuplicateAction;
    isDuplicate?: boolean;
    shouldUpdate?: boolean;
    reason?: string;
    existingRecord?: any; // Replace with typed record via repo when available
    existingAnalysis?: any; // Analysis data if duplicate has completed analysis
}

export interface ResumeUploadCreateInput {
    user_id: string;
    resume_id?: string | null;
    file_path?: string;
    file_name: string;
    file_type: string;
    file_size: number;
    resume_url?: string; // public URL to generated preview image
    pdf_url?: string | null; // optional public URL to original PDF
    content_hash: string | null;
    composite_hash: string | null;
    email_hash?: string | null;
    phone_hash?: string | null;
    extracted_text: string;
    extracted_email?: string | null;
    extracted_phone?: string | null;
}

export interface ResumeUploadUpdateInput {
    file_path?: string;
    file_name: string;
    file_type: string;
    file_size: number;
    resume_url: string;
    pdf_url?: string | null;
    content_hash: string | null;
    composite_hash: string | null;
    extracted_text: string;
    resume_id?: string | null;
    extracted_email?: string | null;
    extracted_phone?: string | null;
}

export interface ProcessUploadParams {
    supabase: unknown; // Use SupabaseClient at call sites; avoid importing it here
    userId: string;
    pdf: { bytes: ArrayBuffer | Buffer; name: string; size: number; type: string };
    options?: { page?: number; previewWidth?: number };
}

export interface ProcessUploadResult {
    action: DuplicateAction;
    uploadId?: string;
    imageUrl?: string;
    pdfUrl?: string | null;
    message: string;
    existingAnalysis?: any; // Analysis data if duplicate has completed analysis
    extractedData?: {
        contentHash: string | null;
        emailHash: string | null;
        phoneHash: string | null;
        compositeHash: string | null;
        primaryEmail: string | null;
        primaryPhone: string | null;
        textLength: number;
        fullText: string;
        emails: string[];
        phones: string[];
    };
}
