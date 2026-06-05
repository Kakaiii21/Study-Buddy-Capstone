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

// Firestore REST API — NetworkFirst so live data is preferred,
// but falls back to cached response when offline
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

// Google Fonts / static assets — serve from cache, refresh in background
registerRoute(
  ({ url }) =>
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com'),
  new StaleWhileRevalidate({ cacheName: 'fonts-cache' })
)

// ── Everything below is unchanged ────────────────────────────

self.addEventListener('install', () => self.skipWaiting())

// ... (rest of your existing code stays exactly as-is)

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
  clearTimeout(self._notifTimers[taskId])

  const deadlineMs = new Date(deadline).getTime()
  const notifAt = deadlineMs - 60 * 60 * 1000  // 1 hour before
  const msUntilNotif = notifAt - Date.now()

  if (msUntilNotif <= 0) return

  self._notifTimers[taskId] = setTimeout(() => {
    self.registration.showNotification('⏰ Task Due Soon!', {
      body: `"${taskName}" is due in 1 hour.`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `task-deadline-${taskId}`,
      data: { taskId, deadline },
      requireInteraction: true,
    })
  }, msUntilNotif)
}

// ── Single activate listener ──────────────────────────────────

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      await self.clients.claim()
      const all = await getAllDeadlines()
      const now = Date.now()
      for (const { taskId, taskName, deadline } of all) {
        const deadlineMs = new Date(deadline).getTime()
        const notifAt = deadlineMs - 60 * 60 * 1000
        if (notifAt <= now) {
          await removeDeadline(taskId)
          continue
        }
        scheduleTimer(taskId, taskName, deadline)
      }
    })()
  )
})

// ── Message handler ───────────────────────────────────────────

self.addEventListener('message', async (event) => {
  if (event.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { taskId, taskName, deadline } = event.data
    await saveDeadline(taskId, taskName, deadline)
    scheduleTimer(taskId, taskName, deadline)
  }

  if (event.data?.type === 'CANCEL_NOTIFICATION') {
    const { taskId } = event.data
    clearTimeout(self._notifTimers[taskId])
    delete self._notifTimers[taskId]
    await removeDeadline(taskId)
  }
})

// ── Notification click ────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) return clients[0].focus()
      return self.clients.openWindow('/')
    })
  )
})