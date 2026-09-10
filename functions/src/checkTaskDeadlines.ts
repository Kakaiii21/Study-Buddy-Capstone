import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'

if (!admin.apps.length) admin.initializeApp()

const NOTIFY_LEAD_MS = 60 * 60 * 1000 // 1 hour before deadline — same window as the old client-side timer
const CHECK_WINDOW_MS = 5 * 60 * 1000 // function runs every 5 minutes

// Task deadlines are stored as "YYYY-MM-DDTHH:MM" (or with seconds) with NO
// timezone info — they're always meant to be Philippines local time (UTC+8),
// since that's where the app's users are. On the client this worked fine
// because new Date() there defaults to the browser's own (PH) timezone. On
// this server, new Date() defaults to UTC, so the same string would be
// misread as 8 hours later than intended. This forces the +08:00 offset
// explicitly so the math is correct regardless of where the function runs.
function parseDeadlineAsPHTime(deadline: string): number {
  // Already has explicit timezone info (Z or +/-HH:MM) — trust it as-is.
  if (/Z$|[+-]\d{2}:\d{2}$/.test(deadline)) {
    return new Date(deadline).getTime()
  }
  // Add seconds if missing, then attach the PH offset.
  const withSeconds = deadline.length <= 16 ? `${deadline}:00` : deadline
  return new Date(`${withSeconds}+08:00`).getTime()
}

// ── CHECK TASK DEADLINES (scheduled) ──────────────────────────────────────
// Runs every 5 minutes. Looks across every user's tasks subcollection for
// tasks entering the "due in 1 hour" window that haven't been notified
// about yet, then pushes via FCM to every device the owning user has
// registered. This replaces the old per-device setTimeout scheduling —
// it works regardless of which device created/edited the task, and
// regardless of whether any device currently has the app open.
export const checkTaskDeadlines = onSchedule('every 5 minutes', async () => {
  const now = Date.now()
  // We want tasks whose "notify point" (deadline - 1hr) has landed within
  // the last few minutes — i.e. it already passed, but recently enough
  // that this is the first run catching it since it happened.
  const windowEnd = now
  const windowStart = now - CHECK_WINDOW_MS

  let dueSoonSnap
  try {
    dueSoonSnap = await admin.firestore()
      .collectionGroup('tasks')
      .where('status', '!=', 'done')
      .get()
  } catch (err) {
    console.error('checkTaskDeadlines: failed to query tasks', err)
    return
  }

  console.log(`[checkTaskDeadlines] scanning ${dueSoonSnap.size} non-done tasks`)

  for (const taskDoc of dueSoonSnap.docs) {
    const task = taskDoc.data() as {
      name?: string
      deadline?: string
      uid?: string
      notifiedAt?: number | null
    }

    if (!task.deadline || !task.uid) continue
    if (task.notifiedAt) continue // already notified for this task

    const deadlineMs = parseDeadlineAsPHTime(task.deadline)
    if (isNaN(deadlineMs)) continue

    // Is this task's "1 hour before deadline" mark inside the window we're
    // checking right now — i.e. has it passed within the last few minutes?
    const notifyAt = deadlineMs - NOTIFY_LEAD_MS
    if (notifyAt < windowStart || notifyAt > windowEnd) continue

    try {
      const tokensSnap = await admin.firestore()
        .collection('users').doc(task.uid).collection('fcmTokens')
        .get()

      const tokens = tokensSnap.docs.map((d) => d.id)
      if (tokens.length === 0) {
        console.log(`[checkTaskDeadlines] no fcm tokens for uid ${task.uid}, skipping task ${taskDoc.id}`)
        continue
      }

      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: '⏰ Task Due Soon!',
          body: `"${task.name ?? 'A task'}" is due in 1 hour.`,
        },
        data: {
          taskId: taskDoc.id,
          deadline: task.deadline,
        },
      })

      console.log(`[checkTaskDeadlines] task ${taskDoc.id}: sent ${response.successCount}/${tokens.length}`)

      // Prune dead tokens (uninstalled, cleared data, etc.) so we don't
      // keep sending to them and the fcmTokens collection doesn't grow forever.
      const deletions: Promise<unknown>[] = []
      response.responses.forEach((result, i) => {
        if (!result.success) {
          const code = result.error?.code
          if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
            deletions.push(
              admin.firestore().collection('users').doc(task.uid!).collection('fcmTokens').doc(tokens[i]).delete()
            )
          }
        }
      })
      if (deletions.length > 0) await Promise.all(deletions)

      await taskDoc.ref.update({ notifiedAt: now })
    } catch (err) {
      // One bad task shouldn't stop the rest of the batch
      console.error(`checkTaskDeadlines: failed to process task ${taskDoc.id}`, err)
    }
  }
})