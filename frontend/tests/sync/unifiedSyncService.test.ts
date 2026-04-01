import { UnifiedSyncService } from '@/lib/services/unifiedSyncService';
import type { ResumeData } from '@/lib/types';

// Mock the dependencies
jest.mock('@/lib/services/resumeOrchestrator', () => ({
    ResumeOrchestrator: jest.fn().mockImplementation(() => ({
        saveResumeChanges: jest.fn().mockResolvedValue(undefined),
    })),
}));

jest.mock('@/lib/repositories/formDataRepository', () => ({
    FormDataRepositoryImpl: jest.fn().mockImplementation(() => ({
        update: jest.fn().mockResolvedValue(undefined),
    })),
}));

describe('UnifiedSyncService', () => {
    let syncService: UnifiedSyncService;
    const mockResumeData: ResumeData = {
        personalDetails: {
            jobTitle: 'Developer',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '123-456-7890',
            address: '123 Main St',
            cityState: 'City, State',
            country: 'USA',
            photoUrl: '',
        },
        professionalSummary: 'Experienced developer',
        education: [],
        employmentHistory: [],
        skills: [],
        languages: [],
        references: { hideReferences: true, references: [] },
        courses: [],
        internships: [],
    };

    beforeEach(() => {
        syncService = new UnifiedSyncService();
    });

    afterEach(() => {
        syncService.destroy();
    });

    describe('Resume Data Sync', () => {
        it('should schedule sync for resume data', () => {
            const resumeId = 'test-resume-id';

            syncService.scheduleResumeSync(resumeId, mockResumeData);

            const state = syncService.getState();
            expect(state.hasPendingChanges).toBe(true);
        });

        it('should skip sync for temporary resume IDs', () => {
            const tempId = 'temp-resume-id';

            syncService.scheduleResumeSync(tempId, mockResumeData);

            const state = syncService.getState();
            expect(state.hasPendingChanges).toBe(false);
        });

        it('should skip sync for unchanged data', () => {
            const resumeId = 'test-resume-id';

            // First sync
            syncService.scheduleResumeSync(resumeId, mockResumeData);

            // Second sync with same data
            syncService.scheduleResumeSync(resumeId, mockResumeData);

            const state = syncService.getState();
            expect(state.hasPendingChanges).toBe(true); // Still pending from first sync
        });
    });

    describe('State Management', () => {
        it('should provide initial state', () => {
            const state = syncService.getState();

            expect(state).toEqual({
                isSyncing: false,
                lastSyncTime: null,
                error: null,
                hasPendingChanges: false,
                consecutiveErrors: 0,
            });
        });

        it('should notify state change callbacks', (done) => {
            const callback = jest.fn();
            const unsubscribe = syncService.onStateChange(callback);

            syncService.scheduleResumeSync('test-id', mockResumeData);

            // Wait for state change
            setTimeout(() => {
                expect(callback).toHaveBeenCalled();
                unsubscribe();
                done();
            }, 100);
        });
    });

    describe('Configuration', () => {
        it('should use default configuration', () => {
            const service = new UnifiedSyncService();
            const state = service.getState();

            expect(state).toBeDefined();
            service.destroy();
        });

        it('should accept custom configuration', () => {
            const customConfig = {
                debounceMs: 1000,
                maxRetries: 5,
                showToasts: false,
            };

            const service = new UnifiedSyncService(customConfig);
            const state = service.getState();

            expect(state).toBeDefined();
            service.destroy();
        });
    });

    describe('Cleanup', () => {
        it('should cancel pending syncs on destroy', () => {
            const resumeId = 'test-resume-id';

            syncService.scheduleResumeSync(resumeId, mockResumeData);
            syncService.destroy();

            const state = syncService.getState();
            expect(state.hasPendingChanges).toBe(false);
        });
    });
});
