import  { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { SESSION_KEY_RESULT } from '../StudyGenerator'
import { auth, db } from '../../services/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

interface FlashcardItem {
  term: string
  definition: string
}

interface ResultState {
  items: FlashcardItem[]
  mode: 'flashcard'
  fileName: string
}

function loadResult(locationState: unknown): ResultState | null {
  const state = locationState as ResultState | null
  if (state?.items && state.mode === 'flashcard') return state

  try {
    const saved = sessionStorage.getItem(SESSION_KEY_RESULT)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.mode === 'flashcard') return parsed as ResultState
    }
  } catch {/**/}

  return null
}

function loadPersistedCards(): FlashcardItem[] | null {
  try {
    const saved = sessionStorage.getItem('flashcard_cards')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

function Flashcard() {
  const location = useLocation()
  const navigate = useNavigate()

  const [result] = useState<ResultState | null>(() => loadResult(location.state))

  const [cards, setCards] = useState<FlashcardItem[]>(
    () => loadPersistedCards() ?? result?.items ?? []
  )

  const [enabled, setEnabled] = useState(false)
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<FlashcardItem | null>(null)

  const toggleCard = (index: number) => {
    if (editIndex === index) return
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const saveCards = (updated: FlashcardItem[]) => {
    setCards(updated)
    sessionStorage.setItem('flashcard_cards', JSON.stringify(updated))
  }

  const handleDelete = (index: number) => {
    const updated = cards.filter((_, i) => i !== index)
    saveCards(updated)
    setOpenMenuIndex(null)
    setFlipped((prev) => {
      const next: Record<number, boolean> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k)
        if (ki < index) next[ki] = v
        else if (ki > index) next[ki - 1] = v
      })
      return next
    })
  }

  const handleEditOpen = (index: number) => {
    setEditIndex(index)
    setEditDraft({ ...cards[index] })
    setOpenMenuIndex(null)
  }

  const handleEditSave = () => {
    if (editDraft && editIndex !== null) {
      const updated = cards.map((c, i) => (i === editIndex ? editDraft : c))
      saveCards(updated)
    }
    setEditIndex(null)
    setEditDraft(null)
  }

  const handleEditCancel = () => {
    setEditIndex(null)
    setEditDraft(null)
  }

  const handleDiscard = () => {
    sessionStorage.removeItem(SESSION_KEY_RESULT)
    sessionStorage.removeItem('flashcard_cards')
    navigate('/studyGenerator')
  }

  const handleOk = () => {
    sessionStorage.removeItem(SESSION_KEY_RESULT)
    sessionStorage.removeItem('flashcard_cards')
    navigate('/studyGenerator')
  }

  const handleSubmit = async () => {
    if (enabled) {
      const user = auth.currentUser
      if (user && result) {
        setSaving(true)
        setSaveError(null)
        try {
          await addDoc(collection(db, 'users', user.uid, 'flashcardHistory'), {
            fileName: result.fileName ?? 'Untitled',
            total: cards.length,
            dateSaved: serverTimestamp(),
            items: cards,
          })
        } catch (err) {
          console.error('Save failed:', err)
          setSaveError('Failed to save to history.')
        } finally {
          setSaving(false)
        }
      }
    }

    setShowModal(true)
  }

  if (!result?.items || result.items.length === 0) {
    return (
      <div className='flex h-screen'>
        <Sidebar />
        <main className='flex-1 overflow-auto p-8 flex flex-col items-center justify-center'>
          <p className='text-primary-600 font-roboto font-bold text-xl mb-4'>No flashcard data found.</p>
          <button
            className='bg-primary-600 text-white font-roboto px-6 py-2 rounded-md hover:bg-primary-500'
            onClick={() => {
              sessionStorage.removeItem(SESSION_KEY_RESULT)
              sessionStorage.removeItem('flashcard_cards')
              navigate('/studyGenerator')
            }}
          >
            Go Back
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-8'>

        <div className='flex flex-col md:flex-row lg:items-center w-full gap-3 mb-6'>
          <p className='text-3xl md:ml-10 lg:ml-0 md:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
            Flashcards
          </p>
          {result.fileName && (
            <span className='text-sm text-gray-400 font-roboto lg:ml-4'>from: {result.fileName}</span>
          )}
        </div>
        <hr className='w-full border-t border-primary-600 mb-6' />

        <p className='text-center text-gray-400 font-roboto text-sm mb-6'>
          Click a card to flip it and reveal the definition.
        </p>

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
                        onClick={() => handleDelete(index)}
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

          <div className='flex flex-row justify-start items-center gap-3'>
            <button
              aria-label={enabled ? 'Disable save generated' : 'Enable save generated'}
              onClick={() => setEnabled(!enabled)}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition ${enabled ? 'bg-green-500' : 'bg-gray-400'}`}
            >
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <p className='text-xs md:text-sm font-semibold text-primary-600'>SAVE GENERATED</p>
          </div>

          <div className='flex flex-row ml-auto gap-4 mb-10'>
            <button
              className='hover:opacity-50 bg-gray-500 text-white py-2 md:px-14 px-8 text-sm md:text-xl rounded-md uppercase'
              onClick={handleDiscard}
            >
              Discard
            </button>
            <button
              className='hover:opacity-50 bg-primary-600 text-white py-2 md:px-14 px-8 text-sm md:text-xl rounded-md uppercase'
              onClick={handleSubmit}
            >
              Save
            </button>
          </div>
        </div>
      </main>

      {/* ── Result Modal ─────────────────────────────────────────────────────── */}
      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 lg:pb-16 lg:pt-10 flex flex-col items-center gap-10'>

            {enabled ? (
              <>
                <div className='flex flex-col text-center gap-3'>
                  <p className='text-primary-600 font-roboto font-bold text-4xl uppercase'>
                    Flashcard Result
                  </p>
                  <p className='text-primary-600 font-roboto text-center text-sm'>
                    This flashcard set has been saved. You can view it in Generated History.
                  </p>
                </div>
                <div>
                  <img src='/Saved.png' alt='Saved' className='w-32 h-32' />
                </div>
              </>
            ) : (
              <>
                <div className='flex flex-col text-center gap-3'>
                  <p className='text-primary-600 font-roboto font-bold text-4xl uppercase'>
                    Flashcard Result
                  </p>
                  <p className='text-primary-600 font-roboto text-center text-sm'>
                    This flashcard set was not saved. It cannot be viewed again.
                  </p>
                </div>
                <div>
                  <img src='/notSaved.png' alt='Not Saved' className='w-32 h-32' />
                </div>
              </>
            )}

            <div className='flex flex-row items-center gap-1 lg:px-8 px-2'>
              <p className='lg:text-xl uppercase text-xl text-primary-600 font-roboto'>
                Items:
              </p>
              <p className='lg:text-xl text-xl font-semibold text-primary-600 font-roboto'>
                {cards.length}
              </p>
            </div>

            {saving && (
              <p className='text-xs text-gray-400 font-roboto text-center'>Saving...</p>
            )}
            {saveError && (
              <p className='text-xs text-red-500 font-roboto text-center'>{saveError}</p>
            )}

            <div className='flex flex-row w-full gap-3 px-8 lg:px-16 md:px-16'>
              <button
                onClick={handleOk}
                className='flex-1 bg-white text-primary-600 border border-primary-600 font-roboto py-2.5 rounded-lg hover:opacity-80 transition uppercase font-semibold text-md'
              >
                OK
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default Flashcard