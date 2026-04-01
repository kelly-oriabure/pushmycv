import { SupabaseClient } from '@supabase/supabase-js';
import { ResumeData } from '@/lib/types';
import { generateCustomSectionsHash, hasCustomSectionsChanged } from '@/lib/utils/customSectionsHash';
import { toCustomSections } from '@/lib/utils/resumeCustomSections';

export class ResumeRepository {
    constructor(private supabase: SupabaseClient) { }

    /**
     * Load complete resume data from custom_sections JSONB field
     */
    async loadResumeData(resumeId: string): Promise<ResumeData | null> {
        try {
            const { data, error } = await this.supabase
                .from('resumes')
                .select('custom_sections')
                .eq('id', resumeId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Resume not found
                }
                throw new Error(`Failed to load resume: ${error.message}`);
            }

            // Extract data from custom_sections JSONB field
            const customSections = (data.custom_sections as any) || {};

            // Convert to ResumeData format
            return {
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
                    startDate: this.formatDateFromDB(edu.startDate),
                    endDate: this.formatDateFromDB(edu.endDate),
                    location: edu.location || '',
                    description: edu.description || '',
                })),
                employmentHistory: (customSections.experience || []).map((exp: any, index: number) => ({
                    id: index + 1,
                    jobTitle: exp.jobTitle || '',
                    employer: exp.employer || '',
                    startDate: this.formatDateFromDB(exp.startDate),
                    endDate: this.formatDateFromDB(exp.endDate),
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
                    startDate: this.formatDateFromDB(course.startDate),
                    endDate: this.formatDateFromDB(course.endDate),
                })),
                internships: customSections.internships || [],
            };

        } catch (error) {
            console.error('Error in ResumeRepository.loadResumeData:', error);
            throw error;
        }
    }

    /**
     * Save complete resume data to custom_sections JSONB field
     */
    async saveResumeData(resumeId: string, resumeData: ResumeData): Promise<void> {
        try {
            const customSections = toCustomSections(resumeData);

            // Generate hash for change tracking
            const customSectionsHash = generateCustomSectionsHash(customSections);

            const { error } = await (this.supabase.from('resumes') as any).update({
                custom_sections: customSections,
                custom_sections_hash: customSectionsHash,
                updated_at: new Date().toISOString()
            })
                .eq('id', resumeId);

            if (error) {
                throw new Error(`Failed to save resume data: ${error.message}`);
            }

        } catch (error) {
            console.error('Error in ResumeRepository.saveResumeData:', error);
            throw error;
        }
    }

    /**
     * Update specific section of resume data
     */
    async updateResumeSection(resumeId: string, section: string, data: any): Promise<void> {
        try {
            // First get current custom_sections
            const { data: currentResume, error: fetchError } = await this.supabase
                .from('resumes')
                .select('custom_sections')
                .eq('id', resumeId)
                .single();

            if (fetchError) {
                throw new Error(`Failed to fetch current resume data: ${fetchError.message}`);
            }

            // Update the specific section
            const customSections = (currentResume.custom_sections as any) || {};
            customSections[section] = data;

            // Generate hash for change tracking
            const customSectionsHash = generateCustomSectionsHash(customSections);

            // Save back to database
            const { error } = await (this.supabase.from('resumes') as any).update({
                custom_sections: customSections,
                custom_sections_hash: customSectionsHash,
                updated_at: new Date().toISOString()
            })
                .eq('id', resumeId);

            if (error) {
                throw new Error(`Failed to update resume section: ${error.message}`);
            }

        } catch (error) {
            console.error(`Error in ResumeRepository.updateResumeSection (${section}):`, error);
            throw error;
        }
    }

    /**
     * Update resume metadata (title, template, color, etc.)
     */
    async updateResumeMetadata(
        resumeId: string,
        updates: {
            title?: string;
            template_id?: string;
            template_name?: string;
            color?: string;
        }
    ): Promise<void> {
        try {
            const { error } = await (this.supabase.from('resumes') as any).update({
                ...updates,
                updated_at: new Date().toISOString()
            })
                .eq('id', resumeId);

            if (error) {
                throw new Error(`Failed to update resume metadata: ${error.message}`);
            }
        } catch (error) {
            console.error('Error in ResumeRepository.updateResumeMetadata:', error);
            throw error;
        }
    }

    /**
     * Get all resumes for a user
     */
    async getUserResumes(userId: string): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('resumes')
                .select('id, title, template_id, template_name, color, created_at, updated_at')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });

            if (error) {
                throw new Error(`Failed to fetch user resumes: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('Error in ResumeRepository.getUserResumes:', error);
            throw error;
        }
    }

    /**
     * Get the current custom_sections_hash for a resume
     */
    async getCustomSectionsHash(resumeId: string): Promise<string | null> {
        try {
            const { data, error } = await this.supabase
                .from('resumes')
                .select('custom_sections_hash')
                .eq('id', resumeId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Resume not found
                }
                throw new Error(`Failed to get custom sections hash: ${error.message}`);
            }

            return data.custom_sections_hash;
        } catch (error) {
            console.error('Error in ResumeRepository.getCustomSectionsHash:', error);
            throw error;
        }
    }

    /**
     * Check if custom_sections have changed by comparing hashes
     */
    async hasCustomSectionsChanged(resumeId: string, newResumeData: ResumeData): Promise<boolean> {
        try {
            const currentHash = await this.getCustomSectionsHash(resumeId);
            const newHash = generateCustomSectionsHash(newResumeData);

            return hasCustomSectionsChanged(currentHash, newHash);
        } catch (error) {
            console.error('Error in ResumeRepository.hasCustomSectionsChanged:', error);
            throw error;
        }
    }

    /**
     * Helper function to format dates from database
     */
    private formatDateFromDB(dateString: string | null | undefined): string {
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
}
