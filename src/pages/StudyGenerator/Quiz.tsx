import  { useState, useRef ,useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { SESSION_KEY_RESULT } from '../StudyGenerator'
import { auth, db } from '../../services/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

interface QuizQuestion {
  question: string
  options: string[]
  answer: string
}

interface ResultState {
  items: QuizQuestion[]
  mode: 'quiz'
  fileName: string
}

function loadResult(locationState: unknown): ResultState | null {
  const state = locationState as ResultState | null
  if (state?.items && state.mode === 'quiz') return state
  try {
    const saved = sessionStorage.getItem(SESSION_KEY_RESULT)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.mode === 'quiz') return parsed as ResultState
    }
  } catch {/**/}
  return null
}

function loadPersistedQuizState() {
  try {
    const selected = sessionStorage.getItem('quiz_selected')
    const attempted = sessionStorage.getItem('quiz_attempted')
    const questions = sessionStorage.getItem('quiz_questions')
    return {
      savedSelected: selected ? JSON.parse(selected) : {},
      savedAttempted: attempted === 'true',
      savedQuestions: questions ? JSON.parse(questions) : null,
    }
  } catch {
    return { savedSelected: {}, savedAttempted: false, savedQuestions: null }
  }
}

function clearQuizSession() {
  sessionStorage.removeItem('quiz_selected')
  sessionStorage.removeItem('quiz_attempted')
  sessionStorage.removeItem('quiz_questions')
}

function Quiz() {
  const questionRefs = useRef<(HTMLDivElement | null)[]>([])
  const location = useLocation()
  const navigate = useNavigate()

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  // useRef so result never goes null on re-renders
  const [result] = useState<ResultState | null>(() => loadResult(location.state))

  const [selected, setSelected] = useState<Record<number, string>>(
    () => loadPersistedQuizState().savedSelected
  )
  const [attempted, setAttempted] = useState<boolean>(
    () => loadPersistedQuizState().savedAttempted
  )
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    () => loadPersistedQuizState().savedQuestions ?? result?.items ?? []
  )

  const [enabled, setEnabled] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<QuizQuestion | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [finalScore, setFinalScore] = useState(0)

      useEffect(() => {
      if (submitted) return
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = ''
      }
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [submitted])

      const handleDiscardAttempt = () => {
        setShowLeaveConfirm(true)
      }

  // Guard: only trigger if result was never available (not when session is cleared mid-quiz)
    if (!result?.items || result.items.length === 0) {
          return (
          <div className='flex h-screen'>
          <div className='flex bg-gray-600 h-screen w-16'></div>

            <Sidebar quizActive={!submitted} />
            <main className='flex-1 overflow-auto p-8 flex flex-col items-center justify-center'>
              <p className='text-primary-600 font-roboto font-bold text-xl mb-4'>No quiz data found.</p>
              <button
                className='bg-primary-600 text-white font-roboto px-6 py-2 rounded-md hover:bg-primary-500'
                onClick={() => navigate('/studyGenerator')}
              >
                Go Back
              </button>
            </main>
          </div>
        )
      }


  const optionLetters = ['A', 'B', 'C', 'D']
  const allAnswered = questions.every((_, i) => selected[i] !== undefined)

  const saveQuestions = (updated: QuizQuestion[]) => {
    setQuestions(updated)
    sessionStorage.setItem('quiz_questions', JSON.stringify(updated))
  }

  const getScore = () =>
    questions.reduce((score, q, i) => score + (selected[i] === q.answer ? 1 : 0), 0)

  const getOptionStyle = (qIndex: number, letter: string) => {
    if (!submitted) {
      return selected[qIndex] === letter
        ? 'border-primary-600 bg-primary-50'
        : 'border-gray-200 hover:border-primary-400'
    }
    const correct = questions[qIndex].answer
    if (letter === correct) return 'border-green-500 bg-green-50 text-green-700'
    if (letter === selected[qIndex] && letter !== correct) return 'border-red-400 bg-red-50 text-red-600'
    return 'border-gray-200 text-gray-400'
  }

  const getCardBorderStyle = (qIndex: number) => {
    if (submitted) return 'border-primary-600'
    if (attempted && selected[qIndex] === undefined) return 'border-red-400'
    return 'border-primary-600'
  }

  const handleSubmit = async () => {
    if (!allAnswered) {
      setAttempted(true)
      sessionStorage.setItem('quiz_attempted', 'true')
      const firstUnanswered = questions.findIndex((_, i) => selected[i] === undefined)
      if (firstUnanswered !== -1) {
        questionRefs.current[firstUnanswered]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
      return
    }

    const score = getScore()
    setFinalScore(score)
    setSubmitted(true)
    // Do NOT clearQuizSession here — guard relies on result ref, not session

    if (enabled) {
      const user = auth.currentUser
      if (user) {
        setSaving(true)
        setSaveError(null)
        try {
          await addDoc(collection(db, 'users', user.uid, 'quizHistory'), {
            fileName: result.fileName ?? 'Untitled',
            score,
            total: questions.length,
            dateTaken: serverTimestamp(),
            items: questions,
            selectedAnswers: selected,
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

  const handleDiscard = () => {
    sessionStorage.removeItem(SESSION_KEY_RESULT)
    clearQuizSession()
    navigate('/studyGenerator')
  }

  const shuffleArray = <T,>(arr: T[]): T[] =>
    [...arr].sort(() => Math.random() - 0.5)

  const shuffleQuestions = (qs: QuizQuestion[]): QuizQuestion[] =>
    shuffleArray(qs).map(q => {
      const shuffledOptions = shuffleArray(q.options)
      const newAnswerIndex = shuffledOptions.indexOf(q.options[optionLetters.indexOf(q.answer)])
      return {
        ...q,
        options: shuffledOptions,
        answer: optionLetters[newAnswerIndex],
      }
    })

  const handleRetake = () => {
    setShowModal(false)
    setSubmitted(false)
    setSelected({})
    setAttempted(false)
    setFinalScore(0)
    setSaveError(null)
    setQuestions(shuffleQuestions(questions))
    clearQuizSession()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOk = () => {
    sessionStorage.removeItem(SESSION_KEY_RESULT)
    clearQuizSession()
    navigate('/studyGenerator')
  }

  const handleDelete = (qIndex: number) => {
    const updated = questions.filter((_, i) => i !== qIndex)
    saveQuestions(updated)
    setOpenMenuIndex(null)

    const updatedSelected: Record<number, string> = {}
    Object.entries(selected).forEach(([key, val]) => {
      const k = parseInt(key)
      if (k < qIndex) updatedSelected[k] = val
      else if (k > qIndex) updatedSelected[k - 1] = val
    })
    setSelected(updatedSelected)
    sessionStorage.setItem('quiz_selected', JSON.stringify(updatedSelected))
  }

  const handleEditOpen = (qIndex: number) => {
    setEditIndex(qIndex)
    setEditDraft({ ...questions[qIndex] })
    setOpenMenuIndex(null)
  }

  const handleEditSave = () => {
    if (editDraft && editIndex !== null) {
      const updated = questions.map((q, i) => i === editIndex ? editDraft : q)
      saveQuestions(updated)
    }
    setEditIndex(null)
    setEditDraft(null)
  }

  const handleEditCancel = () => {
    setEditIndex(null)
    setEditDraft(null)
  }



  return (
    <div className='flex h-screen'>
      <div className='flex bg-gray-600 h-screen w-16'></div>

     <Sidebar quizActive={!submitted} />
      <main className='flex-1 overflow-auto p-8'>

        <div className='flex flex-col md:flex-row lg:items-center w-full gap-3 mb-6'>
          <p className='text-3xl md:text-4xl lg:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
            Quiz
          </p>
          {result.fileName && (
            <span className='text-sm text-gray-400 font-roboto lg:ml-4'>from: {result.fileName}</span>
          )}
        </div>
        <hr className='w-full border-t border-primary-600 mb-6' />

        {submitted && (
          <div className='mb-6 px-6 py-4 bg-primary-50 border-2 border-primary-600 rounded-xl text-center'>
            <p className='text-primary-600 font-roboto font-bold text-xl'>
              Your Score: {finalScore} / {questions.length}
            </p>
          </div>
        )}

        <div className='flex flex-col lg:mx-20 gap-8'>
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              ref={(el) => void (questionRefs.current[qIndex] = el)}
              className={`flex flex-col border-2 py-2 px-5 rounded-xl transition ${getCardBorderStyle(qIndex)}`}
            >
              <div className='flex flex-row items-start gap-2 pt-5 w-full'>
                <p className='flex-1 text-sm md:text-xl lg:text-xl text-primary-600 font-bold font-roboto'>
                  {qIndex + 1}. {q.question}
                </p>

                {attempted && !submitted && selected[qIndex] === undefined && (
                  <span className='text-xs text-red-400 font-roboto whitespace-nowrap pt-1'>
                    Not answered
                  </span>
                )}

                {!submitted && (
                  <div className='relative ml-2'>
                    <button
                      onClick={() => setOpenMenuIndex(openMenuIndex === qIndex ? null : qIndex)}
                      className='text-primary-600 hover:text-primary-800 text-3xl'
                      title='EDIT/DELETE'
                    >
                      ⋮
                    </button>

                    {openMenuIndex === qIndex && (
                      <div className='absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg w-32 overflow-hidden'>
                        <button
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => handleEditOpen(qIndex)}
                          className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                        >
                          <img className='w-5 h-5' src='/edit.png' alt='edit icon' />Edit
                        </button>
                        <hr className='my-1 border-gray-100' />
                        <button
                          onClick={() => handleDelete(qIndex)}
                          className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-red-50 font-semibold'
                        >
                          <img src='/delete.png' alt='delete icon' className='w-5 h-5' />Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {editIndex === qIndex && editDraft ? (
                <div className='flex flex-col gap-3 mt-4 pb-4'>
                  <label className='text-xs text-gray-500 font-roboto'>Question</label>
                  <input
                    aria-label='Edit question'
                    className='border border-gray-300 rounded-lg px-3 py-2 text-sm font-roboto focus:outline-none focus:border-primary-600'
                    value={editDraft.question}
                    onChange={(e) => setEditDraft({ ...editDraft, question: e.target.value })}
                  />

                  {editDraft.options.map((opt, oIndex) => (
                    <div key={oIndex} className='flex items-center gap-2'>
                      <span className='text-xs font-bold text-primary-600 w-5'>
                        {optionLetters[oIndex]}
                      </span>
                      <input
                        aria-label={`Edit option ${optionLetters[oIndex]}`}
                        className='flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-roboto focus:outline-none focus:border-primary-600'
                        value={opt}
                        onChange={(e) => {
                          const updatedOptions = editDraft.options.map((o, i) =>
                            i === oIndex ? e.target.value : o
                          )
                          setEditDraft({ ...editDraft, options: updatedOptions })
                        }}
                      />
                      {editDraft.answer === optionLetters[oIndex] && (
                        <span className='text-xs text-green-500 whitespace-nowrap'>✓ Correct</span>
                      )}
                    </div>
                  ))}

                  <div className='flex items-center gap-2'>
                    <label className='text-xs text-gray-500 font-roboto'>Correct answer:</label>
                    <select
                      aria-label='Select correct answer'
                      className='border border-gray-300 rounded-lg px-3 py-1 text-sm font-roboto focus:outline-none focus:border-primary-600'
                      value={editDraft.answer}
                      onChange={(e) => setEditDraft({ ...editDraft, answer: e.target.value })}
                    >
                      {optionLetters.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

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
                <div className='flex flex-col gap-3 mt-5 lg:ml-10 md:ml-10 pb-5'>
                  {q.options.map((option, oIndex) => {
                    const letter = optionLetters[oIndex]
                    return (
                      <label
                        key={oIndex}
                        className={`flex items-center gap-3 border-2 rounded-lg px-3 py-2 transition
                          ${getOptionStyle(qIndex, letter)}
                          ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <input
                          type='radio'
                          name={`question${qIndex}`}
                          value={letter}
                          className='w-4 h-4'
                          disabled={submitted}
                          checked={selected[qIndex] === letter}
                          onChange={() => {
                            const updated = { ...selected, [qIndex]: letter }
                            setSelected(updated)
                            sessionStorage.setItem('quiz_selected', JSON.stringify(updated))
                          }}
                          aria-label={letter}
                        />
                        <span className='text-xs md:text-xl lg:text-[18px]'>
                          {letter}) {option}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}

              {submitted && (
                <p className='text-xs md:text-sm text-green-600 font-roboto font-semibold px-5 pb-3'>
                  ✓ Correct Answer: {questions[qIndex].answer}
                </p>
              )}
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

          <div className='flex flex-row ml-auto gap-4 mb-10 items-center'>
            {attempted && !submitted && !allAnswered && (
              <p className='text-xs text-gray-400 font-roboto'>
                Answer all questions to submit
              </p>
            )}
            <button
              className='hover:opacity-50 bg-gray-500 text-white py-2 font-roboto md:px-14 px-8 text-sm rounded-md md:text-xl uppercase'
                onClick={submitted ? handleDiscard : handleDiscardAttempt}
            >
              Discard
            </button>
            <button
              className='hover:opacity-50 bg-primary-600 text-white py-2 font-roboto md:px-14 px-8 text-sm rounded-md md:text-xl uppercase disabled:opacity-40'
              onClick={handleSubmit}
              disabled={submitted}
            >
              Submit
            </button>
          </div>
        </div>
      </main>

      {/* ── Result Modal ───────────────────────────────────────────────────── */}
      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 lg:pb-16 lg:pt-10 flex flex-col items-center gap-10'>

            {enabled ? (
              /* ── SAVED STATE ── */
              <>
                <div className='flex flex-col text-center gap-3'>
                  <p className='text-primary-600 font-roboto font-bold text-4xl uppercase'>
                    Quiz Result
                  </p>
                  <p className='text-primary-600 font-roboto text-center text-sm'>
                    This quiz has been saved. You can view it in Generated History.
                  </p>
                </div>
                <div>
                  <img src='/Saved.png' alt='Saved' className='w-32 h-32' />
                </div>
              </>
            ) : (
              /* ── NOT SAVED STATE ── */
              <>
                <div className='flex flex-col text-center gap-3'>
                  <p className='text-primary-600 font-roboto font-bold text-4xl uppercase'>
                    Quiz Result
                  </p>
                  <p className='text-primary-600 font-roboto text-center text-sm'>
                    This quiz was not saved. It cannot be viewed again.
                  </p>
                </div>
                <div>
                  <img src='/notSaved.png' alt='Not Saved' className='w-32 h-32' />
                </div>
              </>
            )}

            <div className='flex flex-row justify-between w-full lg:px-8 px-2'>
              <p className='lg:text-xl text-xl font-semibold text-primary-600 font-roboto'>
                Score: {finalScore}/{questions.length}
              </p>
              <p className='lg:text-xl text-xl font-semibold text-primary-600 font-roboto'>
                Mistakes: {questions.length - finalScore}
              </p>
            </div>

            {saving && (
              <p className='text-xs text-gray-400 font-roboto text-center'>Saving...</p>
            )}
            {saveError && (
              <p className='text-xs text-red-500 font-roboto text-center'>{saveError}</p>
            )}

            <div className='flex flex-row w-full gap-3'>
              <button
                onClick={handleRetake}
                className='flex-1 border-2 border-primary-600 text-primary-600 font-roboto py-2.5 rounded-lg hover:bg-primary-50 transition uppercase font-semibold text-md'
              >
                Retake
              </button>
              <button
                onClick={handleOk}
                className='flex-1 bg-primary-600 text-white font-roboto py-2.5 rounded-lg hover:opacity-80 transition uppercase font-semibold text-md'
              >
                OK
              </button>
            </div>

          </div>
        </div>
      )}

      {showLeaveConfirm && (
        <div className='fixed inset-0 z-[70] flex items-center justify-center bg-black/50'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-6'>
            <p className='text-xl font-bold text-primary-600 uppercase text-center font-roboto'>
              Leave Quiz?
            </p>
            <p className='text-sm text-gray-500 text-center'>
              Your progress will be lost if you leave. Are you sure you want to discard this quiz?
            </p>
            <div className='flex gap-4 w-full'>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50 font-roboto uppercase'
              >
                Keep Going
              </button>
              <button
                onClick={() => { setShowLeaveConfirm(false); handleDiscard() }}
                className='flex-1 bg-red-500 text-white font-bold py-2 rounded-md hover:bg-red-600 font-roboto uppercase'
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Quiz