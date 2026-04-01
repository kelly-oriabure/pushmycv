import { TemplateRepository } from '@/lib/repositories/templateRepository';

// Mock template data
jest.mock('@/lib/data/templates', () => ({
    templates: [
        {
            id: 'template-1',
            uuid: 'uuid-1',
            name: 'Professional',
            description: 'A professional template',
            image: 'professional.png',
            category: 'professional'
        },
        {
            id: 'template-2',
            uuid: 'uuid-2',
            name: 'Creative',
            description: 'A creative template',
            image: 'creative.png',
            category: 'creative'
        }
    ]
}));

describe('TemplateRepository', () => {
    let templateRepository: TemplateRepository;

    beforeEach(() => {
        // Create new instance of template repository for each test
        templateRepository = new TemplateRepository();
    });

    describe('getAll', () => {
        it('should return all templates', async () => {
            const result = await templateRepository.getAll();

            expect(result).toHaveLength(2);
            expect(result).toEqual([
                {
                    id: 'template-1',
                    uuid: 'uuid-1',
                    name: 'Professional',
                    description: 'A professional template',
                    image: 'professional.png',
                    category: 'professional'
                },
                {
                    id: 'template-2',
                    uuid: 'uuid-2',
                    name: 'Creative',
                    description: 'A creative template',
                    image: 'creative.png',
                    category: 'creative'
                }
            ]);
        });
    });

    describe('getById', () => {
        it('should return a template when found by ID', async () => {
            const result = await templateRepository.getById('template-1');

            expect(result).toEqual({
                id: 'template-1',
                uuid: 'uuid-1',
                name: 'Professional',
                description: 'A professional template',
                image: 'professional.png',
                category: 'professional'
            });
        });

        it('should return null when template is not found by ID', async () => {
            const result = await templateRepository.getById('non-existent-template');

            expect(result).toBeNull();
        });
    });

    describe('getByUuid', () => {
        it('should return a template when found by UUID', async () => {
            const result = await templateRepository.getByUuid('uuid-1');

            expect(result).toEqual({
                id: 'template-1',
                uuid: 'uuid-1',
                name: 'Professional',
                description: 'A professional template',
                image: 'professional.png',
                category: 'professional'
            });
        });

        it('should return null when template is not found by UUID', async () => {
            const result = await templateRepository.getByUuid('non-existent-uuid');

            expect(result).toBeNull();
        });
    });
});
