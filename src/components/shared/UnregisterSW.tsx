"use client"
import { useEffect } from 'react'

export default function UnregisterSW() {
  useEffect(() => {
    // Unregister any existing service workers
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations?.().then((regs) => {
        regs.forEach((r) => {
          r.unregister().catch(() => {})
        })
      }).catch(() => {})
    }

    // Clear caches potentially left by a previous SW
    if (typeof caches !== 'undefined' && caches?.keys) {
      caches.keys().then((keys) => {
        keys.forEach((k) => {
          caches.delete(k).catch(() => {})
        })
      }).catch(() => {})
    }
  }, [])

  return null
}

