import { useState, useEffect } from 'react'

// Warn when system clock is off by more than 2 seconds
const DRIFT_THRESHOLD_MS = 2_000

export interface ClockSyncResult {
  /** Milliseconds to add to Date.now() to get true server time (0 if sync failed) */
  offset: number
  /** True if the fetch succeeded and we have a measured offset */
  synced: boolean
  /** True when |offset| > DRIFT_THRESHOLD_MS — show warning to user */
  drifted: boolean
}

/**
 * Fetches the HTTP Date header from the app's own origin to measure clock drift.
 * Uses the NTP midpoint technique to account for network round-trip time:
 *   offset = serverTime + rtt/2 - t2
 * where t2 is local time when response arrived, and rtt = t2 - t1.
 * Date header has 1-second granularity, so accuracy is ~±500ms + rtt/2.
 */
export function useClockSync(): ClockSyncResult {
  const [result, setResult] = useState<ClockSyncResult>({
    offset: 0,
    synced: false,
    drifted: false,
  })

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
        if (!dateHeader) return // server didn't send Date header

        const serverTime = new Date(dateHeader).getTime()
        if (isNaN(serverTime)) return

        // Estimate server time at moment t2 arrived, corrected for response travel time
        const rtt = t2 - t1
        const offset = Math.round(serverTime + rtt / 2 - t2)
        const drifted = Math.abs(offset) > DRIFT_THRESHOLD_MS

        if (!cancelled) setResult({ offset, synced: true, drifted })
      } catch {
        // Network offline or fetch blocked — silently keep offset: 0
      }
    }

    sync()
    return () => { cancelled = true }
  }, [])

  return result
}
