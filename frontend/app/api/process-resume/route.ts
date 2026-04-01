// app/api/process-resume/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { startResumeProcessing } from '@/app/lib/edge/resumeProcessing';

export async function POST(request: Request) {
    try {
        const { resumeUploadId } = await request.json();

        if (!resumeUploadId) {
            return NextResponse.json(
                { error: 'Missing resumeUploadId' },
                { status: 400 }
            );
        }

        // Get Supabase client
        const supabase = await getSupabaseServerClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Use the authenticated user ID
        const authenticatedUserId = user.id;

        // Start resume processing
        try {
            await startResumeProcessing(supabase, {
                resumeUploadId: resumeUploadId,
                userId: authenticatedUserId,
            });
        } catch (processingError) {
            console.error('Failed to start resume processing:', processingError);
            return NextResponse.json(
                { error: 'Failed to start resume processing', details: processingError instanceof Error ? processingError.message : 'Unknown error' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Resume processing initiated successfully'
        });

    } catch (error) {
        console.error('Error processing resume:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
