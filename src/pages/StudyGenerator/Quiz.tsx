import React, { useState } from 'react'
import Sidebar from '../../components/Sidebar'

function Quiz() {
    const [enabled, setEnabled] = useState(false)

  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-8 '>
          {/* ── Header ── */}
          <div className='flex flex-col md:flex-row lg:pl-0 md:pl-16 lg:flex-row lg:items-center w-full gap-3 mb-6'>
            <p className='text-3xl  md:text-4xl lg:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
              Quiz
            </p>
          </div>
          <hr className='w-full border-t border-primary-600 mb-6' />
          
          {/*Generated Quiz Area*/}
          <div className='flex flex-col lg:mx-20 gap-8'>
            {/*UI for Quizes*/}
            <div className='flex flex-col border-2 py-2 px-5 border-primary-600
            rounded-xl'>
              
              {/*number and Question*/}
              <div className='flex flex-row items-start gap-2  pt-5 w-full'>
                <p className='flex-1 text-sm md:text-xl lg:text-xl text-primary-600 font-bold font-roboto'>
                  1. Which of the following principles is most important for creating a user-friendly interface?
                </p>

                <button
                title='Edit'
                >
                  <img
                    className='w-2 h-4 md:w-2 md:h-6 lg:w-2 lg:h-6 object-contain'
                    src='/quizmenubtn.png'
                    alt='menubtn'
                  />
                </button>
              </div>
                          {/*Multiple Choices*/}
              <div className='flex flex-col gap-3 mt-5 lg:ml-10 md:ml-10 pb-5'>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input 
                  aria-label='A'
                  type="radio"
                  name='question1'
                  value='A'
                  className='w-4 h-4' />
                  <span className='text-xs md:text-xl lg:text-[18px] text-primary-600'>
                    A) Using as many colors as possible to attract attention.
                    </span>
                </label>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input 
                  aria-label='B'
                  type="radio"
                  name='question1'
                  value='B'
                  className='w-4 h-4' />
                  <span className='text-xs md:text-xl lg:text-[18px] text-primary-600'>
                    B) Ensuring consistency in layout, typography, and interactions.
                  </span>
                </label>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input 
                  aria-label='C'
                  type="radio"
                  name='question1'
                  value='C'
                  className='w-4 h-4' />
                  <span className='text-xs md:text-xl lg:text-[18px] text-primary-600'>
                    C) Adding as many features as possible on one screen.
                  </span>
                </label>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input 
                  aria-label='D'
                  type="radio"
                  name='question1'
                  value='D'
                  className='w-4 h-4' />
                  <span className='text-xs md:text-xl lg:text-[18px] text-primary-600'>
                    D) Making navigation hidden to reduce screen clutter.
                  </span>
                </label>
              </div>
            </div> 

                        {/*UI for Quizes*/}
            <div className='flex flex-col border-2 py-2 px-5 border-primary-600
            rounded-xl'>
              
              {/*number and Question*/}
              <div className='flex flex-row items-start gap-2  pt-5 w-full'>
                <p className='flex-1 text-sm md:text-xl lg:text-xl text-primary-600 font-bold font-roboto'>
                  2. Which of the following principles is most important for creating a user-friendly interface?
                </p>

                <button
                title='Edit'
                >
                  <img
                    className='w-2 h-4 md:w-2 md:h-6 lg:w-2 lg:h-6 object-contain'
                    src='/quizmenubtn.png'
                    alt='menubtn'
                  />
                </button>
              </div>
                          {/*Multiple Choices*/}
              <div className='flex flex-col gap-3 mt-5 lg:ml-10 md:ml-10 pb-5'>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input 
                  aria-label='A'
                  type="radio"
                  name='question2'
                  value='A'
                  className='w-4 h-4' />
                  <span className='text-xs md:text-xl lg:text-[18px] text-primary-600'>
                    A) Using as many colors as possible to attract attention.
                    </span>
                </label>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input 
                  aria-label='B'
                  type="radio"
                  name='question2'
                  value='B'
                  className='w-4 h-4' />
                  <span className='text-xs md:text-xl lg:text-[18px] text-primary-600'>
                    B) Ensuring consistency in layout, typography, and interactions.
                  </span>
                </label>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input 
                  aria-label='C'
                  type="radio"
                  name='question2'
                  value='C'
                  className='w-4 h-4' />
                  <span className='text-xs md:text-xl lg:text-[18px] text-primary-600'>
                    C) Adding as many features as possible on one screen.
                  </span>
                </label>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input 
                  aria-label='D'
                  type="radio"
                  name='question2'
                  value='D'
                  className='w-4 h-4' />
                  <span className='text-xs md:text-xl lg:text-[18px] text-primary-600'>
                    D) Making navigation hidden to reduce screen clutter.
                  </span>
                </label>
              </div>
            </div> 
            
                        {/*UI for Quizes*/}
            <div className='flex flex-col border-2 py-2 px-5 border-primary-600
            rounded-xl'>
              
              {/*number and Question*/}
              <div className='flex flex-row items-start gap-2  pt-5 w-full'>
                <p className='flex-1 text-sm md:text-xl lg:text-xl text-primary-600 font-bold font-roboto'>
                  3. Which of the following principles is most important for creating a user-friendly interface?
                </p>

                <button
                title='Edit'
                >
                  <img
                    className='w-2 h-4 md:w-2 md:h-6 lg:w-2 lg:h-6 object-contain'
                    src='/quizmenubtn.png'
                    alt='menubtn'
                  />
                </button>
              </div>
                          {/*Multiple Choices*/}
              <div className='flex flex-col gap-3 mt-5 lg:ml-10 md:ml-10 pb-5'>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input 
                  aria-label='A'
                  type="radio"
                  name='question3'
                  value='A'
                  className='w-4 h-4' />
                  <span className='text-xs md:text-xl lg:text-[18px] text-primary-600'>
                    A) Using as many colors as possible to attract attention.
                    </span>
                </label>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input 
                  aria-label='B'
                  type="radio"
                  name='question3'
                  value='B'
                  className='w-4 h-4' />
                  <span className='text-xs md:text-xl lg:text-[18px] text-primary-600'>
                    B) Ensuring consistency in layout, typography, and interactions.
                  </span>
                </label>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input 
                  aria-label='C'
                  type="radio"
                  name='question3'
                  value='C'
                  className='w-4 h-4' />
                  <span className='text-xs md:text-xl lg:text-[18px] text-primary-600'>
                    C) Adding as many features as possible on one screen.
                  </span>
                </label>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <input 
                  aria-label='D'
                  type="radio"
                  name='question3'
                  value='D'
                  className='w-4 h-4' />
                  <span className='text-xs md:text-xl lg:text-[18px] text-primary-600'>
                    D) Making navigation hidden to reduce screen clutter.
                  </span>
                </label>
              </div>
            </div> 
            
            {/*Save Toggle*/}
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
              <p className='text-xs md:text-sm font-semibold text-primary-600'>SAVE GENERATED</p>
            </div>

            {/*Discard and Submit*/}
            <div className='flex flex-row  ml-auto gap-4'>
              <button className='flex hover:opacity-50 bg-gray-500 text-white 
              py-2 font-roboto md:px-14 px-8 text-sm rounded-md md:text-xl uppercase'>Discard</button>

              <button className='flex hover:opacity-50 bg-primary-600 text-white 
              py-2 font-roboto md:px-14 px-8 text-sm rounded-md md:text-xl uppercase'>submit</button>
            </div>

          </div>
      </main>
    </div>
  )
}

export default Quiz