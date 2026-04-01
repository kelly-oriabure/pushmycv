'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/integrations/supabase/client';

export interface ExtractionStatus {
    status: 'idle' | 'processing' | 'completed' | 'failed';
    progress: number;
    extractedData: any | null;
    error: string | null;
}

export function useResumeExtraction(resumeId: string | null): ExtractionStatus {
    const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);
    const [extractedData, setExtractedData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!resumeId) {
            setStatus('idle');
            setProgress(0);
            setExtractedData(null);
            setError(null);
            return;
        }

        setStatus('processing');
        setProgress(0);
        setError(null);

        // Poll custom_sections field from resumes table
        const interval = setInterval(async () => {
            try {
                const supabase = getSupabaseClient();
                const { data, error: fetchError } = await supabase
                    .from('resumes')
                    .select('custom_sections')
                    .eq('id', resumeId)
                    .single();

                if (fetchError) {
                    console.error('Error polling extraction status:', fetchError);
                    setError(fetchError.message);
                    setStatus('failed');
                    clearInterval(interval);
                    return;
                }

                if (data?.custom_sections) {
                    setStatus('completed');
                    setProgress(100);
                    setExtractedData(data.custom_sections);
                    clearInterval(interval);
                } else {
                    // Update progress while waiting
                    setProgress(prev => Math.min(prev + 10, 90));
                }
            } catch (err) {
                console.error('Error in extraction polling:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                setStatus('failed');
                clearInterval(interval);
            }
        }, 2000);

        // Timeout after 30 seconds
        const timeout = setTimeout(() => {
            if (status === 'processing') {
                setError('Extraction timeout - please try again');
                setStatus('failed');
                clearInterval(interval);
            }
        }, 30000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [resumeId, status]);

    return { status, progress, extractedData, error };
}
