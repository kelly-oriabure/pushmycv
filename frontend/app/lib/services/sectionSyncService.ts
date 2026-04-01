import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ResumeData } from '@/lib/types';
import { ResumeSectionRepository } from '@/lib/repositories/resumeSectionRepository';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { stableStringify } from '@/lib/utils/stableStringify';

export interface SectionSyncState {
  section: keyof ResumeData | null;
  isSyncing: boolean;
  lastSyncTime: number | null;
  error: string | null;
  hasPendingChanges: boolean;
}

export interface SectionSyncConfig {
  debounceMs: number;
  maxRetries: number;
  retryDelayMs: number;
  showToasts: boolean;
}

const DEFAULT_CONFIG: SectionSyncConfig = {
  debounceMs: 2000, // 2 seconds for individual sections
  maxRetries: 3,
  retryDelayMs: 1000,
  showToasts: true,
};

/**
 * Service for syncing individual resume sections to normalized tables
 * Prevents race conditions by tracking sync state per section
 */
export class SectionSyncService {
  private sectionRepository: ResumeSectionRepository;
  private syncTimeouts: Map<keyof ResumeData, ReturnType<typeof setTimeout>> = new Map();
  private syncLocks: Set<keyof ResumeData> = new Set(); // Track sections currently syncing
  private pendingSyncs: Map<keyof ResumeData, ResumeData[keyof ResumeData]> = new Map();
  private pendingSyncStrings: Map<keyof ResumeData, string> = new Map();
  private lastSyncedData: Map<keyof ResumeData, string> = new Map();
  private config: SectionSyncConfig;
  private stateChangeCallbacks: Map<keyof ResumeData, Set<(state: SectionSyncState) => void>> = new Map();
  private sectionStates: Map<keyof ResumeData, SectionSyncState> = new Map();

  constructor(config: Partial<SectionSyncConfig> = {}) {
    this.sectionRepository = new ResumeSectionRepository(getSupabaseClient());
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize states for all sections
    const sections: (keyof ResumeData)[] = [
      'personalDetails',
      'professionalSummary',
      'education',
      'employmentHistory',
      'skills',
      'languages',
      'references',
      'courses',
      'internships',
    ];

    sections.forEach((section) => {
      this.sectionStates.set(section, {
        section,
        isSyncing: false,
        lastSyncTime: null,
        error: null,
        hasPendingChanges: false,
      });
    });
  }

  /**
   * Schedule a sync for a specific section with debouncing
   */
  scheduleSectionSync(
    resumeId: string,
    section: keyof ResumeData,
    data: ResumeData[keyof ResumeData]
  ): void {
    if (!resumeId || resumeId === 'temp-resume-id') {
      return;
    }

    const dataString = stableStringify(data);
    const lastSynced = this.lastSyncedData.get(section);

    // Skip if data hasn't changed
    if (dataString === lastSynced) {
      return;
    }

    const pendingString = this.pendingSyncStrings.get(section);
    if (dataString === pendingString) {
      return;
    }

    // Store pending sync
    this.pendingSyncs.set(section, data);
    this.pendingSyncStrings.set(section, dataString);

    // Update state
    this.updateSectionState(section, { hasPendingChanges: true });

    // Clear existing timeout for this section
    const existingTimeout = this.syncTimeouts.get(section);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule new sync
    const timeout = setTimeout(() => {
      this.performSectionSync(resumeId, section);
    }, this.config.debounceMs);

    this.syncTimeouts.set(section, timeout);
  }

  /**
   * Perform the actual sync for a section
   */
  private async performSectionSync(resumeId: string, section: keyof ResumeData): Promise<void> {
    // Check if section is already syncing (prevent race condition)
    if (this.syncLocks.has(section)) {
      console.warn(`Section ${section} is already syncing, skipping...`);
      return;
    }

    const pendingData = this.pendingSyncs.get(section);
    if (!pendingData) {
      return; // No pending data
    }

    // Acquire lock
    this.syncLocks.add(section);
    this.updateSectionState(section, {
      isSyncing: true,
      error: null,
      hasPendingChanges: false,
    });

    try {
      // Perform sync
      await this.sectionRepository.syncSection(resumeId, section, pendingData);

      // Success - update state
      const dataString = this.pendingSyncStrings.get(section) ?? stableStringify(pendingData);
      this.lastSyncedData.set(section, dataString);
      this.pendingSyncs.delete(section);
      this.pendingSyncStrings.delete(section);

      const timeout = this.syncTimeouts.get(section);
      if (timeout) {
        clearTimeout(timeout);
        this.syncTimeouts.delete(section);
      }

      this.updateSectionState(section, {
        isSyncing: false,
        lastSyncTime: Date.now(),
        error: null,
        hasPendingChanges: false,
      });

    } catch (error) {
      console.error(`Sync error for section ${section}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      
      this.updateSectionState(section, {
        isSyncing: false,
        error: errorMessage,
        hasPendingChanges: true, // Keep pending since sync failed
      });

      // Retry logic could be added here if needed
    } finally {
      // Release lock
      this.syncLocks.delete(section);
    }
  }

  /**
   * Force immediate sync for a section
   */
  async forceSyncSection(resumeId: string, section: keyof ResumeData): Promise<boolean> {
    const timeout = this.syncTimeouts.get(section);
    if (timeout) {
      clearTimeout(timeout);
      this.syncTimeouts.delete(section);
    }

    try {
      await this.performSectionSync(resumeId, section);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get sync state for a section
   */
  getSectionState(section: keyof ResumeData): SectionSyncState {
    return this.sectionStates.get(section) || {
      section,
      isSyncing: false,
      lastSyncTime: null,
      error: null,
      hasPendingChanges: false,
    };
  }

  /**
   * Subscribe to state changes for a section
   */
  onSectionStateChange(
    section: keyof ResumeData,
    callback: (state: SectionSyncState) => void
  ): () => void {
    if (!this.stateChangeCallbacks.has(section)) {
      this.stateChangeCallbacks.set(section, new Set());
    }
    this.stateChangeCallbacks.get(section)!.add(callback);

    return () => {
      this.stateChangeCallbacks.get(section)?.delete(callback);
    };
  }

  /**
   * Update internal state and notify callbacks
   */
  private updateSectionState(section: keyof ResumeData, updates: Partial<SectionSyncState>): void {
    const currentState = this.sectionStates.get(section) || {
      section,
      isSyncing: false,
      lastSyncTime: null,
      error: null,
      hasPendingChanges: false,
    };

    const newState = { ...currentState, ...updates };
    this.sectionStates.set(section, newState);

    // Notify callbacks
    const callbacks = this.stateChangeCallbacks.get(section);
    if (callbacks) {
      callbacks.forEach((callback) => callback(newState));
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.syncTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.syncTimeouts.clear();
    this.syncLocks.clear();
    this.pendingSyncs.clear();
    this.pendingSyncStrings.clear();
    this.stateChangeCallbacks.clear();
  }
}

/**
 * React hook for syncing individual resume sections
 */
export function useSectionSync(
  resumeId: string,
  section: keyof ResumeData,
  sectionData: ResumeData[keyof ResumeData],
  config: Partial<SectionSyncConfig> = {}
) {
  const { toast } = useToast();
  const syncServiceRef = useRef<SectionSyncService | null>(null);
  const lastToastTimeRef = useRef<number>(0);
  const [syncState, setSyncState] = useState<SectionSyncState>({
    section,
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    hasPendingChanges: false,
  });

  // Initialize sync service
  useEffect(() => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    syncServiceRef.current = new SectionSyncService(finalConfig);

    // Subscribe to state changes
    const unsubscribe = syncServiceRef.current.onSectionStateChange(section, (state) => {
      setSyncState(state);

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
  }, [section, config.debounceMs, config.showToasts, toast]);

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

  return {
    syncState,
    forceSave,
  };
}

