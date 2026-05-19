import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { SESSION_KEY_RESULT } from '../StudyGenerator'

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

function Flashcard() {
  const location = useLocation()
  const navigate = useNavigate()

  const result = loadResult(location.state)

  const [enabled, setEnabled] = useState(false)
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})

  const toggleCard = (index: number) =>
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }))

  const handleDiscard = () => {
    sessionStorage.removeItem(SESSION_KEY_RESULT)
    navigate('/studyGeneratos')
  }

  if (!result?.items || result.items.length === 0) {
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

  const cards = result.items

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
              <div className='perspective flex-1 lg:mx-20 md:mx-10'>
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
              onClick={() => alert('Saved!')}
            >
              Submit
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Flashcard