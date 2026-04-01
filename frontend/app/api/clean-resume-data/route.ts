import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/config/supabase';
import { cleanBrokenResumeData } from '@/lib/utils/dataCleaningUtils';
import { generateCustomSectionsHash } from '@/lib/utils/customSectionsHash';

export async function POST(request: NextRequest) {
    try {
        const { resumeId } = await request.json();

        if (!resumeId) {
            return NextResponse.json(
                { error: 'Resume ID is required' },
                { status: 400 }
            );
        }

        const supabase = createSupabaseAdminClient();

        // Get the current broken data
        const { data: resumeData, error: fetchError } = await supabase
            .from('resumes')
            .select('custom_sections')
            .eq('id', resumeId)
            .single();

        if (fetchError) {
            console.error('Error fetching resume data:', fetchError);
            return NextResponse.json(
                { error: 'Failed to fetch resume data' },
                { status: 500 }
            );
        }

        if (!resumeData?.custom_sections) {
            return NextResponse.json(
                { error: 'No custom_sections data found' },
                { status: 404 }
            );
        }

        // Clean the broken data
        const cleanedData = cleanBrokenResumeData(resumeData.custom_sections);

        // Generate new hash for the cleaned data
        const customSectionsHash = generateCustomSectionsHash(cleanedData);

        // Update the resume with cleaned data
        const { error: updateError } = await (supabase.from('resumes') as any).update({
            custom_sections: cleanedData,
            custom_sections_hash: customSectionsHash,
            updated_at: new Date().toISOString()
        })
            .eq('id', resumeId);

        if (updateError) {
            console.error('Error updating resume data:', updateError);
            return NextResponse.json(
                { error: 'Failed to update resume data' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Resume data cleaned successfully',
            cleanedData: cleanedData
        });

    } catch (error) {
        console.error('Error in clean-resume-data API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}





