import { useEffect, useState, useCallback } from 'react'
import {
  fetchRecentlyDeleted,
  restoreItem,
  permanentDelete,
  type DeletedItem,
  type DeletedItemType,
} from '../services/recentlyDeletedService'
import { useAuth } from './useAuth'


// Remove these lines:
// const functions = getFunctions()
// const deleteCloudinaryAsset = httpsCallable(...)

async function deleteFromCloudinary(publicId: string): Promise<void> {
  const ext = publicId.split('.').pop()?.toLowerCase() ?? ''
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp']
  const resourceType = imageExts.includes(ext) ? 'image' : 'raw'

  console.log('[DELETE ATTEMPT] publicId:', publicId, '| resourceType:', resourceType)

  const res = await fetch('https://us-central1-study-buddy-cbaa8.cloudfunctions.net/deleteCloudinaryAsset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId, resourceType }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to delete from Cloudinary')
  }

  console.log('[DELETE SUCCESS]')
}

type State = {
  items: DeletedItem[]
  loading: boolean
  error: string | null
}

export function useRecentlyDeleted() {
  const { user } = useAuth()
  const uid = user?.uid

  const [state, setState] = useState<State>({ items: [], loading: true, error: null })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!uid) return
    fetchRecentlyDeleted(uid)
      .then((data) => setState({ items: data, loading: false, error: null }))
      .catch(() =>
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to load recently deleted items.',
        }))
      )
  }, [uid])

  useEffect(() => {
    load()
  }, [load])

  const handleRestore = useCallback(
    async (item: DeletedItem) => {
      if (!uid) return
      setActionLoading(item.id)
      setRestoreError(null)
      try {
        await restoreItem(uid, item)
        setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== item.id) }))
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message.includes('PARENT_FOLDER_DELETED')) {
          setRestoreError(
            'Cannot restore this file — its course folder was also deleted. Please restore the folder first.'
          )
        } else {
          setRestoreError('Failed to restore item. Please try again.')
        }
      } finally {
        setActionLoading(null)
      }
    },
    [uid]
  )

const handlePermanentDelete = useCallback(
  async (item: DeletedItem) => {
    if (!uid) return
    setActionLoading(item.id)
    try {
      await permanentDelete(uid, item, deleteFromCloudinary)

      // Subtract storage if it's a file
      if (item.data?.fileSize) {
        const sizeStr = String(item.data.fileSize).trim().toLowerCase().replace(/\s/g, '')
        let bytes = 0
        if (sizeStr.endsWith('mb')) bytes = parseFloat(sizeStr) * 1024 * 1024
        else if (sizeStr.endsWith('kb')) bytes = parseFloat(sizeStr) * 1024
        else if (sizeStr.endsWith('gb')) bytes = parseFloat(sizeStr) * 1024 * 1024 * 1024
        else bytes = parseFloat(sizeStr)

        if (!isNaN(bytes) && bytes > 0) {
          const { doc, updateDoc, increment } = await import('firebase/firestore')
          const { db } = await import('../services/firebase')
          await updateDoc(doc(db, 'users', uid), {
            storageUsed: increment(-bytes)
          })
        }
      }

      setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== item.id) }))
    } catch {
      setState((prev) => ({ ...prev, error: 'Failed to permanently delete item.' }))
    } finally {
      setActionLoading(null)
    }
  },
  [uid]
)

  const filteredByType = useCallback(
    (type: DeletedItemType) => state.items.filter((i) => i.type === type),
    [state.items]
  )

  return {
    items: state.items,
    loading: state.loading,
    error: state.error,
    restoreError,
    clearRestoreError: () => setRestoreError(null),
    actionLoading,
    handleRestore,
    handlePermanentDelete,
    filteredByType,
    reload: load,
  }
}