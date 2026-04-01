import { ResumeRepository } from '@/lib/repositories/resumeRepository';
import { getSupabaseClient } from '@/integrations/supabase/client';

// Mock Supabase client
jest.mock('@/integrations/supabase/client');

describe('ResumeRepository', () => {
    let resumeRepository: ResumeRepository;
    let mockSupabase: any;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Create mock Supabase client
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockReturnThis(),
        };

        (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

        // Create new instance of resume repository for each test
        resumeRepository = new ResumeRepository();
    });

    describe('getById', () => {
        it('should return a resume when found by ID', async () => {
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

            mockSupabase.single.mockResolvedValue({ data: mockResume, error: null });

            const result = await resumeRepository.getById('resume-123');

            expect(result).toEqual({
                id: 'resume-123',
                user_id: 'user-456',
                title: 'My Resume',
                templateId: 'template-789',
                templateName: 'Professional',
                color: '#000000',
                created_at: mockResume.created_at,
                updated_at: mockResume.updated_at,
                customSections: {
                    personal_details: {
                        first_name: 'John',
                        last_name: 'Doe'
                    },
                    professional_summary: 'Experienced developer'
                }
            });
            expect(mockSupabase.from).toHaveBeenCalledWith('resumes');
            expect(mockSupabase.select).toHaveBeenCalled();
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'resume-123');
            expect(mockSupabase.single).toHaveBeenCalled();
        });

        it('should return null when resume is not found', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: null });

            const result = await resumeRepository.getById('non-existent-resume');

            expect(result).toBeNull();
        });

        it('should throw an error when Supabase returns an error', async () => {
            mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Database error' } });

            await expect(resumeRepository.getById('resume-123')).rejects.toThrow('Failed to fetch resume: Database error');
        });
    });

    describe('create', () => {
        it('should create a new resume', async () => {
            const params = {
                userId: 'user-456',
                title: 'My Resume',
                templateId: 'template-789',
                templateName: 'Professional',
                color: '#000000'
            };

            const mockResume = {
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

            mockSupabase.single.mockResolvedValue({ data: mockResume, error: null });

            const result = await resumeRepository.create(params);

            expect(result).toEqual({
                id: 'resume-123',
                user_id: 'user-456',
                title: 'My Resume',
                templateId: 'template-789',
                templateName: 'Professional',
                color: '#000000',
                created_at: mockResume.created_at,
                updated_at: mockResume.updated_at,
                customSections: {}
            });
            expect(mockSupabase.from).toHaveBeenCalledWith('resumes');
            expect(mockSupabase.insert).toHaveBeenCalledWith({
                user_id: 'user-456',
                title: 'My Resume',
                template_id: 'template-789',
                template_name: 'Professional',
                color: '#000000'
            });
            expect(mockSupabase.select).toHaveBeenCalled();
            expect(mockSupabase.single).toHaveBeenCalled();
        });

        it('should throw an error when Supabase returns an error', async () => {
            const params = {
                userId: 'user-456',
                title: 'My Resume'
            };

            mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Database error' } });

            await expect(resumeRepository.create(params)).rejects.toThrow('Failed to create resume: Database error');
        });
    });

    describe('update', () => {
        it('should update a resume', async () => {
            const params = {
                id: 'resume-123',
                templateId: 'new-template',
                templateName: 'Modern',
                color: '#FF0000'
            };

            const mockResume = {
                id: 'resume-123',
                user_id: 'user-456',
                title: 'My Resume',
                template_id: 'new-template',
                template_name: 'Modern',
                color: '#FF0000',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                custom_sections: {}
            };

            mockSupabase.single.mockResolvedValue({ data: mockResume, error: null });

            const result = await resumeRepository.update('resume-123', params);

            expect(result).toEqual({
                id: 'resume-123',
                user_id: 'user-456',
                title: 'My Resume',
                template_id: 'new-template',
                template_name: 'Modern',
                color: '#FF0000',
                created_at: mockResume.created_at,
                updated_at: mockResume.updated_at,
                custom_sections: {}
            });
            expect(mockSupabase.from).toHaveBeenCalledWith('resumes');
            expect(mockSupabase.update).toHaveBeenCalledWith({
                template_id: 'new-template',
                template_name: 'Modern',
                color: '#FF0000'
            });
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'resume-123');
            expect(mockSupabase.select).toHaveBeenCalled();
            expect(mockSupabase.single).toHaveBeenCalled();
        });

        it('should throw an error when Supabase returns an error', async () => {
            const params = {
                id: 'resume-123',
                templateId: 'new-template'
            };

            mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Database error' } });

            await expect(resumeRepository.update('resume-123', params)).rejects.toThrow('Failed to update resume: Database error');
        });
    });

    describe('delete', () => {
        it('should delete a resume', async () => {
            mockSupabase.eq.mockResolvedValue({ error: null });

            await expect(resumeRepository.delete('resume-123')).resolves.not.toThrow();

            expect(mockSupabase.from).toHaveBeenCalledWith('resumes');
            expect(mockSupabase.delete).toHaveBeenCalled();
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'resume-123');
        });

        it('should throw an error when Supabase returns an error', async () => {
            mockSupabase.eq.mockResolvedValue({ error: { message: 'Database error' } });

            await expect(resumeRepository.delete('resume-123')).rejects.toThrow('Failed to delete resume: Database error');
        });
    });
});
