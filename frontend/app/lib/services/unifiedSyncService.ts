import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ResumeData } from '@/lib/types';
import { ResumeOrchestrator } from './resumeOrchestrator';
import { FormDataRepositoryImpl } from '@/lib/repositories/formDataRepository';
import { getSupabaseClient } from '@/integrations/supabase/client';
import type { FormData, ValidTableNames } from '@/lib/types/formData';
import { SectionSyncService, type SectionSyncState } from './sectionSyncService';
import { stableStringify } from '@/lib/utils/stableStringify';

export interface SyncState {
  isSyncing: boolean;
  lastSyncTime: number | null;
  error: string | null;
  hasPendingChanges: boolean;
  consecutiveErrors: number;
}

export interface SyncConfig {
  debounceMs: number;
  maxRetries: number;
  retryDelayMs: number;
  enableOptimisticUpdates: boolean;
  showToasts: boolean;
}

const DEFAULT_CONFIG: SyncConfig = {
  debounceMs: 3000, // Changed to 3 seconds
  maxRetries: 3,
  retryDelayMs: 2000,
  enableOptimisticUpdates: true,
  showToasts: true,
};

/**
 * Unified sync service that replaces all other sync implementations
 * Handles debouncing, error recovery, optimistic updates, and user feedback
 * Supports both resume data and generic form data
 */
export class UnifiedSyncService {
  private resumeOrchestrator: ResumeOrchestrator;
  private formRepository: FormDataRepositoryImpl<FormData> | null = null;
  private syncTimeout: ReturnType<typeof setTimeout> | null = null;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingSyncData: {
    resumeId?: string;
    data: ResumeData | FormData;
    tableName?: ValidTableNames;
    recordId?: string;
  } | null = null;
  private pendingSyncDataString: string | null = null;
  private lastSyncedData: string = '';
  private config: SyncConfig;
  private state: SyncState = {
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    hasPendingChanges: false,
    consecutiveErrors: 0,
  };
  private stateChangeCallbacks: Set<(state: SyncState) => void> = new Set();

  constructor(config: Partial<SyncConfig> = {}, tableName?: ValidTableNames) {
    this.resumeOrchestrator = new ResumeOrchestrator(getSupabaseClient());
    if (tableName) {
      this.formRepository = new FormDataRepositoryImpl<FormData>(tableName);
    }
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Schedule a sync operation with debouncing
   * Supports both resume data and generic form data
   */
  scheduleSync(
    id: string,
    data: ResumeData | FormData,
    options?: { tableName?: ValidTableNames; recordId?: string }
  ): void {
    // Skip temporary IDs
    if (id === 'temp-resume-id' || !id) {
      return;
    }

    const dataString = stableStringify(data);

    // Skip if data hasn't changed
    if (dataString === this.lastSyncedData) {
      return;
    }

    const pendingMatches =
      this.pendingSyncData &&
      this.pendingSyncData.resumeId === id &&
      this.pendingSyncData.tableName === options?.tableName &&
      (this.pendingSyncData.recordId || id) === (options?.recordId || id) &&
      this.pendingSyncDataString === dataString;

    if (pendingMatches) {
      return;
    }

    // Clear existing timeout
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    // Store pending sync data
    this.pendingSyncData = {
      resumeId: id,
      data,
      tableName: options?.tableName,
      recordId: options?.recordId || id
    };
    this.pendingSyncDataString = dataString;

    // Update state
    this.updateState({ hasPendingChanges: true });

    // Schedule sync
    this.syncTimeout = setTimeout(() => {
      this.performSync();
    }, this.config.debounceMs);
  }

  /**
   * Legacy method for resume data - maintained for backward compatibility
   */
  scheduleResumeSync(resumeId: string, data: ResumeData): void {
    this.scheduleSync(resumeId, data);
  }

  /**
   * Force immediate sync without debouncing
   */
  async forceSave(): Promise<boolean> {
    if (!this.pendingSyncData) {
      return true;
    }

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    return await this.performSync();
  }

  /**
   * Cancel any pending sync operations
   */
  cancelPendingSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.pendingSyncData = null;
    this.pendingSyncDataString = null;
    this.updateState({ hasPendingChanges: false });
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: SyncState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cancelPendingSync();
    this.stateChangeCallbacks.clear();
  }

  /**
   * Perform the actual sync operation
   * Handles both resume data and generic form data
   * Now also syncs to normalized tables section-by-section
   */
  private async performSync(): Promise<boolean> {
    if (!this.pendingSyncData) {
      return true;
    }

    const { resumeId, data, tableName, recordId } = this.pendingSyncData;
    const dataString = this.pendingSyncDataString ?? stableStringify(data);

    try {
      // Update state to syncing
      this.updateState({
        isSyncing: true,
        error: null,
        hasPendingChanges: false,
      });

      // Perform the sync based on data type
      if (tableName && this.formRepository && recordId) {
        // Generic form data sync
        await this.formRepository.update(recordId, data as FormData);
      } else if (resumeId) {
        // Resume data sync - sync to JSONB first, then to normalized tables
        const resumeData = data as ResumeData;
        await this.resumeOrchestrator.saveResume(resumeId, resumeData);
      } else {
        throw new Error('Invalid sync configuration: missing resumeId or tableName');
      }

      // Success - update state
      this.lastSyncedData = dataString;
      this.pendingSyncData = null;
      this.pendingSyncDataString = null;
      this.syncTimeout = null;

      this.updateState({
        isSyncing: false,
        lastSyncTime: Date.now(),
        error: null,
        consecutiveErrors: 0,
      });

      return true;

    } catch (error) {
      console.error('Sync error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      const newConsecutiveErrors = this.state.consecutiveErrors + 1;

      this.updateState({
        isSyncing: false,
        error: errorMessage,
        consecutiveErrors: newConsecutiveErrors,
        hasPendingChanges: true, // Keep pending since sync failed
      });

      // Retry logic
      if (newConsecutiveErrors <= this.config.maxRetries) {
        this.scheduleRetry();
      }

      return false;
    }
  }

  /**
   * Schedule a retry attempt
   */
  private scheduleRetry(): void {
    const delay = this.config.retryDelayMs * Math.pow(2, this.state.consecutiveErrors - 1); // Exponential backoff

    this.retryTimeout = setTimeout(() => {
      this.performSync();
    }, delay);
  }

  /**
   * Update internal state and notify callbacks
   */
  private updateState(updates: Partial<SyncState>): void {
    this.state = { ...this.state, ...updates };
    this.stateChangeCallbacks.forEach(callback => callback(this.state));
  }
}

/**
 * React hook for syncing individual resume sections to normalized tables
 * Prevents race conditions by tracking sync state per section
 */
export function useSectionSync(
  resumeId: string,
  section: keyof ResumeData,
  sectionData: ResumeData[keyof ResumeData],
  config: Partial<SyncConfig> = {}
) {
  const { toast } = useToast();
  const syncServiceRef = useRef<SectionSyncService | null>(null);
  const lastToastTimeRef = useRef<number>(0);
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    hasPendingChanges: false,
    consecutiveErrors: 0,
  });

  // Initialize sync service
  useEffect(() => {
    const finalConfig = {
      debounceMs: config.debounceMs || 2000,
      maxRetries: config.maxRetries || 3,
      retryDelayMs: config.retryDelayMs || 1000,
      showToasts: config.showToasts !== false,
    };
    syncServiceRef.current = new SectionSyncService(finalConfig);

    // Subscribe to state changes
    const unsubscribe = syncServiceRef.current.onSectionStateChange(section, (state: SectionSyncState) => {
      setSyncState({
        isSyncing: state.isSyncing,
        lastSyncTime: state.lastSyncTime,
        error: state.error,
        hasPendingChanges: state.hasPendingChanges,
        consecutiveErrors: state.error ? 1 : 0,
      });

      // Show toasts for sync events with deduplication
      if (finalConfig.showToasts) {
        if (state.lastSyncTime && !state.error) {
          const now = Date.now();
          if (now - lastToastTimeRef.current > 5000) {
            lastToastTimeRef.current = now;
            toast({
              title: "Changes saved",
              description: `${section} has been automatically saved.`,
              duration: 2000,
            });
          }
        } else if (state.error) {
          toast({
            title: "Save failed",
            description: `Unable to save ${section}: ${state.error}`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    });

    return () => {
      unsubscribe();
      syncServiceRef.current?.destroy();
    };
  }, [section, config.debounceMs, config.maxRetries, config.retryDelayMs, config.showToasts, toast]);

  // Schedule sync when section data changes
  useEffect(() => {
    if (syncServiceRef.current && resumeId) {
      syncServiceRef.current.scheduleSectionSync(resumeId, section, sectionData);
    }
  }, [resumeId, section, sectionData]);

  const forceSave = useCallback(async () => {
    if (syncServiceRef.current && resumeId) {
      return await syncServiceRef.current.forceSyncSection(resumeId, section);
    }
    return false;
  }, [resumeId, section]);

  const retryLastFailed = useCallback(() => {
    if (syncServiceRef.current && syncState.error) {
      syncServiceRef.current.forceSyncSection(resumeId, section);
    }
  }, [resumeId, section, syncState.error]);

  return {
    syncState,
    forceSave,
    retryLastFailed,
  };
}

/**
 * React hook for using the unified sync service with resume data
 */
export function useUnifiedSync(
  resumeId: string,
  resumeData: ResumeData,
  config: Partial<SyncConfig> = {}
) {
  const { toast } = useToast();
  const syncServiceRef = useRef<UnifiedSyncService | null>(null);
  const lastToastTimeRef = useRef<number>(0);
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    hasPendingChanges: false,
    consecutiveErrors: 0,
  });

  // Initialize sync service
  useEffect(() => {
    const finalConfig = {
      ...config,
      showToasts: config.showToasts !== false // Default to true
    };
    syncServiceRef.current = new UnifiedSyncService(finalConfig);

    // Subscribe to state changes
    const unsubscribe = syncServiceRef.current.onStateChange((state) => {
      setSyncState(state);

      // Show toasts for sync events with deduplication
      if (finalConfig.showToasts) {
        if (state.lastSyncTime && !state.error) {
          // Prevent duplicate success toasts within 5 seconds
          const now = Date.now();
          if (now - lastToastTimeRef.current > 5000) {
            lastToastTimeRef.current = now;
            toast({
              title: "Changes saved",
              description: "Your resume has been automatically saved.",
              duration: 2000,
            });
          }
        } else if (state.error && state.consecutiveErrors > (finalConfig.maxRetries || DEFAULT_CONFIG.maxRetries)) {
          toast({
            title: "Save failed",
            description: `Unable to save changes: ${state.error}`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    });

    return () => {
      unsubscribe();
      syncServiceRef.current?.destroy();
    };
  }, [config.debounceMs, config.maxRetries, config.showToasts, toast]);

  // Schedule sync when data changes
  useEffect(() => {
    if (syncServiceRef.current) {
      syncServiceRef.current.scheduleResumeSync(resumeId, resumeData);
    }
  }, [resumeId, resumeData]);

  const forceSave = useCallback(async () => {
    return await syncServiceRef.current?.forceSave() ?? false;
  }, []);

  const cancelPendingSync = useCallback(() => {
    syncServiceRef.current?.cancelPendingSync();
  }, []);

  const retryLastFailed = useCallback(() => {
    if (syncServiceRef.current && syncState.error) {
      syncServiceRef.current.forceSave();
    }
  }, [syncState.error]);

  return {
    syncState,
    forceSave,
    cancelPendingSync,
    retryLastFailed,
  };
}

/**
 * React hook for using the unified sync service with generic form data
 */
export function useFormSync<T extends FormData = FormData>(
  recordId: string,
  formData: T,
  tableName: ValidTableNames,
  config: Partial<SyncConfig> = {}
) {
  const { toast } = useToast();
  const syncServiceRef = useRef<UnifiedSyncService | null>(null);
  const lastToastTimeRef = useRef<number>(0);
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    hasPendingChanges: false,
    consecutiveErrors: 0,
  });

  // Initialize sync service
  useEffect(() => {
    const finalConfig = {
      ...config,
      showToasts: config.showToasts !== false // Default to true
    };
    syncServiceRef.current = new UnifiedSyncService(finalConfig, tableName);

    // Subscribe to state changes
    const unsubscribe = syncServiceRef.current.onStateChange((state) => {
      setSyncState(state);

      // Show toasts for sync events with deduplication
      if (finalConfig.showToasts) {
        if (state.lastSyncTime && !state.error) {
          // Prevent duplicate success toasts within 5 seconds
          const now = Date.now();
          if (now - lastToastTimeRef.current > 5000) {
            lastToastTimeRef.current = now;
            toast({
              title: "Changes saved",
              description: "Your form has been automatically saved.",
              duration: 2000,
            });
          }
        } else if (state.error && state.consecutiveErrors > (finalConfig.maxRetries || DEFAULT_CONFIG.maxRetries)) {
          toast({
            title: "Save failed",
            description: `Unable to save changes: ${state.error}`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    });

    return () => {
      unsubscribe();
      syncServiceRef.current?.destroy();
    };
  }, [config.debounceMs, config.maxRetries, config.showToasts, toast, tableName]);

  // Schedule sync when data changes
  useEffect(() => {
    if (syncServiceRef.current) {
      syncServiceRef.current.scheduleSync(recordId, formData, {
        tableName,
        recordId
      });
    }
  }, [recordId, formData, tableName]);

  const forceSave = useCallback(async () => {
    return await syncServiceRef.current?.forceSave() ?? false;
  }, []);

  const cancelPendingSync = useCallback(() => {
    syncServiceRef.current?.cancelPendingSync();
  }, []);

  const retryLastFailed = useCallback(() => {
    if (syncServiceRef.current && syncState.error) {
      syncServiceRef.current.forceSave();
    }
  }, [syncState.error]);

  return {
    syncState,
    forceSave,
    cancelPendingSync,
    retryLastFailed,
  };
}

/**
 * Generic React hook for using the unified sync service
 * Automatically detects data type and uses appropriate sync method
 */
export function useGenericSync<T extends ResumeData | FormData>(
  id: string,
  data: T,
  options?: { tableName?: ValidTableNames; recordId?: string },
  config: Partial<SyncConfig> = {}
) {
  const { toast } = useToast();
  const syncServiceRef = useRef<UnifiedSyncService | null>(null);
  const lastToastTimeRef = useRef<number>(0);
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    hasPendingChanges: false,
    consecutiveErrors: 0,
  });

  // Initialize sync service
  useEffect(() => {
    const finalConfig = {
      ...config,
      showToasts: config.showToasts !== false // Default to true
    };
    syncServiceRef.current = new UnifiedSyncService(finalConfig, options?.tableName);

    // Subscribe to state changes
    const unsubscribe = syncServiceRef.current.onStateChange((state) => {
      setSyncState(state);

      // Show toasts for sync events with deduplication
      if (finalConfig.showToasts) {
        if (state.lastSyncTime && !state.error) {
          // Prevent duplicate success toasts within 5 seconds
          const now = Date.now();
          if (now - lastToastTimeRef.current > 5000) {
            lastToastTimeRef.current = now;
            toast({
              title: "Changes saved",
              description: "Your data has been automatically saved.",
              duration: 2000,
            });
          }
        } else if (state.error && state.consecutiveErrors > (finalConfig.maxRetries || DEFAULT_CONFIG.maxRetries)) {
          toast({
            title: "Save failed",
            description: `Unable to save changes: ${state.error}`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    });

    return () => {
      unsubscribe();
      syncServiceRef.current?.destroy();
    };
  }, [config.debounceMs, config.maxRetries, config.showToasts, toast, options?.tableName]);

  // Schedule sync when data changes
  useEffect(() => {
    if (syncServiceRef.current) {
      syncServiceRef.current.scheduleSync(id, data, options);
    }
  }, [id, data, options]);

  const forceSave = useCallback(async () => {
    return await syncServiceRef.current?.forceSave() ?? false;
  }, []);

  const cancelPendingSync = useCallback(() => {
    syncServiceRef.current?.cancelPendingSync();
  }, []);

  const retryLastFailed = useCallback(() => {
    if (syncServiceRef.current && syncState.error) {
      syncServiceRef.current.forceSave();
    }
  }, [syncState.error]);

  return {
    syncState,
    forceSave,
    cancelPendingSync,
    retryLastFailed,
  };
}
