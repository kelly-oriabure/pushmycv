import { FormDataRepositoryImpl } from '@/lib/repositories/formDataRepository';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
};

jest.mock('@/integrations/supabase/client', () => ({
  getSupabaseClient: () => mockSupabase,
}));

describe('FormDataRepositoryImpl', () => {
  let repository: FormDataRepositoryImpl;
  
  beforeEach(() => {
    repository = new FormDataRepositoryImpl('resumes');
    jest.clearAllMocks();
  });
  
  describe('with resumes table', () => {
    beforeEach(() => {
      repository = new FormDataRepositoryImpl('resumes');
      jest.clearAllMocks();
    });
    
    describe('create', () => {
      it('should create a new form data record', async () => {
        const mockResult = { id: 'test-id' };
        mockSupabase.select.mockResolvedValueOnce({ data: mockResult, error: null });
        
        const testData = {
          personalDetails: { firstName: 'John', lastName: 'Doe' },
          education: [],
        };
        
        const result = await repository.create(testData, { userId: 'test-user-id' });
        
        expect(result).toBe('test-id');
        expect(mockSupabase.from).toHaveBeenCalledWith('resumes');
        expect(mockSupabase.insert).toHaveBeenCalled();
      });
    
      it('should throw an error if creation fails', async () => {
        mockSupabase.select.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });
        
        const testData = { personalDetails: { firstName: 'John' } };
        
        await expect(repository.create(testData, { userId: 'test-user-id' })).rejects.toThrow('Failed to create form data');
      });
    });
  });
  
  describe('read', () => {
    it('should read form data by ID', async () => {
      const mockData = { personalDetails: { firstName: 'John' } };
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: { custom_sections: mockData }, error: null });
      
      const result = await repository.read('test-id');
      
      expect(result).toEqual(mockData);
    });
    
    it('should return null if no data found', async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      
      const result = await repository.read('non-existent-id');
      
      expect(result).toBeNull();
    });
  });
  
  describe('update', () => {
    it('should update form data', async () => {
      mockSupabase.update.mockResolvedValueOnce({ error: null });
      
      const result = await repository.update('test-id', { personalDetails: { firstName: 'Jane' } });
      
      expect(result).toBe(true);
    });
  });
  
  describe('updateSection', () => {
    it('should update a specific section', async () => {
      const mockData = { personalDetails: { firstName: 'John' } };
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: { custom_sections: mockData }, error: null });
      mockSupabase.update.mockResolvedValueOnce({ error: null });
      
      const result = await repository.updateSection('test-id', 'personalDetails', { firstName: 'Jane' });
      
      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('resumes');
    });
  });
  
  describe('with other tables', () => {
    beforeEach(() => {
      repository = new FormDataRepositoryImpl('education');
      jest.clearAllMocks();
    });
    
    describe('create', () => {
      it('should create a new form data record', async () => {
        const mockResult = { id: 'test-id' };
        mockSupabase.select.mockResolvedValueOnce({ data: mockResult, error: null });
        
        const testData = {
          name: 'University of Test',
          degree: 'Bachelor of Science',
        };
        
        const result = await repository.create(testData as any);
        
        expect(result).toBe('test-id');
        expect(mockSupabase.from).toHaveBeenCalledWith('education');
        expect(mockSupabase.insert).toHaveBeenCalled();
      });
    });
    
    describe('read', () => {
      it('should read form data by ID', async () => {
        const mockData = { 
          id: 'test-id',
          name: 'University of Test', 
          degree: 'Bachelor of Science',
          resume_id: 'resume-id'
        };
        mockSupabase.maybeSingle.mockResolvedValueOnce({ data: mockData, error: null });
        
        const result = await repository.read('test-id');
        
        expect(result).toEqual({
          name: 'University of Test',
          degree: 'Bachelor of Science',
          resume_id: 'resume-id'
        });
      });
      
      it('should return null if no data found', async () => {
        mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        
        const result = await repository.read('non-existent-id');
        
        expect(result).toBeNull();
      });
    });
    
    describe('update', () => {
      it('should update form data', async () => {
        mockSupabase.update.mockResolvedValueOnce({ error: null });
        
        const result = await repository.update('test-id', { name: 'Updated University' } as any);
        
        expect(result).toBe(true);
      });
    });
  });
});