import  { useState, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import { useRecentlyDeleted } from '../hooks/useRecentlyDeleted'
import { daysRemaining } from '../services/recentlyDeletedService'
import type { DeletedItemType } from '../services/recentlyDeletedService'

const PAGE_TYPES: DeletedItemType[] = [
  'To Do',
  'Notes',
  'Class Schedule',
  'Course',
  'Quiz',
  'Flashcard',
]



function DaysBadge({ days }: { days: number }) {
  const isUrgent = days <= 7
  const isWarning = days <= 14

  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        isUrgent
          ? 'bg-red-100 text-red-600'
          : isWarning
          ? 'bg-yellow-100 text-yellow-600'
          : 'bg-green-100 text-green-600'
      }`}
    >
      {days}d left
    </span>
  )
}

function ConfirmModal({
  itemName,
  onConfirm,
  onCancel,
}: {
  itemName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
        <h2 className='text-lg font-bold text-gray-800 mb-2'>Permanently Delete?</h2>
        <p className='text-sm text-gray-500 mb-6'>
          <span className='font-semibold text-gray-700'>"{itemName}"</span> will be permanently
          deleted and cannot be recovered. Any associated files will also be removed.
        </p>
        <div className='flex gap-3 justify-end'>
          <button
            onClick={onCancel}
            className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors'
          >
            Delete Forever
          </button>
        </div>
      </div>
    </div>
  )
}

function RecentlyDeleted() {
  const [selectedType, setSelectedType] = useState<DeletedItemType>('To Do')
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmItem, setConfirmItem] = useState<{ id: string; name: string } | null>(null)

  const {
    items,
    loading,
    error,
    restoreError,
    clearRestoreError,
    actionLoading,
    handleRestore,
    handlePermanentDelete,
  } = useRecentlyDeleted()

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesType = item.type === selectedType
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [items, selectedType, searchQuery])

  const handleDeleteClick = (id: string, name: string) => {
    setConfirmItem({ id, name })
  }

  const handleConfirmDelete = async () => {
    if (!confirmItem) return
    const item = items.find((i) => i.id === confirmItem.id)
    if (item) await handlePermanentDelete(item)
    setConfirmItem(null)
  }

  return (
    <div className='flex h-screen'>
      <Sidebar />

      {confirmItem && (
        <ConfirmModal
          itemName={confirmItem.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmItem(null)}
        />
      )}

      <main className='flex-1 overflow-auto p-4 md:p-8 mt-1 lg:mt-0'>
        <div className='min-h-screen flex flex-col'>

          {/* Header */}
          <div className='flex flex-col md:flex-row lg:flex-row lg:items-center w-full gap-3 mb-6 lg:mt-0 md:mt-0 mt-4'>
            <p className='text-2xl lg:ml-0  md:ml-16 md:text-4xl lg:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
              Recently Deleted
            </p>
          </div>
          <hr className='w-full border-t border-primary-600 mb-6' />

          {/* Restore Error Toast */}
          {restoreError && (
            <div className='flex items-center justify-between bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4'>
              <span>{restoreError}</span>
              <button
                onClick={clearRestoreError}
                className='ml-4 text-red-400 hover:text-red-600 font-bold text-lg leading-none'
              >
                ×
              </button>
            </div>
          )}

          {/* Dropdown and Search Bar */}
          <div className='flex flex-row justify-end items-center gap-3 mb-7'>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DeletedItemType)}
              className='border-2 border-primary-600 rounded-lg px-4 py-2 text-primary-600 font-semibold bg-white focus:outline-none text-sm'
              aria-label='Filter by page type'
            >
              {PAGE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type='text'
              placeholder='Search...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full sm:w-72 border-2 border-primary-600 rounded-full px-4 py-2 text-primary-600 bg-white focus:outline-none text-sm'
            />
          </div>

          {/* Table header */}
          <div className='grid grid-cols-[250px_1fr_100px_80px] gap-4 pb-3 border-b border-gray-200 text-gray-500 text-xs font-medium px-3'>
            <p>Name</p>
            <p className='w-20 text-center'>Expires</p>
            <p className='w-16 text-center'>Restore</p>
            <p className='w-16 text-center'>Delete</p>
          </div>

          {/* States */}
          {loading && (
            <div className='flex-1 flex items-center justify-center py-20 text-primary-600 text-sm font-medium'>
              Loading...
            </div>
          )}

          {error && (
            <div className='flex-1 flex items-center justify-center py-20 text-red-500 text-sm'>
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className='flex-1 flex flex-col items-center justify-center py-20 text-gray-400 gap-2'>
              <img src='/delete.png' alt='Empty' className='w-12 h-12 opacity-30' />
              <p className='text-sm font-medium'>No deleted {selectedType} items</p>
            </div>
          )}

          {/* Rows */}
          {!loading && !error && (
            <ul className='divide-y divide-gray-100'>
              {filtered.map((item) => {
                const days = daysRemaining(item.deletedAt)
                const isActing = actionLoading === item.id

                return (
                  <li
                    key={item.id}
                    className={`grid grid-cols-[250px_1fr_100px_80px] gap-4 items-center py-4 px-3 hover:bg-gray-50 rounded-xl transition-colors ${
                      isActing ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                

                      <p className='font-medium text-primary-600 text-sm md:text-base lg:text-xl break-all leading-tight'>{item.name}</p>
                    <div className='w-20 flex justify-center'>
                      <DaysBadge days={days} />
                    </div>

                    <div className='w-16 flex justify-center'>
                      <button
                        aria-label={`Restore ${item.name}`}
                        onClick={() => handleRestore(item)}
                        disabled={isActing}
                        className='p-2 rounded-lg hover:bg-primary-50 transition-colors'
                      >
                        {isActing ? (
                          <span className='w-8 h-8 flex items-center justify-center text-primary-600 text-xs'>⏳</span>
                        ) : (
                          <img src='/Restore.png' alt='Restore' className='w-8 h-8' />
                        )}
                      </button>
                    </div>

                    <div className='w-16 flex justify-center'>
                      <button
                        aria-label={`Delete ${item.name}`}
                        onClick={() => handleDeleteClick(item.id, item.name)}
                        disabled={isActing}
                        className='p-2 rounded-lg hover:bg-red-50 transition-colors'
                      >
                        <img src='/delete.png' alt='Delete' className='w-7 h-7' />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

        </div>
      </main>
    </div>
  )
}

export default RecentlyDeleted