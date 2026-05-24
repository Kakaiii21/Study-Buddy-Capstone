import { useEffect, useState, useCallback } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import {
  fetchRecentlyDeleted,
  restoreItem,
  permanentDelete,
  type DeletedItem,
  type DeletedItemType,
} from '../services/recentlyDeletedService'
import { useAuth } from './useAuth'

const functions = getFunctions()
const deleteCloudinaryAsset = httpsCallable<
  { publicId: string; resourceType?: string },
  { success: boolean }
>(functions, 'deleteCloudinaryAsset')

async function deleteFromCloudinary(publicId: string): Promise<void> {
  const ext = publicId.split('.').pop()?.toLowerCase() ?? ''
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp']
  const resourceType = imageExts.includes(ext) ? 'image' : 'raw'
  await deleteCloudinaryAsset({ publicId, resourceType })
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