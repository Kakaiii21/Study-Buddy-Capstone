import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'

interface QuizQuestion {
  question: string
  options: string[]
  answer: string
}

interface QuizViewState {
  items: QuizQuestion[]
  selectedAnswers: Record<number, string>
  score: number
  total: number
  fileName: string
  id?: string
}

const optionLetters = ['A', 'B', 'C', 'D']

function QuizView() {
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state as QuizViewState | null

  const [viewState] = useState<QuizViewState | null>(() => {
    if (state?.items) {
      sessionStorage.setItem('quizView_state', JSON.stringify(state))
      return state
    }
    try {
      const saved = sessionStorage.getItem('quizView_state')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  // Fallback guard — uses viewState, not state
  if (!viewState?.items || viewState.items.length === 0) {
    return (
      <div className='flex h-screen'>
        <Sidebar />
        <main className='flex-1 overflow-auto p-8 flex flex-col items-center justify-center'>
          <p className='text-primary-600 font-roboto font-bold text-xl mb-4'>No quiz data found.</p>
          <button
            className='bg-primary-600 text-white font-roboto px-6 py-2 rounded-md hover:bg-primary-500'
            onClick={() => {
              sessionStorage.removeItem('quizView_state')
              navigate('/history')
            }}
          >
            Back to History
          </button>
        </main>
      </div>
    )
  }

  const { items, selectedAnswers, score, total, fileName } = viewState

  const getOptionStyle = (qIndex: number, letter: string) => {
    const correct = items[qIndex].answer
    const userPicked = selectedAnswers?.[qIndex]
    if (letter === correct) return 'border-green-500 bg-green-50 text-green-700'
    if (letter === userPicked && letter !== correct) return 'border-red-400 bg-red-50 text-red-600'
    return 'border-gray-200 text-gray-400'
  }


  const handleBack = () => {
    sessionStorage.removeItem('quizView_state')
    navigate('/history')
  }

  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-4 md:p-8'>

        {/* Header */}
        <div className='flex flex-col md:flex-row lg:items-center w-full gap-3 mb-6 mt-4'>
          <p className='text-2xl md:ml-16 lg:ml-0 md:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
            Quiz Review
          </p>
          {fileName && (
            <span className='text-sm text-gray-400 font-roboto lg:ml-4 text-center lg:text-start'>
              from: {fileName}
            </span>
          )}
        </div>
        <hr className='w-full border-t border-primary-600 mb-6' />

        {/* Score Banner */}
        <div className='mb-6 px-6 py-4 bg-primary-50 border-2 border-primary-600 rounded-xl flex flex-row justify-between items-center'>
          <p className='text-primary-600 font-roboto font-bold text-lg md:text-xl'>
            Score: {score} / {total}
          </p>
          <p className='text-primary-600 font-roboto font-bold text-lg md:text-xl'>
            Mistakes: {total - score}
          </p>
        </div>

        {/* Legend */}
        <div className='flex flex-row gap-4 mb-6 px-1'>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded border-2 border-green-500 bg-green-50' />
            <span className='text-xs text-gray-500 font-roboto'>Correct answer</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded border-2 border-red-400 bg-red-50' />
            <span className='text-xs text-gray-500 font-roboto'>Your wrong answer</span>
          </div>
        </div>

        {/* Questions */}
        <div className='flex flex-col lg:mx-20 gap-8'>
          {items.map((q, qIndex) => {
            const userPicked = selectedAnswers?.[qIndex]
            const isCorrect = userPicked === q.answer

            return (
              <div
                key={qIndex}
                className={`flex flex-col border-2 py-2 px-5 rounded-xl ${
                  isCorrect ? 'border-primary-600' : 'border-red-400'
                }`}
              >
                <div className='flex flex-row items-start gap-2 pt-5 w-full'>
                  <p className='flex-1 text-sm md:text-xl text-primary-600 font-bold font-roboto'>
                    {qIndex + 1}. {q.question}
                  </p>
                  {!isCorrect && (
                    <span className='text-xs text-red-400 font-roboto whitespace-nowrap pt-1'>Wrong</span>
                  )}
                  {isCorrect && (
                    <span className='text-xs text-green-500 font-roboto whitespace-nowrap pt-1'>Correct</span>
                  )}
                </div>

                <div className='flex flex-col gap-3 mt-5 lg:ml-10 md:ml-10 pb-3'>
                  {q.options.map((option, oIndex) => {
                    const letter = optionLetters[oIndex]
                    return (
                      <div
                        key={oIndex}
                        className={`flex items-center gap-3 border-2 rounded-lg px-3 py-2 cursor-default ${getOptionStyle(qIndex, letter)}`}
                      >
                        <span className='w-4 h-4' />
                        <span className='text-xs md:text-xl lg:text-[18px]'>
                          {letter}) {option}
                        </span>
                        {letter === q.answer && (
                          <span className='ml-auto text-xs text-green-600 font-semibold'>✓ Correct</span>
                        )}
                        {letter === userPicked && letter !== q.answer && (
                          <span className='ml-auto text-xs text-red-500 font-semibold'>✗ Your answer</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                <p className='text-xs md:text-sm text-green-600 font-roboto font-semibold px-2 pb-3'>
                  ✓ Correct Answer: {q.answer}
                </p>
              </div>
            )
          })}

          {/* Action buttons */}
          <div className='flex flex-row ml-auto gap-4 mb-10'>
            <button
              className='hover:opacity-50 bg-gray-500 text-white py-2 font-roboto md:px-14 px-8 text-sm md:text-xl rounded-md uppercase'
              onClick={handleBack}
            >
              Back
            </button>

          </div>
        </div>

      </main>
    </div>
  )
}

export default QuizView