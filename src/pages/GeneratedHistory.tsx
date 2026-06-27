import  { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useQuizHistory } from '../hooks/useQuizHistory'
import { useFlashcardHistory } from '../hooks/useFlashcardHistory'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// This component is copy-pasted in Notes, ToDoList, ClassSchedule, GeneratedHistory
// Fix it in ALL of them the same way

function SoftDeleteModal({ itemName, onConfirm, onCancel }: { 
  itemName: string
  onConfirm: () => void
  onCancel: () => void 
}) {
  const [confirming, setConfirming] = useState(false)  // ← add this

  const handleConfirm = () => {
    if (confirming) return          // ← block double click
    setConfirming(true)
    onConfirm()
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
        <div className='flex items-center gap-3 mb-3'>
          <img src="/delete.png" alt="deleteicon" className='w-7 h-7' />
          <h2 className='text-lg font-bold text-gray-800'>Move to Recently Deleted?</h2>
        </div>
        <p className='text-sm text-gray-500 mb-1'>
          <span className='font-semibold text-gray-700'>"{itemName}"</span> will be moved to{' '}
          <span className='font-semibold text-primary-600'>Recently Deleted</span>.
        </p>
        <p className='text-xs text-gray-400 mb-6'>
          You can restore it anytime within <span className='font-semibold text-red-400'>30 days</span>, after which it will be permanently deleted.
        </p>
        <div className='flex gap-3 justify-end'>
          <button 
            onClick={onCancel} 
            disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40'
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60'
          >
            {confirming ? 'Deleting...' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  )
}


function GeneratedHistory() {


  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedGen, setSelectedGen] = useState('Quiz')
  const [searchQuery, setSearchQuery] = useState('')
  const isOnline = useNetworkStatus()

  const { quizHistory, loading: quizLoading, deleteQuiz } = useQuizHistory(user)
  const { flashcardHistory, loading: flashLoading, deleteFlashcard } = useFlashcardHistory(user)

  const genOption = ['Quiz', 'Flashcard']
  const loading = selectedGen === 'Quiz' ? quizLoading : flashLoading

  const filteredQuiz = quizHistory.filter((item) =>
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFlashcard = flashcardHistory.filter((item) =>
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = async () => {
    if (!pendingDelete) return
    if (selectedGen === 'Quiz') await deleteQuiz(pendingDelete.id)
    else await deleteFlashcard(pendingDelete.id)
    setPendingDelete(null)
  }

  // ── Navigate to QuizView with all saved data ──
  const handleViewQuiz = (item: (typeof quizHistory)[number]) => {
    navigate('/quizView', {
      state: {
        items: item.items,
        selectedAnswers: item.selectedAnswers,
        score: item.score,
        total: item.total,
        fileName: item.fileName,
        id: item.id,
      },
    })
  }

  // ── Navigate to Quiz as a fresh retake ──
  const handleRetakeQuiz = (item: (typeof quizHistory)[number]) => {
    navigate('/studyGenerator/Quiz', {
      state: {
        items: item.items,
        mode: 'quiz' as const,
        fileName: item.fileName,
      },
    })
  }

  // ── Navigate to FlashcardView ──
  const handleViewFlashcard = (item: (typeof flashcardHistory)[number]) => {
    navigate('/flashcardView', {
      state: {
        items: item.items,
        fileName: item.fileName,
        id: item.id, 
      },
    })
  }

  useEffect(() => {
  const quizView = sessionStorage.getItem('quizView_state')
  const flashcardView = sessionStorage.getItem('flashcardView_state')
  if (quizView) {
    navigate('/quizView', { state: JSON.parse(quizView) })
  } else if (flashcardView) {
    navigate('/flashcardView', { state: JSON.parse(flashcardView) })
  }
}, [])

  return (
    <div className='flex h-screen'>
      <div className='hidden lg:flex xl:flex 2xl:flex bg-gray-600 h-screen w-16'></div>

      <Sidebar />

      <main className='flex-1 overflow-auto p-4 md:p-8 mt-1 lg:mt-0'>
        <div className='min-h-screen flex flex-col'>

          {/* Header */}
          <div className='flex flex-col md:flex-row lg:flex-row lg:items-center w-full gap-3 mb-6 lg:mt-0 md:mt-0 mt-4'>
            <p className='text-2xl lg:ml-0 md:ml-16 md:text-4xl lg:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
              Generated History
            </p>
          </div>

          <hr className='w-full border-t border-primary-600 mb-6' />

          {/* Filters */}
          <div className='flex flex-row lg:flex-row sm:items-center sm:justify-end gap-3 mb-6'>
            <select
              value={selectedGen}
              aria-label='Generation Type'
              onChange={(e) => { setSelectedGen(e.target.value); setSearchQuery('') }}
              className='border-2 border-primary-600 rounded-lg px-4 py-2 text-primary-600 font-semibold bg-white focus:outline-none'
            >
              {genOption.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            <input
              type='text'
              placeholder='Search...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full sm:w-72 border-2 border-primary-600 rounded-full px-4 py-2 text-primary-600 bg-white focus:outline-none'
            />
          </div>

          {/* Recent label */}
          <div className='flex items-center gap-3 mb-4'>
            <p className='whitespace-nowrap text-primary-600 font-semibold'>Recent</p>
            <hr className='flex-1 border-t border-primary-100' />
          </div>
          {!isOnline && (
              <div className='mb-4 px-4 py-2 bg-yellow-50 border border-yellow-300 rounded-lg text-xs text-yellow-700 font-roboto text-center'>
                You're offline — viewing cached history. Delete is unavailable until reconnected.
              </div>
            )}


          {/* Loading */}
          {loading && (
            <p className='text-gray-400 font-roboto text-center py-10'>Loading...</p>
          )}

          {!loading && (
            <div className='w-full'>

              {/* ── Quiz Table ── */}
              {selectedGen === 'Quiz' && (
                <>
                  <div className='grid grid-cols-[1.2fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr] gap-2 pb-3 border-b text-gray-500 text-xs font-medium'>
                    <p>Name</p>
                    <p className='text-center'>Score</p>
                    <p className='text-center'>Items</p>
                    <p className='text-center'>View</p>
                    <p className='text-center'>Retake</p>
                    <p className='text-center'>Delete</p>
                  </div>

                  {filteredQuiz.length === 0 ? (
                    <p className='text-gray-400 font-roboto text-center py-10'>No quiz history found.</p>
                  ) : (
                    filteredQuiz.map((item) => (
                      <div key={item.id} className='border-b py-3'>
                        <div className='grid grid-cols-[1.2fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr] gap-2 items-center'>
                          <div className='min-w-0'>
                            <p className='text-xs md:text-sm lg:text-xl font-semibold text-primary-600 break-all leading-tight'>
                              {item.fileName}
                            </p>
                            <p className='text-xs md:text-sm text-gray-400'>{formatDate(item.dateTaken)}</p>
                          </div>
                          <p className='text-center text-sm md:text-base lg:text-lg text-primary-600'>{item.score}</p>
                          <p className='text-center text-sm md:text-base lg:text-lg text-primary-600'>{item.total}</p>
                          <div className='flex justify-center'>
                            <img
                              src='/View.png'
                              alt='View'
                              className='lg:w-7 lg:h-7 w-5 h-5 cursor-pointer hover:opacity-70'
                              onClick={() => handleViewQuiz(item)}
                            />
                          </div>
                          <div className='flex justify-center'>
                            <img
                              src='/Retake.png'
                              alt='Retake'
                              className='lg:w-7 lg:h-7 w-5 h-5 cursor-pointer hover:opacity-70'
                              onClick={() => handleRetakeQuiz(item)}
                            />
                          </div>
                          <div className='flex justify-center'>
                          <img
                            src='/delete.png'
                            alt='Delete'
                            className={`lg:w-7 lg:h-7 w-5 h-5 transition
                              ${isOnline ? 'cursor-pointer hover:opacity-70' : 'opacity-30 cursor-not-allowed'}`}
                            onClick={() => isOnline
                              ? setPendingDelete({ id: item.id, name: item.fileName })
                              : undefined
                            }
                          />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* ── Flashcard Table ── */}
              {selectedGen === 'Flashcard' && (
                <>
                  <div className='grid grid-cols-[1.2fr_0.5fr_0.5fr_0.5fr] gap-2 pb-3 border-b text-gray-500 text-xs font-medium'>
                    <p>Name</p>
                    <p className='text-center'>Items</p>
                    <p className='text-center'>View</p>
                    <p className='text-center'>Delete</p>
                  </div>

                  {filteredFlashcard.length === 0 ? (
                    <p className='text-gray-400 font-roboto text-center py-10'>No flashcard history found.</p>
                  ) : (
                    filteredFlashcard.map((item) => (
                      <div key={item.id} className='border-b py-3'>
                        <div className='grid grid-cols-[1.2fr_0.5fr_0.5fr_0.5fr] gap-2 items-center'>
                          <div className='min-w-0'>
                            <p className='text-xs md:text-sm lg:text-xl font-semibold text-primary-600 break-all leading-tight'>
                              {item.fileName}
                            </p>
                            <p className='text-xs md:text-sm lg:text-sm text-gray-400'>{formatDate(item.dateSaved)}</p>
                          </div>
                          <p className='text-center text-sm md:text-base lg:text-lg text-primary-600'>{item.total}</p>
                          <div className='flex justify-center'>
                            <img
                              src='/View.png'
                              alt='View'
                              className='lg:w-7 lg:h-7 w-5 h-5 cursor-pointer hover:opacity-70'
                              onClick={() => handleViewFlashcard(item)}
                            />
                          </div>
                          <div className='flex justify-center'>
                              <img
                                src='/delete.png'
                                alt='Delete'
                                className={`lg:w-7 lg:h-7 w-5 h-5 transition
                                  ${isOnline ? 'cursor-pointer hover:opacity-70' : 'opacity-30 cursor-not-allowed'}`}
                                onClick={() => isOnline
                                  ? setPendingDelete({ id: item.id, name: item.fileName })
                                  : undefined
                                }
                              />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

            </div>
          )}

        </div>
              {/* ── Delete Confirm Modal ── */}
{pendingDelete && (
  <SoftDeleteModal
    itemName={pendingDelete.name}
    onConfirm={handleDelete}
    onCancel={() => setPendingDelete(null)}
  />
)}
      </main>


    </div>
  )
}

export default GeneratedHistory