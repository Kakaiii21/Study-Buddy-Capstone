import React, { useState } from 'react'
import Sidebar from '../../components/Sidebar'

function Flashcard() {
  const [enabled, setEnabled] = useState(false)

  const cards = [
    {
      term: "Operating System",
      def: "System software that manages hardware and applications."
    },
    {
      term: "Computer System",
      def: "A collection of interconnected devices and software."
    }
  ]

  // initialize all cards as not flipped
  const [flipped, setFlipped] = useState(
    Object.fromEntries(cards.map((_, i) => [i, false]))
  )

    const toggleCard = (index: number) => {
      setFlipped(prev => ({
        ...prev,
        [index]: !prev[index]
      }))
    }
  return (
    <div className='flex h-screen'>
      <Sidebar />

      <main className='flex-1 overflow-auto p-8'>

        {/* Header */}
        <div className='flex flex-col md:flex-row lg:items-center w-full gap-3 mb-6'>
          <p className='text-3xl md:ml-10 lg:ml-0 md:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
            Flashcards
          </p>
        </div>

        <hr className='w-full border-t border-primary-600 mb-6' />

        {/* Flashcards */}
        <div className='flex flex-col  lg:mx-20 gap-8 md:mx-10'>

          {cards.map((card, index) => (
            <div key={index} className="flex justify-center">

              <div className="perspective flex-1 lg:mx-20 md:mx-10">
                <div
                  onClick={() => toggleCard(index)}
                  className={`relative w-full h-56 cursor-pointer duration-500 transform-style preserve-3d
                  ${flipped[index] ? 'rotate-y-180' : ''}`}
                >

                  {/* FRONT */}
                  <div className="absolute w-full h-full backface-hidden flex items-center justify-center
                    bg-primary-600 border-2 border-primary-600 rounded-xl px-5">

                    <div className="flex flex-col text-center">
                      <p className="text-white text-xl font-bold uppercase">
                        {card.term}
                      </p>
                      <p className="text-white text-sm">
                        Click to view definition
                      </p>
                    </div>

                  </div>

                  {/* BACK */}
                  <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center
                    bg-white border-2 border-primary-600 rounded-xl px-5">

                    <p className="text-primary-600 text-center font-medium">
                      {card.def}
                    </p>

                  </div>

                </div>
              </div>

            </div>
          ))}

          {/* Save Toggle */}
          <div className='flex flex-row justify-start items-center gap-3'>
            <button
              aria-label={enabled ? 'Disable save generated' : 'Enable save generated'}
              onClick={() => setEnabled(!enabled)}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition
                ${enabled ? 'bg-green-500' : 'bg-gray-400'}`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition
                  ${enabled ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>

            <p className='text-xs md:text-sm font-semibold text-primary-600'>
              SAVE GENERATED
            </p>
          </div>

          {/* Buttons */}
          <div className='flex flex-row ml-auto gap-4'>
            <button className='hover:opacity-50 bg-gray-500 text-white py-2 md:px-14 px-8 text-sm md:text-xl rounded-md uppercase'>
              Discard
            </button>

            <button className='hover:opacity-50 bg-primary-600 text-white py-2 md:px-14 px-8 text-sm md:text-xl rounded-md uppercase'>
              Submit
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}

export default Flashcard