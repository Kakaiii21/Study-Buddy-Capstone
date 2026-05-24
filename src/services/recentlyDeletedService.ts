import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const RETENTION_DAYS = 30

export type DeletedItemType =
  | 'To Do'
  | 'Notes'
  | 'Class Schedule'
  | 'Course'
  | 'Quiz'
  | 'Flashcard'

export interface DeletedItem {
  id: string
  name: string
  type: DeletedItemType
  deletedAt: Timestamp
  originalCollection: string
  originalDocId: string
  cloudinaryPublicId?: string
  cloudinaryUrl?: string
  data: Record<string, unknown>
}

// ─── Soft Delete ─────────────────────────────────────────────────────────────
export async function softDelete(
  uid: string,
  params: {
    name: string
    type: DeletedItemType
    originalCollection: string
    originalDocId: string
    cloudinaryPublicId?: string
    cloudinaryUrl?: string
    data: Record<string, unknown>
  }
): Promise<void> {
  const ref = collection(db, 'users', uid, 'recentlyDeleted')
  await addDoc(ref, {
    name: params.name,
    type: params.type,
    deletedAt: Timestamp.now(),
    originalCollection: params.originalCollection,
    originalDocId: params.originalDocId,
    cloudinaryPublicId: params.cloudinaryPublicId ?? null,
    cloudinaryUrl: params.cloudinaryUrl ?? null,
    data: params.data,
  })

  await deleteDoc(doc(db, params.originalCollection, params.originalDocId))
}

// ─── Fetch Recently Deleted ───────────────────────────────────────────────────
export async function fetchRecentlyDeleted(uid: string): Promise<DeletedItem[]> {
  const ref = collection(db, 'users', uid, 'recentlyDeleted')
  const snap = await getDocs(ref)

  const now = Date.now()
  const expiredIds: string[] = []
  const items: DeletedItem[] = []

  snap.forEach((d) => {
    const raw = d.data()
    const deletedAt = raw.deletedAt as Timestamp
    const ageMs = now - deletedAt.toMillis()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)

    if (ageDays >= RETENTION_DAYS) {
      expiredIds.push(d.id)
    } else {
      items.push({ id: d.id, ...raw } as DeletedItem)
    }
  })

  await Promise.all(
    expiredIds.map((id) => deleteDoc(doc(db, 'users', uid, 'recentlyDeleted', id)))
  )

  return items
}

// ─── Restore ─────────────────────────────────────────────────────────────────
export async function restoreItem(uid: string, item: DeletedItem): Promise<void> {
  // Check if this is a course file (path contains /courses/.../files)
  const isCourseFile = item.originalCollection.includes('/courses/') &&
    item.originalCollection.endsWith('/files')

  if (isCourseFile) {
    // Extract the course doc path: users/{uid}/courses/{courseId}
    // originalCollection looks like: users/{uid}/courses/{courseId}/files
    const parts = item.originalCollection.split('/')
    // parts: ['users', uid, 'courses', courseId, 'files']
    const courseId = parts[3]
    const coursePath = `users/${uid}/courses/${courseId}`
    const courseSnap = await getDoc(doc(db, coursePath))

    if (!courseSnap.exists()) {
      throw new Error(
        'PARENT_FOLDER_DELETED: The course folder this file belongs to has been deleted. Please restore the folder first.'
      )
    }
  }

  const originalRef = doc(db, item.originalCollection, item.originalDocId)
  await setDoc(originalRef, item.data)
  await deleteDoc(doc(db, 'users', uid, 'recentlyDeleted', item.id))
}

// ─── Permanent Delete ─────────────────────────────────────────────────────────
export async function permanentDelete(
  uid: string,
  item: DeletedItem,
  deleteFromCloudinary: (publicId: string) => Promise<void>
): Promise<void> {
  if (item.cloudinaryPublicId) {
    await deleteFromCloudinary(item.cloudinaryPublicId)
  }
  await deleteDoc(doc(db, 'users', uid, 'recentlyDeleted', item.id))
}

// ─── Days Remaining ───────────────────────────────────────────────────────────
export function daysRemaining(deletedAt: Timestamp): number {
  const ageMs = Date.now() - deletedAt.toMillis()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(RETENTION_DAYS - ageDays))
}