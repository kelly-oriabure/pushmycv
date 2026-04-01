import { StateCreator } from 'zustand';
import { ResumeData } from '@/lib/types';
import { getSupabaseClient } from '@/integrations/supabase/client';

export interface ResumeSyncState {
    loadResumeData: (resumeId: string, userId: string) => Promise<ResumeData>;
}

export const createResumeSyncSlice: StateCreator<
    ResumeSyncState,
    [],
    [],
    ResumeSyncState
> = () => ({
    loadResumeData: async (resumeId: string, userId: string): Promise<ResumeData> => {
        const supabase = getSupabaseClient();

        // Get the resume record with custom_sections
        const { data: resumeData, error: resumeError } = await supabase
            .from('resumes')
            .select('custom_sections')
            .eq('id', resumeId)
            .eq('user_id', userId)
            .maybeSingle();

        if (resumeError) {
            console.error('Error loading resume record:', {
                message: (resumeError as any)?.message,
                details: (resumeError as any)?.details,
                hint: (resumeError as any)?.hint,
                code: (resumeError as any)?.code,
            });
            const msg = (resumeError as any)?.message || 'Unknown Supabase error';
            throw new Error(`Failed to load resume: ${msg}`);
        }

        if (!resumeData) {
            throw new Error('Resume not found');
        }

        // Extract data from custom_sections JSONB field
        const customSections = (resumeData.custom_sections as any) || {};

        // Convert back to ResumeData format
        const resumeDataFormatted: ResumeData = {
            personalDetails: customSections.personalDetails ? {
                jobTitle: customSections.personalDetails.jobTitle || '',
                firstName: customSections.personalDetails.firstName || '',
                lastName: customSections.personalDetails.lastName || '',
                email: customSections.personalDetails.email || '',
                phone: customSections.personalDetails.phone || '',
                address: customSections.personalDetails.address || '',
                cityState: customSections.personalDetails.cityState || '',
                country: customSections.personalDetails.country || '',
                photoUrl: customSections.personalDetails.photoUrl || '',
            } : {
                jobTitle: '', firstName: '', lastName: '', email: '', phone: '', address: '', cityState: '', country: '', photoUrl: ''
            },
            professionalSummary: customSections.professionalSummary || '',
            education: (customSections.education || []).map((edu: any, index: number) => ({
                id: index + 1,
                school: edu.school || '',
                degree: edu.degree || '',
                startDate: formatDateFromDB(edu.startDate),
                endDate: formatDateFromDB(edu.endDate),
                location: edu.location || '',
                description: edu.description || '',
            })),
            employmentHistory: (customSections.experience || []).map((exp: any, index: number) => ({
                id: index + 1,
                jobTitle: exp.jobTitle || '',
                employer: exp.employer || '',
                startDate: formatDateFromDB(exp.startDate),
                endDate: formatDateFromDB(exp.endDate),
                location: exp.location || '',
                description: exp.description || '',
            })),
            skills: (customSections.skills || []).map((skill: any) => ({
                name: skill.name || '',
                level: skill.level || 20, // Default to 20% if not specified
            })),
            languages: (customSections.languages || []).map((lang: any) => lang.name || lang || ''),
            references: {
                hideReferences: true,
                references: (customSections.references || []).map((ref: any) => ({
                    name: ref.name || '',
                    company: ref.company || '',
                    phone: ref.phone || '',
                    email: ref.email || '',
                })),
            },
            courses: (customSections.courses || []).map((course: any, index: number) => ({
                id: index + 1,
                course: course.course || course.name || '',
                institution: course.institution || '',
                startDate: formatDateFromDB(course.startDate),
                endDate: formatDateFromDB(course.endDate),
            })),
            internships: customSections.internships || [],
        };

        return resumeDataFormatted;
    },
});

// Helper function to format dates from database
function formatDateFromDB(dateString: string | null | undefined): string {
    if (!dateString) return '';

    try {
        // If it's already in YYYY-MM format, return as is
        if (/^\d{4}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        // If it's a full date, extract YYYY-MM
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
}
