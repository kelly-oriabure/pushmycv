import { FormData, FormSyncService, SyncState, ValidTableNames } from '@/lib/types/formData';
import { FormDataRepositoryImpl } from '@/lib/repositories/formDataRepository';

/**
 * Service for syncing form data with debouncing and error handling
 */
export class FormSyncServiceImpl<T extends FormData = FormData> implements FormSyncService<T> {
  private syncTimeout: NodeJS.Timeout | null = null;
  private pendingSyncParams: { id: string; data: T } | null = null;
  private syncState: SyncState = {
    status: 'idle',
    lastSyncTime: null,
    error: null,
    isDirty: false,
  };
  
  private repository: FormDataRepositoryImpl<T>;
  
  constructor(tableName: ValidTableNames = 'resumes') {
    this.repository = new FormDataRepositoryImpl<T>(tableName);
  }
  
  /**
   * Schedule a debounced sync operation
   */
  scheduleSync(id: string, data: T, delay: number = 1000): void {
    // Clear any existing timeout
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    
    // Store pending sync params
    this.pendingSyncParams = { id, data };
    this.syncState.isDirty = true;
    
    // Set new timeout
    this.syncTimeout = setTimeout(() => {
      this.performSync();
    }, delay);
  }
  
  /**
   * Sync immediately without debouncing
   */
  async syncImmediately(id: string, data: T): Promise<void> {
    // Clear any pending sync
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
    
    this.pendingSyncParams = { id, data };
    await this.performSync();
  }
  
  /**
   * Cancel any pending sync operation
   */
  cancelPendingSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
    this.pendingSyncParams = null;
  }
  
  /**
   * Get current sync state
   */
  getSyncState(): SyncState {
    return { ...this.syncState };
  }
  
  /**
   * Perform the actual sync operation
   */
  private async performSync(): Promise<void> {
    if (!this.pendingSyncParams) return;
    
    const { id, data } = this.pendingSyncParams;
    
    try {
      this.syncState.status = 'syncing';
      this.syncState.error = null;
      
      // Perform the sync operation
      await this.repository.update(id, data);
      
      // Update state on success
      this.syncState.status = 'success';
      this.syncState.lastSyncTime = new Date().toISOString();
      this.syncState.isDirty = false;
      this.pendingSyncParams = null;
    } catch (error) {
      console.error('Sync error:', error);
      
      // Update state on error
      this.syncState.status = 'error';
      this.syncState.error = error instanceof Error ? error.message : 'Sync failed';
      
      // Don't clear pending params so we can retry
    } finally {
      this.syncTimeout = null;
    }
  }
  
  /**
   * Retry the last failed sync operation
   */
  async retrySync(): Promise<void> {
    if (this.syncState.status === 'error' && this.pendingSyncParams) {
      await this.performSync();
    }
  }
}

// Export a default instance for the resume table
export const resumeSyncService = new FormSyncServiceImpl<FormData>('resumes');
