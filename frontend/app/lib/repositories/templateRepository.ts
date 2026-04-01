import templatesData from '@/data/templates';
import { Template } from '../types/resumeBuilder';

export class TemplateRepository {
    /**
     * Gets all available templates
     */
    async getAll(): Promise<Template[]> {
        try {
            // In a real implementation, this might fetch from a database
            // For now, we're using the static data
            return templatesData;
        } catch (error) {
            console.error('Error in TemplateRepository.getAll:', error);
            throw error;
        }
    }

    /**
     * Gets a template by its local ID
     */
    async getById(id: string): Promise<Template | null> {
        try {
            const template = templatesData.find(t => t.id === id);
            return template || null;
        } catch (error) {
            console.error('Error in TemplateRepository.getById:', error);
            throw error;
        }
    }

    /**
     * Gets a template by its UUID
     */
    async getByUuid(uuid: string): Promise<Template | null> {
        try {
            const template = templatesData.find(t => t.uuid === uuid);
            return template || null;
        } catch (error) {
            console.error('Error in TemplateRepository.getByUuid:', error);
            throw error;
        }
    }
}
