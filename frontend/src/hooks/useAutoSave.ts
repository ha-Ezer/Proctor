import { useEffect, useRef, useCallback } from 'react';
import { sessionApi, SessionSnapshot } from '@/lib/api';
import { sessionStorage, STORAGE_KEYS } from '@/lib/storage';
import { debounce } from '@/lib/utils';

const AUTOSAVE_INTERVAL = parseInt(import.meta.env.VITE_AUTOSAVE_INTERVAL_MS || '5000');

interface UseAutoSaveOptions {
  sessionId: string;
  enabled: boolean;
  getSnapshotData: () => SessionSnapshot;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

/**
 * Hook to handle auto-save functionality
 * Saves progress every 5 seconds (configurable)
 */
export function useAutoSave({ sessionId, enabled, getSnapshotData, onSaveSuccess, onSaveError }: UseAutoSaveOptions) {
  const lastSaveRef = useRef<string>('');
  const isSavingRef = useRef(false);
  const saveIntervalRef = useRef<number | null>(null);

  /**
   * Save snapshot to backend
   */
  const saveSnapshot = useCallback(async () => {
    if (!enabled || !sessionId || isSavingRef.current) return;

    try {
      isSavingRef.current = true;

      const snapshotData = getSnapshotData();

      // Check if data has changed since last save
      const currentDataString = JSON.stringify(snapshotData);
      if (currentDataString === lastSaveRef.current) {
        isSavingRef.current = false;
        return;
      }

      // Save to backend
      await sessionApi.saveSnapshot(sessionId, snapshotData);

      // Save to sessionStorage as backup
      sessionStorage.set(STORAGE_KEYS.RESPONSES, snapshotData.responses);
      sessionStorage.set(STORAGE_KEYS.CURRENT_QUESTION, snapshotData.currentQuestionIndex);
      sessionStorage.set(STORAGE_KEYS.VIOLATIONS, snapshotData.violations);

      lastSaveRef.current = currentDataString;

      onSaveSuccess?.();
    } catch (error) {
      console.error('Auto-save error:', error);
      onSaveError?.(error as Error);
    } finally {
      isSavingRef.current = false;
    }
  }, [enabled, sessionId, getSnapshotData, onSaveSuccess, onSaveError]);

  /**
   * Debounced save function (triggered on user input)
   */
  const debouncedSave = useCallback(debounce(saveSnapshot, 2000), [saveSnapshot]);

  /**
   * Force save immediately (e.g., before page unload)
   */
  const forceSave = useCallback(async () => {
    if (!enabled || !sessionId) return;

    const snapshotData = getSnapshotData();

    // Save to sessionStorage immediately
    sessionStorage.set(STORAGE_KEYS.RESPONSES, snapshotData.responses);
    sessionStorage.set(STORAGE_KEYS.CURRENT_QUESTION, snapshotData.currentQuestionIndex);
    sessionStorage.set(STORAGE_KEYS.VIOLATIONS, snapshotData.violations);

    // Try to save to backend (may not complete if page is unloading)
    try {
      await sessionApi.saveSnapshot(sessionId, snapshotData);
    } catch (error) {
      console.error('Force save error:', error);
    }
  }, [enabled, sessionId, getSnapshotData]);

  /**
   * Set up auto-save interval
   */
  useEffect(() => {
    if (!enabled || !sessionId) return;

    // Start auto-save interval
    saveIntervalRef.current = setInterval(() => {
      saveSnapshot();
    }, AUTOSAVE_INTERVAL);

    // Save on page unload
    const handleBeforeUnload = () => {
      forceSave();
    };

    // Save on visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        forceSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, sessionId, saveSnapshot, forceSave]);

  return {
    saveSnapshot,
    debouncedSave,
    forceSave,
    isSaving: isSavingRef.current,
  };
}
