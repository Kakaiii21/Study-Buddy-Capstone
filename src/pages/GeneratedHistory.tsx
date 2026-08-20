import  { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useQuizHistory } from '../hooks/useQuizHistory'
import { useFlashcardHistory } from '../hooks/useFlashcardHistory'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { useTour } from '../hooks/useTour'
function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface QuizItem {
  question: string
  options: string[]
  answer: string
}

const optionLetters = ['A', 'B', 'C', 'D']

const shuffleArray = <T,>(arr: T[]): T[] =>
  [...arr].sort(() => Math.random() - 0.5)

const shuffleQuizItems = (items: QuizItem[]): QuizItem[] =>
  shuffleArray(items).map((q) => {
    const shuffledOptions = shuffleArray(q.options)
    const newAnswerIndex = shuffledOptions.indexOf(q.options[optionLetters.indexOf(q.answer)])
    return {
      ...q,
      options: shuffledOptions,
      answer: optionLetters[newAnswerIndex],
    }
  })



function SoftDeleteModal({ itemName, onConfirm, onCancel }: { 
  itemName: string
  onConfirm: () => void
  onCancel: () => void 
}) {
  const [confirming, setConfirming] = useState(false)  

  const handleConfirm = () => {
    if (confirming) return          
    setConfirming(true)
    onConfirm()
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
        <div className='flex items-center gap-3 mb-3'>
          <img src="/delete.png" alt="deleteicon" className='w-7 h-7 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
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
  const { startTour } = useTour('generatedhistory', false, () => {}, () => {},user)
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

  const handleRetakeQuiz = (item: (typeof quizHistory)[number]) => {
    navigate('/studyGenerator/Quiz', {
      state: {
        items: shuffleQuizItems(item.items),
        mode: 'quiz' as const,
        fileName: item.fileName,
      },
    })
  }

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

      <div className='lg:p-3 '>
        <Sidebar />

      </div>
      <div className='flex-1 flex flex-col overflow-hidden'>

              {/* Top Bar — mobile only */}
        <div className='lg:hidden flex items-center justify-between px-4 sm:px-6 py-2 bg-white  top-0 left-0 right-0 z-10 relative'>
          <p className='absolute left-1/2 -translate-x-1/2 font-inter mt-4 font-semibold text-md text-[#B3B3B3] uppercase'>Generated History</p>
            <button
            id='tour-btn'
              onClick={() => startTour()}
              className='flex flex-col items-center gap-1 ml-auto pt-3
              hover:opacity-80 active:scale-95 transition-all'
              title='Take a Tour'
            >
              <div className='bg-white  pt-2 w-9 h-9 rounded-full  flex items-center justify-center text-2xl font-bold'>
              <img src="/needhelp.png" alt="?" className='w-9 block mx-auto mt-1 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
              </div>
              <p className='text-[9px] text-primary-600 lg:text-primary-600 md:text-primary-600 xl:text-primary-600 2xl:text-primary-600 font-inter font-medium '>Need Help?</p>
            </button>
        </div>
      <main  className="flex-1  w-full  overflow-auto p-2 px-5 md:px-7  md:py-0 md:pt-0 py-0  lg:p-2 lg:pt-2 2xl:pt-0  pt-1">
        <div className="min-h-screen  w-full flex flex-col">
            <p className='hidden lg:flex justify-center lg:justify-start w-full lg:pl-3 2xl:p-4  
            font-inter font-semibold text-sm md:text-md lg:text-[10px] xl:text-[12px] 2xl:text-[14px] text-[#B3B3B3] uppercase
            mt-2 md:mt-4 lg:mt-1 xl:mt-2 2xl:mt-3 '>Generated History</p>
          {/* Filters */}
          <div className='flex flex-row   lg:flex-row sm:items-center sm:justify-end gap-3 mb-6'>
            <select
            id='genTypeSelect'
              value={selectedGen}
              aria-label='Generation Type'
              onChange={(e) => { setSelectedGen(e.target.value); setSearchQuery('') }}
                className='w-40 border border-primary-800 rounded-md
                px-3 py-1 lg:py-auto lg:rounded-sm
                text-[10px] lg:text-[12px] xl:text-[13px] 2xl:text-[14px] 3xl:text-[19px]
                font-roboto text-primary-600
                focus:outline-none focus:ring-1 focus:ring-primary-600 bg-white cursor-pointer'
                >
              {genOption.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

           <div className="relative order-1 lg:order-2 flex items-center w-full lg:max-w-[180px] xl:max-w-[220px] 2xl:max-w-[260px]">
              <input
              id='genSearchBar'
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full border border-primary-800 rounded-md
                  py-2 pl-3 pr-8 
                  text-[10px] lg:text-[8px] xl:text-[10px] 2xl:text-[14px] 3xl:text-[17px]
                  font-inter text-primary-800 placeholder:text-primary-800
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                  transition-all duration-200"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute right-2 w-3.5 h-3.5 lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5 2xl:w-4 2xl:h-4 text-primary-800 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          {/* Recent label */}
          <div className='flex items-center  gap-3 mb-4 lg:ml-3.5 xl:ml-3 2xl:ml-4 3xl:ml-5 '>
            <p className='whitespace-nowrap lg:text-xs text-primary-600 font-semibold'>Recent</p>
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
            <div  id='genTable'  className='w-full'>

              {/* ── Quiz Table ── */}
              {selectedGen === 'Quiz' && (
                <>
                  <div  className='grid  grid-cols-[1.2fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr] gap-2 pb-3 lg:pb-2 border-b text-gray-500 text-xs font-medium lg:ml-3.5 xl:ml-3 2xl:ml-4 3xl:ml-5'>
                    <p className='lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>Name</p>
                    <p className='text-center lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>Score</p>
                    <p className='text-center lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>Items</p>
                    <p className='text-center lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>View</p>
                    <p className='text-center lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>Retake</p>
                    <p className='text-center lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>Delete</p>
                  </div>

                  {filteredQuiz.length === 0 ? (
                    <p className='text-gray-400 font-roboto text-center lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px] py-10'>No quiz history found.</p>
                  ) : (
                    filteredQuiz.map((item) => (
                      <div key={item.id} className='  py-2 lg:py-1 2xl:py-2 3xl:py-3 lg:ml-3.5 xl:ml-3 2xl:ml-4 3xl:ml-5'>
                        <div className='grid  grid-cols-[1.2fr_0.5fr_0.5fr_0.5fr_0.5fr_0.5fr] gap-x-2 gap-y-0 items-center'>
                          <div className='min-w-0'>
                            <p className='text-xs md:text-sm   lg:text-[10px] xl:text-[11px] 2xl:text-[15px] 3xl:text-[17px]  font-semibold text-primary-600 break-all leading-tight'>
                              {item.fileName}
                            </p>
                            <p className='text-xs  md:text-sm lg:text-[8px] xl:text-[9px] 2xl:text-[13px] 3xl:text-[15px] text-gray-400'>{formatDate(item.dateTaken)}</p>
                          </div>
                          <p className='text-center text-sm md:text-base lg:text-[13px] xl:text-[14px] 2xl:text-[14px] 3xl:text-[18px]  text-primary-600'>{item.score}</p>
                          <p className='text-center text-sm md:text-base lg:text-[13px] xl:text-[14px] 2xl:text-[14px] 3xl:text-[18px]  text-primary-600'>{item.total}</p>
                          <div  className='flex justify-center'>
                            <img
                            id='viewBtn'
                              src='/View.png'
                              alt='View'
                              className='lg:w-4 lg:h-4 2xl:w-5 2xl:h-5 3xl:w-6 3xl:h-6  w-5 h-5 cursor-pointer hover:opacity-70 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false}
                              onClick={() => handleViewQuiz(item)}
                            />
                          </div>
                          <div className='flex justify-center'>
                            <img
                            id='retakeBtn'
                              src='/Retake.png'
                              alt='Retake'
                              className='lg:w-4 lg:h-4 2xl:w-5 2xl:h-5 3xl:w-6 3xl:h-6  w-5 h-5 cursor-pointer hover:opacity-70 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false}
                              onClick={() => handleRetakeQuiz(item)}
                            />
                          </div>
                          <div className='flex justify-center'>
                          <img
                          id='deleteBtn'
                            src='/delete.png'
                            alt='Delete'
                            className={`lg:w-4 lg:h-4 2xl:w-5 2xl:h-5 3xl:w-6 3xl:h-6  w-5 h-5 transition select-none
                              ${isOnline ? 'cursor-pointer hover:opacity-70' : 'opacity-30 cursor-not-allowed'}`}onContextMenu={(e) => e.preventDefault()} draggable={false}
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
                  <div  className='grid lg:pb-2 grid-cols-[1.2fr_0.5fr_0.5fr_0.5fr] gap-2 pb-3 border-b text-gray-500 text-xs font-medium'>
                    <p className='lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>Name</p>
                    <p className='text-center lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>View</p>
                    <p className='text-center lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>Items</p>
                    <p className='text-center lg:text-[9px] xl:text-[11px] 2xl:text-[13px] 3xl:text-[15px]'>Delete</p>
                  </div>

                  {filteredFlashcard.length === 0 ? (
                    <p className='text-gray-400 font-roboto text-center py-10'>No flashcard history found.</p>
                  ) : (
                    filteredFlashcard.map((item) => (
                      <div key={item.id} className=' py-2 lg:py-1 2xl:py-2 3xl:py-3'>
                        <div className='grid grid-cols-[1.2fr_0.5fr_0.5fr_0.5fr] gap-2 items-center'>
                          <div className='min-w-0'>
                            <p className='text-xs md:text-sm lg:text-[10px] xl:text-[11px] 2xl:text-[15px] 3xl:text-[17px]  font-semibold text-primary-600 break-all leading-tight'>
                              {item.fileName}
                            </p>
                            <p className='text-xs  md:text-sm lg:text-[8px] xl:text-[9px] 2xl:text-[13px] 3xl:text-[15px] text-gray-400'>{formatDate(item.dateSaved)}</p>
                          </div>
                          <p className='text-center text-sm md:text-base lg:text-[13px] xl:text-[14px] 2xl:text-[14px] 3xl:text-[18px] text-primary-600'>{item.total}</p>
                          <div className='flex justify-center'>
                            <img
                            id='viewBtn'
                            
                              src='/View.png'
                              alt='View'
                              className='lg:w-4 lg:h-4 2xl:w-5 2xl:h-5 3xl:w-6 3xl:h-6  w-5 h-5 cursor-pointer hover:opacity-70 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false}
                              onClick={() => handleViewFlashcard(item)}
                            />
                          </div>
                          <div className='flex justify-center'>
                              <img
                              id='deleteBtn'
                                src='/delete.png'
                                alt='Delete'
                                className={`lg:w-4 lg:h-4 2xl:w-5 2xl:h-5 3xl:w-6 3xl:h-6  w-5 h-5 transition select-none
                                  ${isOnline ? 'cursor-pointer hover:opacity-70' : 'opacity-30 cursor-not-allowed'}`}  onContextMenu={(e) => e.preventDefault()} draggable={false}
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

          <button
            id='tour-btn'
            onClick={() => startTour(                             )}
            className='hidden lg:flex fixed bottom-6 right-6 z-50
            flex-col items-center gap-1
            hover:opacity-80 active:scale-95 transition-all
            lg:bottom-8 lg:right-8'
            title='Take a Tour'
          >
            <div className='w-7 h-7 lg:w-7 lg:h-7 2xl:w-10 2xl:h-10 3xl:w-12 3xl:h-12  flex items-center justify-center text-2xl font-bold'>
              <img src="/needhelp.png" alt="?" className='w-12 block mx-auto mt-1 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
            </div>  
            <p className='text-[8px] md:text-[8px] text-primary-800  uppercase text-center lg:text-[8px] 2xl:text-[10px] 3xl:text-[11px]
              font-inter font-semibold'>Need Help?</p>         
           </button>
      </main>
</div>

    </div>
  )
}

export default GeneratedHistory