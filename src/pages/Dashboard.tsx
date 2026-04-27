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
    <div className='flex h-screen'>
      <Sidebar />

      <div className='flex-1 flex flex-col'>

        {/* Top Bar — mobile only */}
        <div className='lg:hidden flex items-center justify-between px-4 py-2 bg-white fixed top-0 left-0 right-0 z-10 '>
          <div className='w-10' />

          {/* Timer toggle button */}
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
        <main className='flex flex-1 overflow-y-auto mt-14 lg:mt-0'>

          {/* Main Col */}
          <div className='flex-[3] bg-white p-4'>

            {/* Welcome Banner */}
            <div className='lg:px-20 mt-4 mb-6 mx-8 bg-primary-600 p-6 rounded-xl'>
              <div className='flex items-center justify-between'>
                <div className='flex flex-col'>
                  <h1 className='font-orbitron text-white text-xl sm:text-2xl font-bold tracking-wide'>
                    Welcome, Kai
                  </h1>
                  <p className='font-orbitron text-white text-sm sm:text-base'>
                    Start your day by being productive.
                  </p>
                </div>
                <img
                  className='h-20 w-20 sm:h-28 sm:w-28 rounded-full object-cover border-2 border-white'
                  src="/profile.png"
                  alt="Profile"
                />
              </div>
            </div>

            {/* Dashboard Section Header */}
            <div className='mx-8 my-8 mt-10'>
              <div className='flex items-center gap-3'>
                <span className='text-md font-roboto font-bold text-primary-600 tracking-widest uppercase whitespace-nowrap'>
                  Dashboard
                </span>
                <div className='flex-1 h-0.5 bg-primary-100' />
              </div>
            </div>

            {/* Stats Row */}
            <div className='flex flex-wrap gap-2 mx-8 mb-6'>

              {/* Current Time Spent */}
            <div className='flex-[2] min-w-[140px] p-3 border-2 border-primary-600 rounded-xl'>
              <div className='flex flex-col sm:flex-row items-center gap-3 justify-center text-center sm:text-left'>
                
                <img 
                  src="/currentTime.png" 
                  alt="Timer" 
                  className='h-14 w-14 sm:h-16 sm:w-16 object-contain flex-shrink-0' 
                />

                <div className='flex flex-col'>
                  <p className='text-sm text-primary-600 font-bold font-roboto'>
                    Current Time Spent
                  </p>
                  <p className='text-md sm:text-2xl font-orbitron font-bold text-primary-600'>
                    00:00:00
                  </p>
                </div>

              </div>
            </div>

              {/* Current Score */}
              <div className='flex-[2] min-w-[140px] p-3 border-2 border-primary-600 rounded-xl'>
                <div className='flex flex-col sm:flex-row items-center gap-3 justify-center sm:text-left'>
                  <img src="/currentScore.png" alt="Score" className='h-16 w-16 sm:w-18  object-contain flex-shrink-0' />
                  <div className='flex flex-col'>
                    <p className='text-md text-primary-600 font-bold font-roboto'>Current Score</p>
                    <p className='text-md sm:text-2xl  text-center font-bold text-primary-600'>00/00</p>
                  </div>
                </div>
              </div>

              {/* Generated History */}
              <button
                onClick={() => navigate('/history')}
                className='flex-[1] min-w-full lg:min-w-0 p-3 border-2 border-primary-600 rounded-xl flex items-center justify-center gap-3'
              >
                <img src="/genHistory.png" alt="history" className='w-6 h-6 object-contain' />
                <div></div>
                <span className='text-sm font-roboto font-bold text-primary-600'>Generated History</span>
              </button>

            </div>

            {/* Activities Section Header */}
            <div className='mx-8 my-8'>
              <div className='flex items-center gap-3'>
                <span className='text-md font-roboto font-bold text-primary-600 tracking-widest uppercase whitespace-nowrap'>
                  Activities
                </span>
                <div className='flex-1 h-0.5 bg-primary-100' />
              </div>
            </div>

         <div className='flex justify-center pb-8 '>
            <div className='grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-x-28 lg:max-w-3xl'>
              {activities.map((activity) => (
                <button
                  key={activity.path}
                  onClick={() => navigate(activity.path)}
                  className='flex flex-col items-center justify-center gap-2 py-3 lg:py-4 lg:w-56 border-4 border-primary-600 rounded-xl hover:bg-primary-50 transition-colors'
                >
                  <img 
                    src={activity.icon} 
                    alt={activity.label} 
                    className='w-full h-24 object-contain' 
                  />

                  <div className='border-2 w-full border-primary-600'></div>

                  <span className='text-xs lg:text-sm font-roboto font-bold text-primary-600 tracking-widest uppercase text-center'>
                    {activity.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          </div>

          <div className={`
            fixed top-0 right-0 h-full w-80 bg-white border-l shadow-lg z-40
            transition-transform duration-300 ease-in-out
            ${showTimer ? 'translate-x-0' : 'translate-x-full'}
            lg:translate-x-0 lg:static lg:flex lg:flex-[1] lg:shadow-none lg:z-auto
          `}>
            <StudyTimer />
          </div>

        </main>
      </div>
    </div>
  )
}

export default Dashboard