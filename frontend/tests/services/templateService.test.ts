import { TemplateService } from '@/lib/services/templateService';
import { TemplateRepository } from '@/lib/repositories/templateRepository';
import { ResumeRepository } from '@/lib/repositories/resumeRepository';

// Mock the repositories
jest.mock('@/lib/repositories/templateRepository');
jest.mock('@/lib/repositories/resumeRepository');

describe('TemplateService', () => {
    let templateService: TemplateService;
    let mockTemplateRepository: jest.Mocked<TemplateRepository>;
    let mockResumeRepository: jest.Mocked<ResumeRepository>;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Create new instance of template service for each test
        templateService = new TemplateService();

        // Get the mocked repositories
        mockTemplateRepository = (TemplateRepository as jest.MockedClass<typeof TemplateRepository>).mock.instances[0] as jest.Mocked<TemplateRepository>;
        mockResumeRepository = (ResumeRepository as jest.MockedClass<typeof ResumeRepository>).mock.instances[0] as jest.Mocked<ResumeRepository>;
    });

    describe('getTemplates', () => {
        it('should return all templates', async () => {
            const mockTemplates = [
                {
                    id: 'template-1',
                    uuid: 'uuid-1',
                    name: 'Professional',
                    description: 'A professional template',
                    image: 'professional.png',
                    categories: ['professional']
                },
                {
                    id: 'template-2',
                    uuid: 'uuid-2',
                    name: 'Creative',
                    description: 'A creative template',
                    image: 'creative.png',
                    categories: ['creative']
                }
            ];

            mockTemplateRepository.getAll.mockResolvedValue(mockTemplates);

            const result = await templateService.getTemplates();

            expect(result).toEqual(mockTemplates);
            expect(mockTemplateRepository.getAll).toHaveBeenCalled();
        });
    });

    describe('getTemplateById', () => {
        it('should return a template when found by ID', async () => {
            const mockTemplate = {
                id: 'template-1',
                uuid: 'uuid-1',
                name: 'Professional',
                description: 'A professional template',
                image: 'professional.png',
                categories: ['professional']
            };

            mockTemplateRepository.getById.mockResolvedValue(mockTemplate);

            const result = await templateService.getTemplateById('template-1');

            expect(result).toEqual(mockTemplate);
            expect(mockTemplateRepository.getById).toHaveBeenCalledWith('template-1');
        });

        it('should return null when template is not found by ID', async () => {
            mockTemplateRepository.getById.mockResolvedValue(null);

            const result = await templateService.getTemplateById('non-existent-template');

            expect(result).toBeNull();
            expect(mockTemplateRepository.getById).toHaveBeenCalledWith('non-existent-template');
        });
    });

    describe('getTemplateByUuid', () => {
        it('should return a template when found by UUID', async () => {
            const mockTemplate = {
                id: 'template-1',
                uuid: 'uuid-1',
                name: 'Professional',
                description: 'A professional template',
                image: 'professional.png',
                categories: ['professional']
            };

            mockTemplateRepository.getByUuid.mockResolvedValue(mockTemplate);

            const result = await templateService.getTemplateByUuid('uuid-1');

            expect(result).toEqual(mockTemplate);
            expect(mockTemplateRepository.getByUuid).toHaveBeenCalledWith('uuid-1');
        });

        it('should return null when template is not found by UUID', async () => {
            mockTemplateRepository.getByUuid.mockResolvedValue(null);

            const result = await templateService.getTemplateByUuid('non-existent-uuid');

            expect(result).toBeNull();
            expect(mockTemplateRepository.getByUuid).toHaveBeenCalledWith('non-existent-uuid');
        });
    });

    describe('applyTemplate', () => {
        it('should apply a template to a resume', async () => {
            const mockTemplate = {
                id: 'template-1',
                uuid: 'template-uuid',
                name: 'Professional',
                description: 'A professional template',
                image: 'professional.png',
                categories: ['professional']
            };

            const mockUpdatedResume = {
                id: 'resume-123',
                user_id: 'user-456',
                title: 'My Resume',
                template_id: 'template-uuid',
                template_name: 'Professional',
                color: '#000000',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                custom_sections: {}
            };

            const params = {
                userId: 'user-456',
                templateId: 'template-uuid',
                color: '#000000'
            };

            mockTemplateRepository.getByUuid.mockResolvedValue(mockTemplate);
            mockResumeRepository.update.mockResolvedValue(mockUpdatedResume);

            const result = await templateService.applyTemplate(params);

            expect(result).toEqual(mockUpdatedResume);
            expect(mockTemplateRepository.getByUuid).toHaveBeenCalledWith('template-uuid');
            expect(mockResumeRepository.update).toHaveBeenCalledWith('user-456', {
                template_id: 'template-uuid',
                template_name: 'Professional',
                color: '#000000'
            });
        });

        it('should throw an error when template is not found', async () => {
            const params = {
                userId: 'user-456',
                templateId: 'non-existent-template',
                color: '#000000'
            };

            mockTemplateRepository.getByUuid.mockResolvedValue(null);

            await expect(templateService.applyTemplate(params)).rejects.toThrow('Template with ID non-existent-template not found');

            expect(mockTemplateRepository.getByUuid).toHaveBeenCalledWith('non-existent-template');
            expect(mockResumeRepository.update).not.toHaveBeenCalled();
        });
    });
});
