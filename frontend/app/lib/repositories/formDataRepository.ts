import { getSupabaseClient } from '@/integrations/supabase/client';
import { FormData, FormDataRepository, ValidTableNames } from '@/lib/types/formData';

/**
 * Generic repository for form data operations
 * Handles CRUD operations for form data stored in Supabase
 */
export class FormDataRepositoryImpl<T extends FormData = FormData> implements FormDataRepository<T> {
  private tableName: ValidTableNames;
  private supabase = getSupabaseClient();
  
  constructor(tableName: ValidTableNames = 'resumes') {
    this.tableName = tableName;
  }
  
  /**
   * Create a new form data record
   */
  async create(data: T, options?: { userId?: string; title?: string }): Promise<string> {
    let result: any;
    let error: any;
    
    if (this.tableName === 'resumes') {
      // For resumes table, we need to provide required fields
      const { data: insertResult, error: insertError } = await this.supabase
        .from(this.tableName)
        .insert({
          title: options?.title || 'Untitled Resume',
          user_id: options?.userId || '', // This should be provided by the caller or from auth context
          custom_sections: data as any,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .select('id')
        .single();
      
      result = insertResult;
      error = insertError;
    } else {
      // For other tables, we insert the data directly
      const { data: insertResult, error: insertError } = await this.supabase
        .from(this.tableName)
        .insert({
          ...data as any,
          created_at: new Date().toISOString(),
        } as any)
        .select('id')
        .single();
      
      result = insertResult;
      error = insertError;
    }
    
    if (error) throw new Error(`Failed to create form data: ${error.message}`);
    
    return result.id;
  }
  
  /**
   * Read form data by ID
   */
  async read(id: string): Promise<T | null> {
    // For resumes table, we use custom_sections column
    if (this.tableName === 'resumes') {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('custom_sections')
        .eq('id', id)
        .maybeSingle();
        
      if (error) throw new Error(`Failed to read form data: ${error.message}`);
      
      if (!data) return null;
      
      return data.custom_sections as T;
    } else {
      // For other tables, we select all columns and return the data as-is
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();
        
      if (error) throw new Error(`Failed to read form data: ${error.message}`);
      
      if (!data) return null;
      
      // Remove the id field from the returned data since it's not part of the form data
      const { id: _, ...formData } = data;
      return formData as unknown as T;
    }
  }
  
  /**
   * Update form data
   */
  async update(id: string, data: Partial<T>): Promise<boolean> {
    let error: any;
    
    if (this.tableName === 'resumes') {
      // For resumes table, update the custom_sections field
      const result = await this.supabase
        .from(this.tableName)
        .update({
          custom_sections: data as any,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id);
      
      error = result.error;
    } else {
      // For other tables, update all provided fields
      const result = await this.supabase
        .from(this.tableName)
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id);
      
      error = result.error;
    }
    
    if (error) throw new Error(`Failed to update form data: ${error.message}`);
    
    return true;
  }
  
  /**
   * Delete form data by ID
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(`Failed to delete form data: ${error.message}`);
    
    return true;
  }
  
  /**
   * Update a specific section of form data
   */
  async updateSection<K extends keyof T>(
    id: string, 
    section: K, 
    data: T[K]
  ): Promise<boolean> {
    // First get the current data
    const currentData = await this.read(id);
    if (!currentData) throw new Error('Form data not found');
    
    // Update only the specified section
    const updatedData = {
      ...currentData,
      [section]: data
    };
    
    return this.update(id, updatedData);
  }
  
  /**
   * Update multiple sections of form data
   */
  async updateMultipleSections(
    id: string, 
    sections: Partial<T>
  ): Promise<boolean> {
    // First get the current data
    const currentData = await this.read(id);
    if (!currentData) throw new Error('Form data not found');
    
    // Update the specified sections
    const updatedData = {
      ...currentData,
      ...sections
    };
    
    return this.update(id, updatedData);
  }
}

// Export a default instance for the resume table
export const resumeDataRepository = new FormDataRepositoryImpl<FormData>('resumes');
