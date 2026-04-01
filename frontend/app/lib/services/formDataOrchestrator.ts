import { FormData, FormDataOrchestrator, ValidTableNames } from '@/lib/types/formData';
import { FormDataRepositoryImpl } from '@/lib/repositories/formDataRepository';
import { FormSyncServiceImpl } from '@/lib/services/formSyncService';

/**
 * Orchestrator for coordinating complex form data operations
 */
export class FormDataOrchestratorImpl<T extends FormData = FormData> implements FormDataOrchestrator<T> {
  private repository: FormDataRepositoryImpl<T>;
  private syncService: FormSyncServiceImpl<T>;
  
  constructor(tableName: ValidTableNames = 'resumes') {
    this.repository = new FormDataRepositoryImpl<T>(tableName);
    this.syncService = new FormSyncServiceImpl<T>(tableName);
  }
  
  /**
   * Load form data by ID
   */
  async load(id: string): Promise<T | null> {
    try {
      return await this.repository.read(id);
    } catch (error) {
      console.error('Error loading form data:', error);
      throw new Error(`Failed to load form data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Save form data
   */
  async save(id: string, data: T): Promise<void> {
    try {
      await this.repository.update(id, data);
    } catch (error) {
      console.error('Error saving form data:', error);
      throw new Error(`Failed to save form data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Validate form data
   */
  validate(data: T): boolean {
    // Basic validation - check if data is an object
    if (!data || typeof data !== 'object') return false;
    
    // Add more specific validation as needed
    return true;
  }
  
  /**
   * Transform data for storage
   */
  transformForStorage(data: T): any {
    // For now, return data as-is
    // In the future, this could handle transformations like:
    // - Converting dates to strings
    // - Removing temporary fields
    // - Normalizing data formats
    return data;
  }
  
  /**
   * Transform data from storage
   */
  transformFromStorage(data: any): T {
    // For now, return data as-is
    // In the future, this could handle transformations like:
    // - Converting strings to dates
    // - Adding default values for missing fields
    // - Normalizing data formats
    return data as T;
  }
  
  /**
   * Schedule a sync operation
   */
  scheduleSync(id: string, data: T, delay: number = 1000): void {
    this.syncService.scheduleSync(id, data, delay);
  }
  
  /**
   * Sync immediately
   */
  async syncImmediately(id: string, data: T): Promise<void> {
    await this.syncService.syncImmediately(id, data);
  }
  
  /**
   * Update a specific section
   */
  async updateSection<K extends keyof T>(id: string, section: K, data: T[K]): Promise<void> {
    try {
      await this.repository.updateSection(id, section, data);
    } catch (error) {
      console.error(`Error updating section ${String(section)}:`, error);
      throw new Error(`Failed to update section: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Update multiple sections
   */
  async updateMultipleSections(id: string, sections: Partial<T>): Promise<void> {
    try {
      await this.repository.updateMultipleSections(id, sections);
    } catch (error) {
      console.error('Error updating multiple sections:', error);
      throw new Error(`Failed to update sections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export a default instance for the resume table
export const resumeDataOrchestrator = new FormDataOrchestratorImpl<FormData>('resumes');
