import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import StudyTimer from '../components/StudyTimer'

function Dashboard() {
  const [showTimer, setShowTimer] = useState(false)
  const navigate = useNavigate()

  const activities = [
    { label: 'To Do List', icon: '/ToDo.png', path: '/todolist' },
    { label: 'Notes', icon: '/Notes.png', path: '/notes' },
    { label: 'Class Schedule', icon: '/ClassSched.png', path: '/schedule' },
    { label: 'Courses', icon: '/Courses.png', path: '/courses' },
    { label: 'Quiz', icon: '/Quizes.png', path: '/quiz' },
    { label: 'Flashcard', icon: '/Flashcards.png', path: '/flashcard' },
  ]

  return (
    <body className='bg-white'>
      
    <div className='flex h-screen'>
      <Sidebar />

      <div className='flex-1 flex flex-col '>

        {/* Top Bar — mobile only */}
        <div className='lg:hidden flex items-center justify-between px-4 py-2 bg-white fixed top-0 left-0 right-0 z-10'>
          <div className='w-10' />

          <button
            onClick={() => setShowTimer(!showTimer)}
            className='flex flex-col items-center gap-1 px-2 py-1'
          >
            <img src='/timer.png' alt='timer' className='w-10 h-10' />
            <span className='text-xs text-primary-600 font-bold'>
              {showTimer ? 'Hide Timer' : 'Timer'}
            </span>
          </button>
        </div>

        {/* Main Content */}
        <main className='flex flex-1 lg:mx-2 lg:my-10 overflow-y-auto min-h-screen mt-16 lg:mt-0'>

          {/* Main Col */}
          <div className='flex-[3] min-h-screen bg-white   px-2'>

            {/* Welcome Banner */}
            <div className='lg:px-20 mt-8 mb-6 mx-8 bg-primary-600 p-6 rounded-xl'>
              <div className='flex items-center justify-between'>
                <div className='flex flex-col text-left'>
                  <h1 className='font-orbitron text-white text-xl sm:text-2xl font-bold'>
                    Welcome, Kai
                  </h1>
                  <p className='font-orbitron text-white text-sm sm:text-base'>
                    Start your day by being productive.
                  </p>
                </div>
                <img
                  className='h-20 w-20 sm:h-28 sm:w-28 rounded-full object-cover border-2 border-white bg-white'
                  src="/profile.png"
                  alt="Profile"
                />
              </div>
            </div>

            {/* Header */}
            <div className='mx-8 my-8 mt-10'>
              <div className='flex items-center gap-3'>
                <span className='text-md font-bold text-primary-600 tracking-widest uppercase'>
                  Dashboard
                </span>
                <div className='flex-1 h-0.5 bg-primary-100' />
              </div>
            </div>

            {/* Stats Row */}
            <div className='grid grid-cols-2 lg:grid-cols-5 gap-2 mx-6 mb-6'>

              {/* Time — spans 2 on lg */}
              <div className='col-span-1 lg:col-span-2 lg:justify-center p-3 border-2 border-primary-600 rounded-xl flex items-center gap-3'>
                <img
                  src="/currentTime.png"
                  alt="Timer"
                  className='h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0'
                />
                <div className='flex flex-col'>
                  <p className='lg:text-sm  text-xs font-bold text-primary-600'>Current Time Spent</p>
                  <p className='text-md sm:text-xl font-orbitron font-bold text-primary-600'>
                    00:00:00
                  </p>
                </div>
              </div>

              {/* Score — spans 2 on lg */}
              <div className='col-span-1 lg:col-span-2 lg:justify-center p-3 border-2 border-primary-600 rounded-xl flex items-center gap-3'>
                <img
                  src="/currentScore.png"
                  alt="Score"
                  className='h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0'
                />
                <div className='flex flex-col'>
                  <p className='text-sm font-bold text-primary-600'>Current Score</p>
                  <p className='text-md sm:text-2xl font-bold text-primary-600'>00/00</p>
                </div>
              </div>

              {/* History */}
              <button
                onClick={() => navigate('/history')}
                className='col-span-2 lg:col-span-1 p-3 border-2 border-primary-600 rounded-xl flex flex-col items-center justify-center gap-2'
              >
                <img src="/genHistory.png" alt="history" className='w-8 h-8' />
                <span className='text-sm font-bold text-primary-600 text-center'>
                  Generated History
                </span>
              </button>

            </div>

            {/* Activities Header */}
            <div className='mx-8 my-8'>
              <div className='flex items-center gap-3'>
                <span className='text-md font-bold text-primary-600 tracking-widest uppercase'>
                  Activities
                </span>
                <div className='flex-1 h-0.5 bg-primary-100' />
              </div>
            </div>

            {/* Activities */}
            <div className='flex justify-center pb-8'>
              <div className='grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-x-28 lg:max-w-3xl'>
                {activities.map((activity) => (
                  <button
                    key={activity.path}
                    onClick={() => navigate(activity.path)}
                    className='flex flex-col items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 lg:py-4 lg:w-56 border-2 border-primary-600 rounded-xl hover:bg-primary-50'
                  >
                    <img
                      src={activity.icon}
                      alt={activity.label}
                      className='w-full h-12 sm:h-16 lg:h-24 object-contain'
                    />

                    <div className='border w-full border-primary-600'></div>

                    <span className='text-xs lg:text-sm font-bold text-primary-600 tracking-widest uppercase text-center'>
                      {activity.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Timer Panel */}
          <div className={`
            fixed top-0 right-0 h-full w-80 bg-white border-l shadow-lg z-40
            transition-transform duration-300
            ${showTimer ? 'translate-x-0' : 'translate-x-full'}
            lg:translate-x-0 lg:static lg:flex lg:flex-[1] lg:shadow-none
          `}>
            <StudyTimer />
          </div>

        </main>
      </div>
    </div>
        </body>

  )
}

export default Dashboard