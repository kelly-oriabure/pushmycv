import { SupabaseClient } from '@supabase/supabase-js';
import { ResumeRepository } from '@/lib/repositories/resumeRepository';
import { ResumeSectionRepository } from '@/lib/repositories/resumeSectionRepository';
import { ResumeData } from '@/lib/types';

export class ResumeOrchestrator {
    private resumeRepository: ResumeRepository;
    private sectionRepository: ResumeSectionRepository;

    constructor(supabase: SupabaseClient) {
        this.resumeRepository = new ResumeRepository(supabase);
        this.sectionRepository = new ResumeSectionRepository(supabase);
    }

    /**
     * Load complete resume data
     */
    async loadResume(resumeId: string): Promise<ResumeData | null> {
        return await this.resumeRepository.loadResumeData(resumeId);
    }

    /**
     * Save complete resume data
     * Now syncs to both JSONB (for backward compatibility) and normalized tables
     */
    async saveResume(resumeId: string, resumeData: ResumeData): Promise<void> {
        // Save to JSONB for backward compatibility
        await this.resumeRepository.saveResumeData(resumeId, resumeData);

        // Also sync to normalized tables (non-blocking)
        // Use Promise.allSettled to ensure one failure doesn't break the other
        await Promise.allSettled([
            this.sectionRepository.syncPersonalDetails(resumeId, resumeData.personalDetails),
            this.sectionRepository.syncProfessionalSummary(resumeId, resumeData.professionalSummary),
            this.sectionRepository.syncEducation(resumeId, resumeData.education),
            this.sectionRepository.syncEmploymentHistory(resumeId, resumeData.employmentHistory),
            this.sectionRepository.syncSkills(resumeId, resumeData.skills),
            this.sectionRepository.syncLanguages(resumeId, resumeData.languages),
            this.sectionRepository.syncReferences(resumeId, resumeData.references),
            this.sectionRepository.syncCourses(resumeId, resumeData.courses),
        ]);
    }

    /**
     * Sync a specific section to normalized tables
     */
    async syncSection(resumeId: string, section: keyof ResumeData, data: ResumeData[keyof ResumeData]): Promise<void> {
        await this.sectionRepository.syncSection(resumeId, section, data);
    }

    /**
     * Update specific section of resume data
     */
    async updateSection(resumeId: string, section: string, data: any): Promise<void> {
        await this.resumeRepository.updateResumeSection(resumeId, section, data);
    }

    /**
     * Create a new resume record
     */
    async createNewResume(
        title: string,
        userId: string,
        templateId?: string,
        templateName?: string,
        color?: string
    ): Promise<string> {
        const supabase = this.resumeRepository['supabase']; // Access private property

        const { data, error } = await supabase
            .from('resumes')
            .insert({
                title,
                user_id: userId,
                template_id: templateId,
                template_name: templateName,
                color: color || '#000000',
                custom_sections: {}, // Initialize with empty sections
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select('id')
            .single();

        if (error) {
            throw new Error(`Failed to create resume: ${error.message}`);
        }

        return data.id;
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
        const supabase = this.resumeRepository['supabase']; // Access private property

        const { error } = await (supabase.from('resumes') as any).update({
            ...updates,
            updated_at: new Date().toISOString()
        })
            .eq('id', resumeId);

        if (error) {
            throw new Error(`Failed to update resume metadata: ${error.message}`);
        }
    }

    /**
     * Delete a resume
     */
    async deleteResume(resumeId: string): Promise<void> {
        const supabase = this.resumeRepository['supabase']; // Access private property

        const { error } = await supabase
            .from('resumes')
            .delete()
            .eq('id', resumeId);

        if (error) {
            throw new Error(`Failed to delete resume: ${error.message}`);
        }
    }

    /**
     * Get all resumes for a user
     */
    async getUserResumes(userId: string): Promise<any[]> {
        const supabase = this.resumeRepository['supabase']; // Access private property

        const { data, error } = await supabase
            .from('resumes')
            .select('id, title, template_id, template_name, color, created_at, updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch user resumes: ${error.message}`);
        }

        return data || [];
    }
}
