/// <reference lib="webworker" />
/// <reference types="vite-plugin-pwa/vanillajs" />

import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & {
  _notifTimers: Record<string, ReturnType<typeof setTimeout>>
}

precacheAndRoute(self.__WB_MANIFEST)

// ── Runtime caching ───────────────────────────────────────────

registerRoute(
  ({ url }) => url.hostname.includes('firestore.googleapis.com'),
  new NetworkFirst({
    cacheName: 'firestore-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
)

registerRoute(
  ({ url }) =>
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com'),
  new StaleWhileRevalidate({ cacheName: 'fonts-cache' })
)

// ── Lifecycle ─────────────────────────────────────────────────

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      await self.clients.claim()
      await restoreTimersFromDB()
    })()
  )
})

// ── IndexedDB helpers ─────────────────────────────────────────

const DB_NAME = 'notif-store'
const STORE = 'deadlines'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'taskId' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveDeadline(taskId: string, taskName: string, deadline: string) {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ taskId, taskName, deadline })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function removeDeadline(taskId: string) {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(taskId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getAllDeadlines(): Promise<{ taskId: string; taskName: string; deadline: string }[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ── Timer scheduling ──────────────────────────────────────────

self._notifTimers = {}

function scheduleTimer(taskId: string, taskName: string, deadline: string) {
  // Clear any existing timer for this task first
  if (self._notifTimers[taskId]) {
    clearTimeout(self._notifTimers[taskId])
    delete self._notifTimers[taskId]
  }

  // Parse deadline — stored as "YYYY-MM-DDTHH:MM:SS" (local time, with seconds)
  const deadlineMs = new Date(deadline).getTime()
  const notifAt    = deadlineMs - 60 * 60 * 1000   // 1 hour before deadline
  const msUntil    = notifAt - Date.now()

  if (msUntil <= 0) {
    // 1-hour window already passed — clean up, no notification
    removeDeadline(taskId)
    return
  }

  self._notifTimers[taskId] = setTimeout(async () => {
    delete self._notifTimers[taskId]
    await removeDeadline(taskId)

    self.registration.showNotification('⏰ Task Due Soon!', {
      body: `"${taskName}" is due in 1 hour.`,
      icon: '/icon-192.png',
      //`badge: '/icon-192.png',
      tag: `task-deadline-${taskId}`,
      data: { taskId, deadline },
      requireInteraction: true,
    })
  }, msUntil)
}

// Re-schedule all persisted tasks — called on activate AND when the page
// sends RESTORE_TIMERS (handles SW restart without re-activate)
async function restoreTimersFromDB() {
  const all = await getAllDeadlines()
  for (const { taskId, taskName, deadline } of all) {
    scheduleTimer(taskId, taskName, deadline)
  }
}

// ── Message handler ───────────────────────────────────────────

self.addEventListener('message', async (event) => {
  const data = event.data
  if (!data?.type) return

  if (data.type === 'SCHEDULE_NOTIFICATION') {
    const { taskId, taskName, deadline } = data
    await saveDeadline(taskId, taskName, deadline)
    scheduleTimer(taskId, taskName, deadline)
  }

  if (data.type === 'CANCEL_NOTIFICATION') {
    const { taskId } = data
    if (self._notifTimers[taskId]) {
      clearTimeout(self._notifTimers[taskId])
      delete self._notifTimers[taskId]
    }
    await removeDeadline(taskId)
  }

  // Called by the hook on every page load to recover timers lost on SW restart
  if (data.type === 'RESTORE_TIMERS') {
    await restoreTimersFromDB()
  }
})

// ── Notification click ────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) return clients[0].focus()
      return self.clients.openWindow('/todolist')
    })
  )
})