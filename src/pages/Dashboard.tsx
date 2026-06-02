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
    { label: 'Quiz',           icon: '/Quizes.png',     path: '/studyGenerator' },
    { label: 'Flashcard',      icon: '/Flashcards.png', path: '/studyGenerator' },
  ]

  return (
    <div className='h-screen overflow-hidden bg-white'>
      <div className='flex h-full'>
        
        {/* Sidebar */}
        <Sidebar />

        {/* Right of sidebar */}
        <div className='flex-1 flex flex-col  overflow-hidden'>

          {/* Top Bar — mobile only */}
          <div className='lg:hidden flex items-center justify-between px-4 py-2 bg-white fixed top-0 left-0 right-0 z-10'>
            <div className='w-10' />
            <button
              onClick={() => setShowTimer(!showTimer)}
              className='flex flex-col items-center gap-1 px-2 mt-3 lg:mt-0 xl:mt-0 2xl:mt-0 md:mt-0 py-1'
            >
              <img src='/timer.png' alt='timer' className='w-10 h-10' />
              <span className='text-xs text-primary-600 font-bold'>
                {showTimer ? 'Hide Timer' : 'Timer'}
              </span>
            </button>
          </div>

          {/* Body: main content + timer side by side */}
          <div className='flex flex-1 overflow-hidden mt-16 lg:mt-0'>

            {/* Scrollable Main Content */}
            <main className='flex-[3] overflow-y-auto bg-white px-2 lg:px-8 xl:px-8 2xl:px-11'>

              {/* Welcome Banner */}
              <div className='lg:px-10 xl:px-16 2xl:px-20 mt-10 lg:mt-5 mb-10 mx-2 bg-primary-600 p-6 rounded-xl'>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col gap-0 text-left'>
                    <h1 className='font-roboto text-white text-xl md:text-5xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-bold leading-none'>
                      Welcome, {firstName ?? ''}
                    </h1>
                    <p className='font-roboto text-white text-sm md:text-xl lg:text-[20px] -mt-2 md:-mt-3 2xl:pb-3 lg:-mt-4'>
                      Start your day by being productive.
                    </p>
                  </div>
                  <img
                    className='h-28 w-28 lg:h-32 lg:w-32 md:h-32 md:w-32 rounded-full object-cover border-2 border-white bg-white'
                    src={profilePic}
                    alt="Profile"
                  />
                </div>
              </div>

              {/* Dashboard Header */}
              <div className='mx-8 my-6'>
                <div className='flex items-center gap-3'>
                  <span className='text-md font-bold text-primary-600 tracking-widest uppercase'>
                    Dashboard
                  </span>
                  <div className='flex-1 h-0.5 bg-primary-100' />
                </div>
              </div>

              {/* Stats Row */}
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-2 mx-2 lg:mx-20 2xl:mx-48 md:mx-5 mb-6'>

                {/* Current Time Spent */}
                <div className='col-span-1 lg:col-span-2 p-3 border-2 border-primary-600 rounded-xl flex items-center gap-3'>
                  <img
                    src="/currentTime.png"
                    alt="Timer"
                    className='h-12 w-12 md:h-14 md:w-14 flex-shrink-0'
                  />
                  <div className='flex flex-col'>
                    <p className='text-xs lg:text-xs font-bold text-primary-600'>Current Time Spent</p>
                    <p className='text-sm lg:text-lg xl:text-xl font-orbitron font-bold text-primary-600'>
                      {formatElapsed(elapsedSeconds)}
                    </p>
                  </div>
                </div>

                {/* Current Score */}
                <div className='col-span-1 lg:col-span-2 p-3 border-2 border-primary-600 rounded-xl flex items-center gap-3'>
                  <img
                    src="/currentScore.png"
                    alt="Score"
                    className='h-12 w-12 md:h-14 md:w-14 flex-shrink-0'
                  />
                  <div className='flex flex-col'>
                    <p className='text-xs font-bold text-primary-600'>Current Score</p>
                    <p className='text-md sm:text-2xl font-bold text-primary-600'>
                      {latestQuiz ? `${latestQuiz.score}/${latestQuiz.total}` : '00/00'}
                    </p>
                  </div>
                </div>

                {/* Generated History */}
                <button
                  onClick={() => navigate('/history')}
                  className='col-span-2 md:col-span-1 lg:col-span-1 p-3 border-2 border-primary-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-primary-50'
                >
                  <img src="/genHistory.png" alt="history" className='w-8 h-8' />
                  <span className='text-sm font-bold text-primary-600 text-center'>
                    Generated History
                  </span>
                </button>

              </div>

              {/* Activities Header */}
              <div className='mx-8 my-6'>
                <div className='flex items-center gap-3'>
                  <span className='text-md font-bold text-primary-600 tracking-widest uppercase'>
                    Activities
                  </span>
                  <div className='flex-1 h-0.5 bg-primary-100' />
                </div>
              </div>

              {/* Activities Grid */}
              <div className='flex justify-center pb-8'>
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-x-6 2xl:gap-x-8 lg:max-w-2xl 2xl:max-w-3xl'>
                  {activities.map((activity) => (
                    <button
                      key={activity.label}
                      onClick={() => navigate(activity.path)}
                      className='flex flex-col items-center justify-center gap-1 py-1 px-1 md:gap-2 md:py-3 lg:py-3 lg:gap-0 lg:w-40 2xl:w-52 border-2 border-primary-600 rounded-xl hover:bg-primary-50'
                    >
                      <img
                        src={activity.icon}
                        alt={activity.label}
                        className='w-full h-16 md:h-20 lg:h-20 object-contain'
                      />
                      <div className='border w-full border-primary-600' />
                      <span className='text-xs md:text-sm lg:text-sm lg:pt-2 font-roboto font-bold text-primary-600 tracking-widest uppercase text-center'>
                        {activity.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </main>

            {/* Mobile backdrop */}
            {showTimer && (
              <div
                className='fixed inset-0 z-30 bg-black/40 lg:hidden'
                onClick={() => setShowTimer(false)}
              />
            )}

            {/* Timer Panel — sibling of main, not inside it */}
            <div className={`
              fixed top-0 right-0 h-full w-64 xl:w-72 2xl:w-80 bg-white border-l shadow-lg z-40
              transition-transform duration-300
              ${showTimer ? 'translate-x-0' : 'translate-x-full'}
              lg:translate-x-0 lg:static lg:flex lg:flex-[1] lg:shadow-none lg:h-full
            `}>
              <div className='h-full w-full'>
                <StudyTimer />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard