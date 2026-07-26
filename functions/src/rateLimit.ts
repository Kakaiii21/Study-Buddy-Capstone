import * as admin from 'firebase-admin'

type LockResult = { allowed: boolean; retryAfter?: number }

/**
 * Atomically acquires a lock for `key`. Prevents double-submission while a
 * request is in flight, and enforces a cooldown only after a SUCCESSFUL run.
 * Call releaseCooldown() when the request finishes (success or failure).
 */
export async function acquireCooldown(
  key: string,
  cooldownSeconds: number,
  maxProcessingSeconds = 240 // safety: unstick a lock if a request crashed without releasing
): Promise<LockResult> {
  const ref = admin.firestore().doc(`rateLimits/${key}`)
  const now = Date.now()

  return admin.firestore().runTransaction(async (tx) => {
    const doc = await tx.get(ref)

    if (doc.exists) {
      const data = doc.data()!

      if (data.status === 'pending') {
        const pendingElapsed = (now - data.pendingSince) / 1000
        if (pendingElapsed < maxProcessingSeconds) {
          return { allowed: false, retryAfter: Math.ceil(maxProcessingSeconds - pendingElapsed) }
        }
        // stale pending lock (previous request crashed) — fall through and reclaim it
      } else if (data.status === 'cooldown') {
        const elapsed = (now - data.lastRequest) / 1000
        if (elapsed < cooldownSeconds) {
          return { allowed: false, retryAfter: Math.ceil(cooldownSeconds - elapsed) }
        }
      }
    }

    tx.set(ref, { status: 'pending', pendingSince: now })
    return { allowed: true }
  })
}

/** Call after the request finishes. success=true starts the real cooldown; success=false frees the lock immediately. */
export async function releaseCooldown(key: string, success: boolean): Promise<void> {
  const ref = admin.firestore().doc(`rateLimits/${key}`)
  if (success) {
    await ref.set({ status: 'cooldown', lastRequest: Date.now() })
  } else {
    await ref.delete().catch(() => {}) // free it up so the user can retry right away
  }
}

// ── Simple Firestore-based semaphore so concurrent users queue instead of ──
// ── slamming Groq's rate limit all at once. ────────────────────────────────
export async function acquireGroqSlot(
  maxConcurrent = 3,
  pollMs = 1500,
  timeoutMs = 45000
): Promise<boolean> {
  const ref = admin.firestore().doc('system/groqQueue')
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const acquired = await admin.firestore().runTransaction(async (tx) => {
      const doc = await tx.get(ref)
      const data = doc.exists ? doc.data()! : { active: 0, updatedAt: 0 }

      // self-heal: if "active" hasn't moved in a while, something crashed without releasing
      const stale = Date.now() - (data.updatedAt ?? 0) > 60000
      const active = stale ? 0 : (data.active ?? 0)

      if (active >= maxConcurrent) return false
      tx.set(ref, { active: active + 1, updatedAt: Date.now() })
      return true
    })

    if (acquired) return true
    await new Promise((r) => setTimeout(r, pollMs))
  }
  return false // gave up waiting — caller should return 503 "try again"
}

export async function releaseGroqSlot(): Promise<void> {
  const ref = admin.firestore().doc('system/groqQueue')
  await admin.firestore().runTransaction(async (tx) => {
    const doc = await tx.get(ref)
    const active = doc.exists ? (doc.data()!.active ?? 0) : 0
    tx.set(ref, { active: Math.max(0, active - 1), updatedAt: Date.now() })
  })
}