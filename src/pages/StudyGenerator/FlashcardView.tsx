import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { db, auth } from '../../services/firebase'
import { doc, updateDoc } from 'firebase/firestore'

interface FlashcardItem {
  term: string
  definition: string
}

interface FlashcardViewState {
  items: FlashcardItem[]
  fileName: string
  id: string
}

function FlashcardView() {
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state as FlashcardViewState | null

  // ── All hooks must be before any early return ──
  const [cards, setCards] = useState<FlashcardItem[]>(state?.items ?? [])
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<FlashcardItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null)

  // Fallback guard — AFTER all hooks
  if (!state?.items || state.items.length === 0) {
    return (
      <div className='flex h-screen'>
        <Sidebar />
        <main className='flex-1 overflow-auto p-8 flex flex-col items-center justify-center'>
          <p className='text-primary-600 font-roboto font-bold text-xl mb-4'>No flashcard data found.</p>
          <button
            className='bg-primary-600 text-white font-roboto px-6 py-2 rounded-md hover:bg-primary-500'
            onClick={() => navigate('/history')}
          >
            Back to History
          </button>
        </main>
      </div>
    )
  }

  const { fileName, id } = state

  const toggleCard = (index: number) => {
    if (editIndex === index) return
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }))
  }

    const persistCards = async (updated: FlashcardItem[]) => {
    const user = auth.currentUser
    if (!user || !id) {
        console.warn('Missing user or id', { uid: user?.uid, id })
        return
    }
    setSaving(true)
    setSaveError(null)
    try {
        await updateDoc(doc(db, 'users', user.uid, 'flashcardHistory', id), {
        items: updated,
        total: updated.length,
        })
        setShowSuccessModal(true)   
    } catch (err) {
        console.error('Update failed:', err)
        setSaveError('Failed to save changes.')
    } finally {
        setSaving(false)
    }
    }

  const handleEditOpen = (index: number) => {
    setEditIndex(index)
    setEditDraft({ ...cards[index] })
    setOpenMenuIndex(null)
  }

    const handleEditSave = () => {
    if (editDraft && editIndex !== null) {
        const updated = cards.map((c, i) => (i === editIndex ? editDraft : c))
        setCards(updated)
    }
    setEditIndex(null)
    setEditDraft(null)
    }
  const handleEditCancel = () => {
    setEditIndex(null)
    setEditDraft(null)
  }

    const handleDelete = (index: number) => {
    const updated = cards.filter((_, i) => i !== index)
    setCards(updated)
    setFlipped((prev) => {
        const next: Record<number, boolean> = {}
        Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k)
        if (ki < index) next[ki] = v
        else if (ki > index) next[ki - 1] = v
        })
        return next
    })
    setDeleteConfirmIndex(null)
    setOpenMenuIndex(null)
    }

  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-4 md:p-8'>

        {/* Header */}
        <div className='flex flex-col md:flex-row lg:items-center w-full gap-3 mb-6 mt-4'>
          <p className='text-2xl md:ml-10 lg:ml-0 md:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
            Flashcards
          </p>
          {fileName && (
            <span className='text-sm text-gray-400 font-roboto lg:ml-4 text-center lg:text-start'>
              from: {fileName}
            </span>
          )}
        </div>
        <hr className='w-full border-t border-primary-600 mb-6' />

        {saving && (
          <p className='text-xs text-gray-400 font-roboto text-center mb-4'>Saving changes...</p>
        )}

        {saveError && (
          <p className='text-xs text-red-500 font-roboto text-center mb-4'>{saveError}</p>
        )}

        <p className='text-center text-gray-400 font-roboto text-sm mb-6'>
          Click a card to flip it and reveal the definition.
        </p>

        {/* Cards */}
        <div className='flex flex-col lg:mx-20 gap-8 md:mx-10'>
          {cards.map((card, index) => (
            <div key={index} className='flex justify-center'>
              <div className='perspective flex-1 lg:mx-20 md:mx-10 relative'>

                {/* ── Menu Button ── */}
                <div className='absolute top-3 right-3 z-20'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuIndex(openMenuIndex === index ? null : index)
                    }}
                    className='text-white hover:opacity-70 text-3xl leading-none'
                    title='EDIT/DELETE'
                  >
                    ⋮
                  </button>

                  {openMenuIndex === index && (
                    <div className='absolute right-0 top-8 z-30 bg-white border border-gray-200 rounded-lg shadow-lg w-32 overflow-hidden'>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => handleEditOpen(index)}
                        className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                      >
                        <img className='w-5 h-5' src='/edit.png' alt='edit icon' />Edit
                      </button>
                      <hr className='my-1 border-gray-100' />
                      <button
                        onClick={() => {
                          setDeleteConfirmIndex(index)
                          setOpenMenuIndex(null)
                        }}
                        className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-red-50 font-semibold'
                      >
                        <img src='/delete.png' alt='delete icon' className='w-5 h-5' />Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Edit Mode ── */}
                {editIndex === index && editDraft ? (
                  <div className='w-full border-2 border-primary-600 rounded-xl px-5 py-5 flex flex-col gap-3 bg-white'>
                    <label className='text-xs text-gray-500 font-roboto'>Term</label>
                    <input
                      className='border border-gray-300 rounded-lg px-3 py-2 text-sm font-roboto focus:outline-none focus:border-primary-600'
                      value={editDraft.term}
                      onChange={(e) => setEditDraft({ ...editDraft, term: e.target.value })}
                      aria-label='Edit term'
                    />
                    <label className='text-xs text-gray-500 font-roboto'>Definition</label>
                    <textarea
                      className='border border-gray-300 rounded-lg px-3 py-2 text-sm font-roboto focus:outline-none focus:border-primary-600 resize-none'
                      rows={3}
                      value={editDraft.definition}
                      onChange={(e) => setEditDraft({ ...editDraft, definition: e.target.value })}
                      aria-label='Edit definition'
                    />
                    <div className='flex gap-2 mt-1'>
                      <button
                        onClick={handleEditSave}
                        className='bg-primary-600 text-white text-sm px-4 py-1.5 rounded-lg hover:opacity-80 transition font-roboto'
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className='bg-gray-200 text-gray-600 text-sm px-4 py-1.5 rounded-lg hover:opacity-80 transition font-roboto'
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Flip Card ── */
                  <div
                    onClick={() => toggleCard(index)}
                    className={`relative w-full h-56 cursor-pointer duration-500 transform-style preserve-3d
                      ${flipped[index] ? 'rotate-y-180' : ''}`}
                  >
                    <div className='absolute w-full h-full backface-hidden flex items-center justify-center
                      bg-primary-600 border-2 border-primary-600 rounded-xl px-5'>
                      <div className='flex flex-col text-center'>
                        <p className='text-white text-xl font-bold uppercase'>{card.term}</p>
                        <p className='text-white text-sm mt-1'>Click to view definition</p>
                      </div>
                    </div>
                    <div className='absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center
                      bg-white border-2 border-primary-600 rounded-xl px-5'>
                      <p className='text-primary-600 text-center font-medium'>{card.definition}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Buttons */}
          <div className='flex flex-row ml-auto gap-4 mb-10'>
            <button
              className='hover:opacity-50 bg-gray-500 text-white py-2 font-roboto md:px-14 px-8 text-sm md:text-xl rounded-md uppercase'
              onClick={() => navigate('/history')}
            >
              Discard
            </button>
            <button
              className='hover:opacity-50 bg-primary-600 text-white py-2 font-roboto md:px-14 px-8 text-sm md:text-xl rounded-md uppercase'
              onClick={() => persistCards(cards)}
            >
              Save
            </button>
          </div>
        </div>

      </main>

      {showSuccessModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
            <div className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-6'>
            <div className='flex flex-col items-center gap-2'>
                <img src="/Saved.png" alt="Saved" className='w-16 h-16'/>
                <p className='text-primary-600 font-roboto font-bold text-xl text-center uppercase'>
                Flashcards Updated!
                </p>
                <p className='text-gray-400 font-roboto text-sm text-center'>
                Your changes have been saved successfully.
                </p>
            </div>
            <button
                onClick={() => navigate('/history')}
                className='w-full bg-primary-600 text-white font-roboto py-2.5 rounded-lg hover:opacity-80 transition uppercase font-semibold text-sm'
            >
                OK
            </button>
            </div>
        </div>
        )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirmIndex !== null && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-6'>
            <p className='text-primary-600 font-roboto font-bold text-xl text-center uppercase'>
              Delete this card?
            </p>
            <p className='text-gray-400 font-roboto text-sm text-center'>
              This action cannot be undone.
            </p>
            <div className='flex flex-row w-full gap-3'>
              <button
                onClick={() => setDeleteConfirmIndex(null)}
                className='flex-1 border-2 border-primary-600 text-primary-600 font-roboto py-2.5 rounded-lg hover:bg-primary-50 transition uppercase font-semibold text-sm'
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmIndex)}
                className='flex-1 bg-red-500 text-white font-roboto py-2.5 rounded-lg hover:opacity-80 transition uppercase font-semibold text-sm'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlashcardView