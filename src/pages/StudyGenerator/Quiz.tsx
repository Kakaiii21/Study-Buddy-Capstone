import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { SESSION_KEY_RESULT } from '../StudyGenerator'

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

function Quiz() {
  const location = useLocation()
  const navigate = useNavigate()

  const result = loadResult(location.state)

  const [enabled, setEnabled] = useState(false)
  const [selected, setSelected] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

if (!result?.items || result.items.length === 0) {
  // 👇 Clear bad session data so Go Back actually works
  sessionStorage.removeItem(SESSION_KEY_RESULT)

  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-8 flex flex-col items-center justify-center'>
        <p className='text-primary-600 font-roboto font-bold text-xl mb-4'>No flashcard data found.</p>
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

  const questions = result.items
  const optionLetters = ['A', 'B', 'C', 'D']

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

  const handleDiscard = () => {
    sessionStorage.removeItem(SESSION_KEY_RESULT)
    navigate('/studyGenerator')
  }

  return (
    <div className='flex h-screen'>
      <Sidebar />
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
              Your Score: {getScore()} / {questions.length}
            </p>
          </div>
        )}

        <div className='flex flex-col lg:mx-20 gap-8'>
          {questions.map((q, qIndex) => (
            <div key={qIndex} className='flex flex-col border-2 py-2 px-5 border-primary-600 rounded-xl'>
              <div className='flex flex-row items-start gap-2 pt-5 w-full'>
                <p className='flex-1 text-sm md:text-xl lg:text-xl text-primary-600 font-bold font-roboto'>
                  {qIndex + 1}. {q.question}
                </p>
              </div>

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
                        onChange={() => setSelected((prev) => ({ ...prev, [qIndex]: letter }))}
                        aria-label={letter}
                      />
                      <span className='text-xs md:text-xl lg:text-[18px]'>
                        {letter}) {option}
                      </span>
                    </label>
                  )
                })}
              </div>

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

          <div className='flex flex-row ml-auto gap-4 mb-10'>
            <button
              className='hover:opacity-50 bg-gray-500 text-white py-2 font-roboto md:px-14 px-8 text-sm rounded-md md:text-xl uppercase'
              onClick={handleDiscard}
            >
              Discard
            </button>
            <button
              className='hover:opacity-50 bg-primary-600 text-white py-2 font-roboto md:px-14 px-8 text-sm rounded-md md:text-xl uppercase disabled:opacity-40'
              onClick={() => setSubmitted(true)}
              disabled={submitted}
            >
              Submit
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Quiz