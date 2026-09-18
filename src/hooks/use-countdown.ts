import { useCallback, useEffect, useState } from 'react';

/**
 * Whole-seconds countdown used to gate actions that must not be hammered
 * (OTP verify, OTP resend).
 *
 * `start(seconds)` seeds the visible value and the deadline together, so the
 * effect below only ever writes state from the interval callback — never
 * synchronously during the effect body.
 */
export function useCountdown() {
  const [deadline, setDeadline] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!deadline) return;

    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) setDeadline(0);
    }, 250);

    return () => clearInterval(id);
  }, [deadline]);

  const start = useCallback((seconds: number) => {
    setSecondsLeft(seconds);
    setDeadline(Date.now() + seconds * 1000);
  }, []);

  const reset = useCallback(() => {
    setSecondsLeft(0);
    setDeadline(0);
  }, []);

  return { secondsLeft, isActive: secondsLeft > 0, start, reset };
}
