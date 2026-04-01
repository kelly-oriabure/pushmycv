import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    ProcessUploadParams,
    ProcessUploadResult,
} from '../types/resume';
import { extractTextFromPdf, getPrimaryContact } from '../text-extraction/pdf';
import { extractTextFromDocx } from '../docxTextExtractor';
import { detectDuplicateResume } from '../duplicates/detection';

// Orchestrator: single entry point for processing a PDF upload
export async function processPdfUpload(params: ProcessUploadParams): Promise<ProcessUploadResult> {
    const { supabase, userId, pdf } = params as ProcessUploadParams & { supabase: SupabaseClient };

    if (!pdf || !pdf.bytes) {
        return { action: 'create', message: 'Invalid file input' };
    }

    // 1) Extract text and hashes using existing implementation (via adapter)
    const buffer: Buffer = pdf.bytes instanceof Buffer
        ? (pdf.bytes as Buffer)
        : Buffer.from(pdf.bytes as ArrayBuffer);
    const type = (pdf.type || '').toLowerCase();
    const name = (pdf.name || '').toLowerCase();
    const isPdf = type === 'application/pdf' || name.endsWith('.pdf');
    const isDocx =
        type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        name.endsWith('.docx');

    const raw = isPdf
        ? await extractTextFromPdf(buffer)
        : isDocx
            ? await extractTextFromDocx(buffer)
            : {
                fullText: '',
                contactInfo: { emails: [], phones: [] },
                contentHash: '',
                emailHash: null,
                phoneHash: null,
                compositeHash: '',
                error: 'Unsupported file type',
            };
    const primary = getPrimaryContact(raw.contactInfo);
    const extracted = {
        text: raw.fullText,
        contentHash: raw.contentHash || null,
        emailHash: raw.emailHash,
        phoneHash: raw.phoneHash,
        compositeHash: raw.compositeHash || null,
        contact: {
            emails: raw.contactInfo.emails,
            phones: raw.contactInfo.phones,
            primaryEmail: primary.primaryEmail,
            primaryPhone: primary.primaryPhone,
        },
    };

    // 2) Duplicate detection using existing logic (via adapter)
    const detection = await detectDuplicateResume(
        supabase,
        {
            contentHash: extracted.contentHash ?? undefined,
            emailHash: extracted.emailHash,
            phoneHash: extracted.phoneHash,
            compositeHash: extracted.compositeHash ?? undefined,
            fullText: extracted.text,
        },
        userId
    );

    // 3) Return structured result; keep storage/DB updates in routes for now
    const existing = (detection as any)?.existingRecord;
    const existingAnalysis = (detection as any)?.existingAnalysis;
    return {
        action: detection.action,
        uploadId: existing?.id,
        imageUrl: existing?.resume_url ?? undefined,
        pdfUrl: existing?.pdf_url ?? undefined,
        existingAnalysis: existingAnalysis, // Pass through analysis data
        message: detection.action === 'duplicate'
            ? 'Duplicate detected'
            : detection.action === 'update'
                ? 'Existing resume should be updated'
                : detection.action === 'use_existing'
                    ? 'Existing analysis found - redirecting to results'
                    : 'New resume',
        extractedData: {
            contentHash: extracted.contentHash,
            emailHash: extracted.emailHash,
            phoneHash: extracted.phoneHash,
            compositeHash: extracted.compositeHash,
            primaryEmail: extracted.contact.primaryEmail,
            primaryPhone: extracted.contact.primaryPhone,
            textLength: extracted.text.length,
            fullText: extracted.text,
            emails: extracted.contact.emails,
            phones: extracted.contact.phones,
        },
    };
}
