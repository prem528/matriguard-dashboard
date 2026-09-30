/**
 * Failed-login throttle, per client IP.
 *
 * In memory, so it resets on restart and is per process. That is enough
 * for one admin behind one PM2 process; it only has to make password
 * guessing slow, not impossible.
 */

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, { count: number; firstAt: number }>();

/** Minutes left on the lockout, or 0 when the IP may try again. */
export function lockedForMinutes(ip: string) {
  const entry = failures.get(ip);
  if (!entry) return 0;

  const elapsed = Date.now() - entry.firstAt;
  if (elapsed > WINDOW_MS) {
    failures.delete(ip);
    return 0;
  }
  return entry.count >= MAX_FAILURES ? Math.ceil((WINDOW_MS - elapsed) / 60_000) : 0;
}

export function recordFailure(ip: string) {
  const entry = failures.get(ip);
  if (!entry || Date.now() - entry.firstAt > WINDOW_MS) {
    failures.set(ip, { count: 1, firstAt: Date.now() });
  } else {
    entry.count += 1;
  }
}

export function clearFailures(ip: string) {
  failures.delete(ip);
}
