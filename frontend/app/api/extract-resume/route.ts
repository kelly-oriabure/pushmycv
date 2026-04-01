import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/config/supabase';
import { extractResumeDataFromText } from '@/lib/services/resumeExtractionService';
import { generateCustomSectionsHash } from '@/lib/utils/customSectionsHash';
import { initialResumeData, ResumeData } from '@/lib/types';
import { toCustomSections } from '@/lib/utils/resumeCustomSections';

export async function POST(request: NextRequest) {
    try {
        const { resumeId, uploadId } = await request.json();

        if (!resumeId || !uploadId) {
            return NextResponse.json(
                { error: 'Missing resumeId or uploadId' },
                { status: 400 }
            );
        }

        const supabase = createSupabaseAdminClient();

        // 1. Get extracted text from resume_uploads table
        const { data: upload, error: uploadError } = await supabase
            .from('resume_uploads')
            .select('extracted_text, extracted_email, extracted_phone')
            .eq('id', uploadId)
            .single();

        if (uploadError) {
            console.error('Error fetching upload data:', uploadError);
            return NextResponse.json(
                { error: 'Failed to fetch upload data' },
                { status: 500 }
            );
        }

        if (!upload?.extracted_text) {
            return NextResponse.json(
                { error: 'No extracted text found' },
                { status: 400 }
            );
        }

        // 2. Extract contact information from text if not already extracted
        let emails: string[] = [];
        let phones: string[] = [];

        if (upload.extracted_email) {
            emails = [upload.extracted_email];
        } else {
            // Extract emails from text using regex
            const emailRegex = /(?:^|[^A-Za-z0-9._%+-])([A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,24})(?![A-Za-z])/g;
            const emailMatches = upload.extracted_text.matchAll(emailRegex);
            for (const match of emailMatches) {
                emails.push(match[1].toLowerCase().trim());
            }
        }

        if (upload.extracted_phone) {
            phones = [upload.extracted_phone];
        } else {
            // Extract phones from text using regex
            const phoneRegex = /(?:\+?1[-\s]?)?(?:\(?[0-9]{3}\)?[-\s]?[0-9]{3}[-\s]?[0-9]{4})|(?:\+?[1-9]\d{0,3}[-\s]?\(?\d{1,4}\)?[-\s]?\d{1,4}[-\s]?\d{1,9})/g;
            const phoneMatches = upload.extracted_text.match(phoneRegex);
            if (phoneMatches) {
                phones = phoneMatches.map((phone: string) => phone.replace(/[^\d+]/g, ''));
            }
        }

        // 3. Extract structured data using the extraction service
        const structuredData = await extractResumeDataFromText({
            fullText: upload.extracted_text,
            contactInfo: {
                emails: emails,
                phones: phones
            },
            contentHash: '', // Not needed for extraction
            emailHash: null,
            phoneHash: null,
            compositeHash: ''
        });

        const normalized: ResumeData = {
            ...initialResumeData,
            ...(structuredData as any),
        };

        const customSections = toCustomSections(normalized);

        const customSectionsHash = generateCustomSectionsHash(customSections);

        // 5. Update resumes.custom_sections with extracted data
        const { error: updateError } = await (supabase.from('resumes') as any).update({
            custom_sections: customSections,
            custom_sections_hash: customSectionsHash,
            updated_at: new Date().toISOString()
        })
            .eq('id', resumeId);

        if (updateError) {
            console.error('Error updating resume custom_sections:', updateError);
            return NextResponse.json(
                { error: 'Failed to update resume data' },
                { status: 500 }
            );
        }

        console.log('Resume extraction completed successfully for resume:', resumeId);

        return NextResponse.json({
            success: true,
            data: customSections,
            message: 'Resume data extracted and stored successfully'
        });

    } catch (error) {
        console.error('Error in extract-resume API:', error);
        return NextResponse.json(
            { error: 'Internal server error during extraction' },
            { status: 500 }
        );
    }
}
