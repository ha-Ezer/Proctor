import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  initialSeconds: number;
  onExpire: () => void;
  enabled: boolean;
}

/**
 * Hook to handle exam countdown timer
 */
export function useTimer({ initialSeconds, onExpire, enabled }: UseTimerOptions) {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(enabled);
  const intervalRef = useRef<number | null>(null);
  const expiredRef = useRef(false);

  /**
   * Update isRunning when enabled changes
   */
  useEffect(() => {
    setIsRunning(enabled);
  }, [enabled]);

  /**
   * Start timer
   */
  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  /**
   * Pause timer
   */
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  /**
   * Reset timer
   */
  const reset = useCallback((seconds?: number) => {
    setTimeRemaining(seconds ?? initialSeconds);
    expiredRef.current = false;
  }, [initialSeconds]);

  /**
   * Set time remaining
   */
  const setTime = useCallback((seconds: number) => {
    setTimeRemaining(seconds);
  }, []);

  /**
   * Timer countdown effect
   */
  useEffect(() => {
    console.log('[useTimer] Timer effect triggered:', { isRunning, enabled, timeRemaining });

    if (!isRunning || !enabled) {
      if (intervalRef.current) {
        console.log('[useTimer] Clearing interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('[useTimer] Starting countdown timer');
    intervalRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;

        if (next <= 0) {
          if (!expiredRef.current) {
            expiredRef.current = true;
            console.log('[useTimer] ⏰ Timer expired! Calling onExpire');
            onExpire();
          }
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        console.log('[useTimer] Cleanup: clearing interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, enabled, onExpire]);

  /**
   * Calculate time formatting
   */
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;

  const formattedTime = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  /**
   * Calculate percentage remaining
   */
  const percentageRemaining = initialSeconds > 0 ? (timeRemaining / initialSeconds) * 100 : 0;

  /**
   * Check if time is critical (less than 5 minutes)
   */
  const isCritical = timeRemaining <= 300 && timeRemaining > 60;

  /**
   * Check if time is expired or about to expire (less than 1 minute)
   */
  const isDanger = timeRemaining <= 60;

  return {
    timeRemaining,
    formattedTime,
    percentageRemaining,
    isRunning,
    isCritical,
    isDanger,
    isExpired: timeRemaining <= 0,
    hours,
    minutes,
    seconds,
    start,
    pause,
    reset,
    setTime,
  };
}
