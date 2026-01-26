import { useEffect, useCallback, useRef } from 'react';
import { violationApi } from '@/lib/api';
import { getBrowserInfo, getDeviceInfo, throttle } from '@/lib/utils';

/**
 * Violation types (must match backend)
 */
export const VIOLATION_TYPES = {
  EXAM_STARTED: 'exam_started',
  EXAM_RESUMED: 'exam_resumed',
  TAB_SWITCH: 'tab_switch',
  WINDOW_BLUR: 'window_blur',
  RIGHT_CLICK: 'right_click',
  DEVELOPER_TOOLS: 'developer_tools',
  PASTE_DETECTED: 'paste_detected',
  COPY_DETECTED: 'copy_detected',
  KEYBOARD_SHORTCUT: 'keyboard_shortcut',
  VIEW_SOURCE: 'view_source',
} as const;

interface UseProctoringOptions {
  sessionId: string;
  enabled: boolean;
  onViolation: (type: string, totalViolations: number) => void;
  onTerminate: () => void;
}

/**
 * Hook to handle proctoring logic - detects all 10 violation types
 */
export function useProctoring({ sessionId, enabled, onViolation, onTerminate }: UseProctoringOptions) {
  const violationCountRef = useRef(0);
  const isLoggingRef = useRef(false);

  /**
   * Log violation to backend
   */
  const logViolation = useCallback(
    async (violationType: string, description: string, additionalData?: Record<string, any>) => {
      if (!enabled || !sessionId || isLoggingRef.current) return;

      isLoggingRef.current = true;

      try {
        const response = await violationApi.logViolation({
          sessionId,
          violationType,
          description,
          browserInfo: getBrowserInfo(),
          deviceInfo: getDeviceInfo(),
          additionalData: {
            timestamp: Date.now(),
            url: window.location.href,
            ...additionalData,
          },
        });

        const { totalViolations, shouldTerminate } = response.data.data;
        violationCountRef.current = totalViolations;

        onViolation(violationType, totalViolations);

        if (shouldTerminate) {
          onTerminate();
        }
      } catch (error) {
        console.error('Error logging violation:', error);
      } finally {
        isLoggingRef.current = false;
      }
    },
    [enabled, sessionId, onViolation, onTerminate]
  );

  /**
   * Throttled violation logging to prevent spam
   */
  const throttledLogViolation = useCallback(throttle(logViolation, 1000), [logViolation]);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    /**
     * 1. Tab/Visibility Change Detection
     */
    const handleVisibilityChange = () => {
      if (document.hidden) {
        throttledLogViolation(VIOLATION_TYPES.TAB_SWITCH, 'User switched to another tab or application');
      }
    };

    /**
     * 2. Window Blur Detection
     */
    const handleWindowBlur = () => {
      throttledLogViolation(VIOLATION_TYPES.WINDOW_BLUR, 'Window lost focus');
    };

    /**
     * 3. Right-Click Detection
     */
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      throttledLogViolation(VIOLATION_TYPES.RIGHT_CLICK, 'Right-click attempted');
    };

    /**
     * 4-8. Keyboard Shortcut Detection
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 - Developer Tools
      if (e.key === 'F12') {
        e.preventDefault();
        throttledLogViolation(
          VIOLATION_TYPES.DEVELOPER_TOOLS,
          'Attempted to open Developer Tools (F12)',
          { key: 'F12' }
        );
        return;
      }

      // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac) - Inspector
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        throttledLogViolation(
          VIOLATION_TYPES.DEVELOPER_TOOLS,
          'Attempted to open Developer Tools (Ctrl+Shift+I)',
          { key: 'Ctrl+Shift+I' }
        );
        return;
      }

      // Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac) - Console
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        throttledLogViolation(
          VIOLATION_TYPES.DEVELOPER_TOOLS,
          'Attempted to open Developer Tools Console (Ctrl+Shift+J)',
          { key: 'Ctrl+Shift+J' }
        );
        return;
      }

      // Ctrl+Shift+C (Windows/Linux) or Cmd+Option+C (Mac) - Element Inspector
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        throttledLogViolation(
          VIOLATION_TYPES.DEVELOPER_TOOLS,
          'Attempted to open Element Inspector (Ctrl+Shift+C)',
          { key: 'Ctrl+Shift+C' }
        );
        return;
      }

      // Ctrl+U (Windows/Linux) or Cmd+U (Mac) - View Source
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        throttledLogViolation(VIOLATION_TYPES.VIEW_SOURCE, 'Attempted to view page source (Ctrl+U)', { key: 'Ctrl+U' });
        return;
      }

      // Other suspicious shortcuts
      const suspiciousShortcuts = [
        { ctrl: true, shift: true, key: 'K' }, // Firefox console
        { ctrl: true, shift: true, key: 'M' }, // Firefox responsive design
      ];

      for (const shortcut of suspiciousShortcuts) {
        if ((e.ctrlKey || e.metaKey) === shortcut.ctrl && e.shiftKey === shortcut.shift && e.key === shortcut.key) {
          e.preventDefault();
          throttledLogViolation(
            VIOLATION_TYPES.KEYBOARD_SHORTCUT,
            `Suspicious keyboard shortcut detected: ${shortcut.key}`,
            { key: shortcut.key }
          );
          return;
        }
      }
    };

    /**
     * 9. Paste Detection
     */
    const handlePaste = (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData('text') || '';
      const charCount = pastedText.length;

      if (charCount > 0) {
        throttledLogViolation(
          VIOLATION_TYPES.PASTE_DETECTED,
          `Text pasted into exam (${charCount} characters)`,
          { charCount, preview: pastedText.substring(0, 50) }
        );
      }
    };

    /**
     * 10. Copy Detection
     */
    const handleCopy = (_e: ClipboardEvent) => {
      const selection = window.getSelection()?.toString() || '';
      const charCount = selection.length;

      if (charCount > 0) {
        throttledLogViolation(
          VIOLATION_TYPES.COPY_DETECTED,
          `Text copied from exam (${charCount} characters)`,
          { charCount, preview: selection.substring(0, 50) }
        );
      }
    };

    /**
     * DevTools Detection (Advanced)
     */
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        throttledLogViolation(
          VIOLATION_TYPES.DEVELOPER_TOOLS,
          'Developer Tools detected (window size anomaly)',
          {
            outerWidth: window.outerWidth,
            innerWidth: window.innerWidth,
            outerHeight: window.outerHeight,
            innerHeight: window.innerHeight,
          }
        );
      }
    };

    /**
     * Prevent page navigation
     */
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your exam progress will be saved.';
      return e.returnValue;
    };

    // Attach all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('copy', handleCopy);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // DevTools detection interval
    const devToolsInterval = setInterval(detectDevTools, 5000);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('copy', handleCopy);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(devToolsInterval);
    };
  }, [enabled, sessionId, throttledLogViolation]);

  return {
    logViolation,
    violationCount: violationCountRef.current,
  };
}
