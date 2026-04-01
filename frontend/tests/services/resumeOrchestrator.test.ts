import { ResumeOrchestrator } from '@/lib/services/resumeOrchestrator';
import { ResumeRepository } from '@/lib/repositories/resumeRepository';
import { TemplateRepository } from '@/lib/repositories/templateRepository';

// Mock the repositories
jest.mock('@/lib/repositories/resumeRepository');
jest.mock('@/lib/repositories/templateRepository');

describe('ResumeOrchestrator', () => {
    let orchestrator: ResumeOrchestrator;
    let mockResumeRepository: jest.Mocked<ResumeRepository>;
    let mockTemplateRepository: jest.Mocked<TemplateRepository>;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Create new instance of orchestrator for each test
        orchestrator = new ResumeOrchestrator();

        // Get the mocked repositories
        mockResumeRepository = (ResumeRepository as jest.MockedClass<typeof ResumeRepository>).mock.instances[0] as jest.Mocked<ResumeRepository>;
        mockTemplateRepository = (TemplateRepository as jest.MockedClass<typeof TemplateRepository>).mock.instances[0] as jest.Mocked<TemplateRepository>;
    });

    describe('createNewResume', () => {
        it('should create a new resume when no template is provided', async () => {
            const mockResumeRecord = {
                id: 'resume-123',
                user_id: 'user-456',
                title: 'My Resume',
                template_id: null,
                template_name: null,
                color: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                custom_sections: {}
            };

            mockResumeRepository.create.mockResolvedValue(mockResumeRecord);

            const params = {
                userId: 'user-456',
                title: 'My Resume'
            };

            const result = await orchestrator.createNewResume(params);

            expect(result).toEqual(mockResumeRecord);
            expect(mockResumeRepository.create).toHaveBeenCalledWith(params);
            expect(mockTemplateRepository.getByUuid).not.toHaveBeenCalled();
        });

        it('should create a new resume when a valid template is provided', async () => {
            const mockResumeRecord = {
                id: 'resume-123',
                user_id: 'user-456',
                title: 'My Resume',
                template_id: 'template-789',
                template_name: 'Professional',
                color: '#000000',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                custom_sections: {}
            };

            const mockTemplate = {
                id: 'template-1',
                uuid: 'template-789',
                name: 'Professional',
                description: 'A professional template',
                image: 'professional.png',
                categories: ['professional']
            };

            mockTemplateRepository.getByUuid.mockResolvedValue(mockTemplate);
            mockResumeRepository.create.mockResolvedValue(mockResumeRecord);

            const params = {
                userId: 'user-456',
                title: 'My Resume',
                templateId: 'template-789'
            };

            const result = await orchestrator.createNewResume(params);

            expect(result).toEqual(mockResumeRecord);
            expect(mockTemplateRepository.getByUuid).toHaveBeenCalledWith('template-789');
            expect(mockResumeRepository.create).toHaveBeenCalledWith(params);
        });

        it('should throw an error when an invalid template is provided', async () => {
            mockTemplateRepository.getByUuid.mockResolvedValue(null);

            const params = {
                userId: 'user-456',
                title: 'My Resume',
                templateId: 'invalid-template'
            };

            await expect(orchestrator.createNewResume(params)).rejects.toThrow('Template with ID invalid-template not found');

            expect(mockTemplateRepository.getByUuid).toHaveBeenCalledWith('invalid-template');
            expect(mockResumeRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('loadResumeForEditing', () => {
        it('should load a resume and all its sections for editing', async () => {
            const mockResume = {
                id: 'resume-123',
                user_id: 'user-456',
                title: 'My Resume',
                template_id: 'template-789',
                template_name: 'Professional',
                color: '#000000',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                custom_sections: {
                    personal_details: {
                        first_name: 'John',
                        last_name: 'Doe'
                    },
                    professional_summary: 'Experienced developer'
                }
            };

            const mockEducation = [
                {
                    id: 'edu-1',
                    resume_id: 'resume-123',
                    school: 'University of Example',
                    degree: 'BSc Computer Science',
                    start_date: '2015-09-01',
                    end_date: '2019-06-01',
                    location: 'Example City, Example Country',
                    description: 'Studied computer science'
                }
            ];

            const mockExperience = [
                {
                    id: 'exp-1',
                    resume_id: 'resume-123',
                    employer: 'Example Corp', // Matches database field
                    jobTitle: 'Software Engineer', // Matches database field
                    start_date: '2019-07-01',
                    end_date: '',
                    location: 'Example City', // Matches database field
                    description: 'Developed web applications'
                }
            ];

            mockResumeRepository.getById.mockResolvedValue(mockResume);
            mockResumeRepository.getEducationByResumeId.mockResolvedValue(mockEducation);
            mockResumeRepository.getExperienceByResumeId.mockResolvedValue(mockExperience);
            mockResumeRepository.getSkillsByResumeId.mockResolvedValue([]);
            mockResumeRepository.getLanguagesByResumeId.mockResolvedValue([]);
            mockResumeRepository.getReferencesByResumeId.mockResolvedValue([]);
            mockResumeRepository.getCoursesByResumeId.mockResolvedValue([]);
            mockResumeRepository.getInternshipsByResumeId.mockResolvedValue([]);

            const result = await orchestrator.loadResumeForEditing('resume-123', 'user-456');

            expect(result).toEqual({
                resume: mockResume,
                education: mockEducation,
                experience: mockExperience,
                skills: [],
                languages: [],
                references: [],
                courses: [],
                internships: []
            });

            expect(mockResumeRepository.getById).toHaveBeenCalledWith('resume-123');
            expect(mockResumeRepository.getEducationByResumeId).toHaveBeenCalledWith('resume-123');
            expect(mockResumeRepository.getExperienceByResumeId).toHaveBeenCalledWith('resume-123');
            expect(mockResumeRepository.getSkillsByResumeId).toHaveBeenCalledWith('resume-123');
            expect(mockResumeRepository.getLanguagesByResumeId).toHaveBeenCalledWith('resume-123');
            expect(mockResumeRepository.getReferencesByResumeId).toHaveBeenCalledWith('resume-123');
            expect(mockResumeRepository.getCoursesByResumeId).toHaveBeenCalledWith('resume-123');
            expect(mockResumeRepository.getInternshipsByResumeId).toHaveBeenCalledWith('resume-123');
        });

        it('should return null when resume is not found', async () => {
            mockResumeRepository.getById.mockResolvedValue(null);

            const result = await orchestrator.loadResumeForEditing('non-existent-resume', 'user-456');

            expect(result).toBeNull();
            expect(mockResumeRepository.getById).toHaveBeenCalledWith('non-existent-resume');
            expect(mockResumeRepository.getEducationByResumeId).not.toHaveBeenCalled();
        });

        it('should throw an error when user is not authorized to access the resume', async () => {
            const mockResume = {
                id: 'resume-123',
                user_id: 'user-789', // Different user
                title: 'My Resume',
                template_id: null,
                template_name: null,
                color: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                custom_sections: {}
            };

            mockResumeRepository.getById.mockResolvedValue(mockResume);

            await expect(orchestrator.loadResumeForEditing('resume-123', 'user-456')).rejects.toThrow('Unauthorized access to resume');

            expect(mockResumeRepository.getById).toHaveBeenCalledWith('resume-123');
            expect(mockResumeRepository.getEducationByResumeId).not.toHaveBeenCalled();
        });
    });
});
