import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import StudyTimer from '../components/StudyTimer'
import { useAuth } from '../hooks/useAuth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useTimerContext } from '../context/TimerContext' 
import { useQuizHistory } from '../hooks/useQuizHistory'



function Dashboard() {
  const [showTimer, setShowTimer] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { elapsedSeconds } = useTimerContext() 

  const { quizHistory } = useQuizHistory(user)
const latestQuiz = quizHistory[0] ?? null

const [firstName, setFirstName] = useState<string | null>(null)
const [profilePic, setProfilePic] = useState('/profile.png')

useEffect(() => {
  if (!user) return

  const loadUser = async () => {
    const cacheKey = `user_${user.uid}`

    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      const { firstName, profilePic } = JSON.parse(cached)
      setFirstName(firstName)
      setProfilePic(profilePic)
      return
    }

    const snap = await getDoc(doc(db, 'users', user.uid))
    if (snap.exists()) {
      const data = snap.data()
      const name = data.firstName || 'Student'
      const photo = data.photoURL || '/profile.png'
      setFirstName(name)
      setProfilePic(photo)
      sessionStorage.setItem(cacheKey, JSON.stringify({ firstName: name, profilePic: photo }))
    }
  }

  loadUser()
}, [user])
  const formatElapsed = (total: number): string => {
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }



  const activities = [
    { label: 'To Do List',     icon: '/ToDo.png',       path: '/todolist'  },
    { label: 'Notes',          icon: '/Notes.png',      path: '/notes'     },
    { label: 'Class Schedule', icon: '/ClassSched.png', path: '/schedule'  },
    { label: 'Courses',        icon: '/Courses.png',    path: '/courses'   },
    { label: 'Quiz',           icon: '/Quizes.png',     path: '/quiz'      },
    { label: 'Flashcard',      icon: '/Flashcards.png', path: '/flashcard' },
  ]

  return (
    <div className='bg-white'>
      <div className='flex h-screen'>
        <Sidebar />

        <div className='flex-1 flex flex-col'>

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
          <main className='flex flex-1 overflow-y-auto min-h-screen mt-16 lg:mt-0'>

            {/* Main Col */}
            <div className='flex-[3] min-h-screen bg-white px-2 lg:px-11'>

              {/* Welcome Banner */}
              <div className='lg:px-20 mt-10 lg:mt-5 mb-6 mx-8 bg-primary-600 p-6 rounded-xl'>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col gap-0 text-left'>
                    <h1 className='font-roboto text-white md:text-5xl  text-xl  lg:text-6xl font-bold leading-none'>
                      Welcome, {firstName ?? ''}
                    </h1>
                    <p className='font-roboto text-white text-sm md:text-xl lg:text-[20px]  mt-1'>
                      Start your day by being productive.
                    </p>
                  </div>
                  <img
                    className='h-32 w-32 sm:h-28 sm:w-28 rounded-full object-cover border-2 border-white bg-white'
                    src={profilePic}
                    alt="Profile"
                  />
                </div>
              </div>

              {/* Dashboard Header */}
              <div className='mx-8 my-8 mt-10'>
                <div className='flex items-center gap-3'>
                  <span className='text-md font-bold text-primary-600 tracking-widest uppercase'>
                    Dashboard
                  </span>
                  <div className='flex-1 h-0.5 bg-primary-100' />
                </div>
              </div>

              {/* Stats Row */};
              <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 mx-6 lg:mx-28 md:mx-24 mb-6'>
{/* Current Time Spent */}
              <div className='col-span-1 lg:col-span-2 lg:justify-center p-3 border-2 border-primary-600 rounded-xl flex items-center gap-3'>
                <img
                  src="/currentTime.png"
                  alt="Timer"
                  className='h-12 w-12 md:h-14 md:w-14 sm:h-16 sm:w-16 flex-shrink-0'
                />
                <div className='flex flex-col'>
                  <p className='text-sm lg:text-xs font-bold text-primary-600'>Current Time Spent</p>
                  <p className='text-sm lg:text-xl font-orbitron font-bold text-primary-600'>
                    {formatElapsed(elapsedSeconds)}  {/* ← replaces 00:00:00 */}
                  </p>
                </div>
              </div>

                {/* Current Score */}
                <div className='col-span-1 lg:col-span-2 lg:justify-center p-3 border-2 border-primary-600 rounded-xl flex items-center gap-3'>
                  <img
                    src="/currentScore.png"
                    alt="Score"
                    className='h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0'
                  />
                  <div className='flex flex-col'>
                    <p className='text-sm font-bold text-primary-600'>Current Score</p>
                    <p className='text-md sm:text-2xl font-bold text-primary-600'>
                      {latestQuiz ? `${latestQuiz.score}/${latestQuiz.total}` : '00/00'}
                    </p>
                  </div>
                </div>

                {/* Generated History */}
                <button
                  onClick={() => navigate('/history')}
                  className='col-span-2 md:col-span-2 lg:col-span-1 p-3 border-2 border-primary-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-primary-50'
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

              {/* Activities Grid */}
              <div className='flex justify-center pb-8'>
                <div className='grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-14 md:grid-cols-3 lg:gap-x-20 lg:gap-y-5 lg:max-w-3xl'>
                  {activities.map((activity) => (
                    <button
                      key={activity.path}
                      onClick={() => navigate(activity.path)}
                      className='flex flex-col items-center justify-center gap-1 py-1 px-1 md:gap-2 md:px-0 md:py-3 lg:py-3 lg:gap-0 lg:w-52 border-2 border-primary-600 rounded-xl hover:bg-primary-50'
                    >
                      <img
                        src={activity.icon}
                        alt={activity.label}
                        className='w-full h-16 md:h-20 lg:h-20 object-contain'
                      />
                      <div className='border w-full border-primary-600' />
                      <span className='text-xs md:text-xl lg:text-sm lg:pt-3 font-roboto font-bold text-primary-600 tracking-widest uppercase text-center'>
                        {activity.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Backdrop — mobile only */}
            {showTimer && (
              <div
                className='fixed inset-0 z-30 bg-black/40 lg:hidden'
                onClick={() => setShowTimer(false)}
              />
            )}

            {/* Timer Panel */}
            <div className={`
              fixed top-0 right-0 h-full w-80 bg-white border-l shadow-lg z-40
              transition-transform duration-300
              ${showTimer ? 'translate-x-0' : 'translate-x-full'}
              lg:translate-x-0 lg:static lg:flex lg:flex-[1] lg:shadow-none
            `}>
              <div className='h-full w-full'>
                <StudyTimer />
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  )
}

export default Dashboard