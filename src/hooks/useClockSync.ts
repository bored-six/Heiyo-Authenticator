import { useState, useEffect } from 'react'

// Warn when system clock is off by more than 2 seconds
const DRIFT_THRESHOLD_MS = 2_000
const STORAGE_KEY = 'heiyo-clock-offset'

export interface ClockSyncResult {
  /** Milliseconds to add to Date.now() to get true server time (0 if sync failed) */
  offset: number
  /** True while the fetch is in-flight */
  syncing: boolean
  /** True if the fetch succeeded and we have a measured offset */
  synced: boolean
  /** True when |offset| > DRIFT_THRESHOLD_MS — show warning to user */
  drifted: boolean
}

function loadSavedOffset(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved !== null ? Number(saved) : 0
  } catch {
    return 0
  }
}

function persistOffset(offset: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(offset))
  } catch {
    // localStorage unavailable — not a fatal error
  }
}

/**
 * Fetches the HTTP Date header from the app's own origin to measure clock drift.
 * Uses the NTP midpoint technique to account for network round-trip time:
 *   offset = serverTime + rtt/2 - t2
 * where t2 is local time when response arrived, and rtt = t2 - t1.
 * Date header has 1-second granularity, so accuracy is ~±500ms + rtt/2.
 *
 * Offline resilience: on successful sync the offset is saved to localStorage.
 * If the device is offline on next launch the saved offset is used as the
 * initial value so TOTP codes remain accurate without a network connection.
 */
export function useClockSync(): ClockSyncResult {
  const [result, setResult] = useState<ClockSyncResult>(() => ({
    // Seed from localStorage so codes are immediately accurate when offline
    offset: loadSavedOffset(),
    syncing: true,
    synced: false,
    drifted: false,
  }))

  useEffect(() => {
    let cancelled = false

    async function sync() {
      try {
        const t1 = Date.now()
        const res = await fetch(window.location.origin, {
          method: 'HEAD',
          cache: 'no-store',
        })
        const t2 = Date.now()

        const dateHeader = res.headers.get('Date')
        if (!dateHeader) {
          if (!cancelled) setResult(prev => ({ ...prev, syncing: false }))
          return
        }

        const serverTime = new Date(dateHeader).getTime()
        if (isNaN(serverTime)) {
          if (!cancelled) setResult(prev => ({ ...prev, syncing: false }))
          return
        }

        // Estimate server time at moment t2 arrived, corrected for response travel time
        const rtt = t2 - t1
        const offset = Math.round(serverTime + rtt / 2 - t2)
        const drifted = Math.abs(offset) > DRIFT_THRESHOLD_MS

        // Persist so the next offline session starts with the last known offset
        persistOffset(offset)

        if (!cancelled) setResult({ offset, syncing: false, synced: true, drifted })
      } catch {
        // Network offline — fall back to the saved offset already in state
        if (!cancelled) setResult(prev => ({ ...prev, syncing: false }))
      }
    }

    sync()
    return () => { cancelled = true }
  }, [])

  return result
}
