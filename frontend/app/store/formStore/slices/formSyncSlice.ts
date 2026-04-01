import type { StateCreator } from 'zustand';
import type { SyncState } from '@/lib/types/formData';

export interface FormSyncState {
  syncState: SyncState;
  isSyncing: boolean;
  
  // Actions
  setSyncState: (state: SyncState) => void;
  setSyncing: (syncing: boolean) => void;
  markSyncStart: () => void;
  markSyncSuccess: () => void;
  markSyncError: (error: string) => void;
  resetSyncState: () => void;
}

export const formSyncSlice: StateCreator<FormSyncState> = (set, get) => ({
  syncState: {
    status: 'idle',
    lastSyncTime: null,
    error: null,
    isDirty: false
  },
  isSyncing: false,
  
  setSyncState: (state) => set({ syncState: state }),
  
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  
  markSyncStart: () => set({
    isSyncing: true,
    syncState: {
      ...get().syncState,
      status: 'syncing',
      error: null
    }
  }),
  
  markSyncSuccess: () => set({
    isSyncing: false,
    syncState: {
      ...get().syncState,
      status: 'success',
      lastSyncTime: new Date().toISOString(),
      isDirty: false
    }
  }),
  
  markSyncError: (error) => set({
    isSyncing: false,
    syncState: {
      ...get().syncState,
      status: 'error',
      error
    }
  }),
  
  resetSyncState: () => set({
    syncState: {
      status: 'idle',
      lastSyncTime: null,
      error: null,
      isDirty: false
    },
    isSyncing: false
  })
});
