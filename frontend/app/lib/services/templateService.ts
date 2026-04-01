import { TemplateRepository } from '../repositories/templateRepository';
import { ResumeRepository } from '../repositories/resumeRepository';
import { getSupabaseClient } from '@/integrations/supabase/client';
import {
    Template,
    TemplateSelectionParams,
    ResumeRecord
} from '../types/resumeBuilder';

export class TemplateService {
    private templateRepository: TemplateRepository;
    private resumeRepository: ResumeRepository;

    constructor() {
        this.templateRepository = new TemplateRepository();
        this.resumeRepository = new ResumeRepository(getSupabaseClient());
    }

    /**
     * Gets all available templates
     */
    async getTemplates(): Promise<Template[]> {
        try {
            return await this.templateRepository.getAll();
        } catch (error) {
            console.error('Error in TemplateService.getTemplates:', error);
            throw error;
        }
    }

    /**
     * Gets a template by its local ID
     */
    async getTemplateById(id: string): Promise<Template | null> {
        try {
            return await this.templateRepository.getById(id);
        } catch (error) {
            console.error('Error in TemplateService.getTemplateById:', error);
            throw error;
        }
    }

    /**
     * Gets a template by its UUID
     */
    async getTemplateByUuid(uuid: string): Promise<Template | null> {
        try {
            return await this.templateRepository.getByUuid(uuid);
        } catch (error) {
            console.error('Error in TemplateService.getTemplateByUuid:', error);
            throw error;
        }
    }

    /**
     * Applies a template to a resume
     */
    async applyTemplate(params: TemplateSelectionParams): Promise<ResumeRecord> {
        try {
            // Validate the template exists
            const template = await this.templateRepository.getByUuid(params.templateId);
            if (!template) {
                throw new Error(`Template with ID ${params.templateId} not found`);
            }

            // Get the user's resumes
            const userResumes = await this.resumeRepository.getUserResumes(params.userId);
            if (userResumes.length === 0) {
                throw new Error(`No resumes found for user ${params.userId}`);
            }

            // Use the first resume (assuming one resume per user for now)
            const resume = userResumes[0];

            // Update the resume with the new template
            await this.resumeRepository.updateResumeMetadata(resume.id, {
                template_id: params.templateId,
                template_name: template.name,
                color: params.color
            });

            return resume; // Return the original resume object
        } catch (error) {
            console.error('Error in TemplateService.applyTemplate:', error);
            throw error;
        }
    }
}
