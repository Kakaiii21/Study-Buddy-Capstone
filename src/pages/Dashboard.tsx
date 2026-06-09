import { useEffect, useRef, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import StudyTimer from '../components/StudyTimer'
import { useAuth } from '../hooks/useAuth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useTimerContext } from '../context/TimerContext' 
import { useQuizHistory } from '../hooks/useQuizHistory'
import { useTour } from '../hooks/useTour'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'

function Dashboard() {
  const [showTimer, setShowTimer] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)  

  
  const mainRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Auth guard — redirect if not logged in or email not verified
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          navigate('/login', { replace: true })
        } else if (!user.emailVerified) {
          navigate('/verify-email', { replace: true })
        }
        setAuthChecked(true)  // ← add this
      })
      return () => unsubscribe()
    }, [])


  const { startTour } = useTour(
    'dashboard',
    true,
    () => setShowTimer(true),   // onOpenTimer
    () => setShowTimer(false),  // onCloseTimer
    () => setShowSidebar(true), // onOpenSidebar
    () => setShowSidebar(false) // onCloseSidebar
  )
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
        const data = JSON.parse(cached)
        setFirstName(data.firstName || 'Student')
        setProfilePic(data.photoURL || '/profile.png')
        return
      }

      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const data = snap.data()
          setFirstName(data.firstName || 'Student')
          setProfilePic(data.photoURL || '/profile.png')
          sessionStorage.setItem(cacheKey, JSON.stringify(data))
        }
      } catch {
        setFirstName('Student')
        setProfilePic('/profile.png')
      }
    }

    loadUser()

    const handleUpdate = () => {
      const cacheKey = `user_${user.uid}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const data = JSON.parse(cached)
        setProfilePic(data.photoURL || '/profile.png')
        setFirstName(data.firstName || 'Student')
      }
    }

    window.addEventListener('profilePicUpdated', handleUpdate)
    return () => window.removeEventListener('profilePicUpdated', handleUpdate)
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
  if (!authChecked) return null  

  return (
    <div className='h-screen overflow-hidden bg-white'>
      <div className='flex h-full'>
        
        {/* Sidebar */}
        <Sidebar
          isOpenExternal={showSidebar}
          onExternalClose={() => setShowSidebar(false)}
        />

        {/* Right of sidebar */}
        <div className='flex-1 flex flex-col overflow-hidden'>

          {/* Top Bar — mobile only */}
          <div className='lg:hidden flex items-center justify-between px-4 py-2 bg-white fixed top-0 left-0 right-0 z-10'>
            <div className='w-10' />
            <button
              id='timer-btn'                      
              onClick={() => setShowTimer(!showTimer)}
              className='flex flex-col items-center gap-1 px-2 mt-3 md:mt-0 py-1'
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
            <main ref={mainRef} className='flex-[3] overflow-y-auto bg-white px-2 lg:px-8 xl:px-8 2xl:px-11'>

      {/* Welcome Banner */}
<div className='lg:px-10 xl:px-16 2xl:px-20 mt-10 lg:mt-5 2xl:mt-10 mb-10 mx-2 lg:bg-pink-600 xl:bg-yellow-600 2xl:bg-green-600 bg-primary-600 p-6 rounded-xl'>
  <div className='flex items-center justify-between'>
    <div className='flex flex-col gap-0 text-left'>
      <h1 className='font-roboto text-white text-xl md:text-5xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-bold leading-none'>
        Welcome, {firstName ?? ''}
      </h1>
      <p className='font-roboto text-white text-sm md:text-xl lg:text-[20px] -mt-2 md:-mt-3 2xl:pb-3 lg:-mt-4'>
        Start your day by being productive.
      </p>

      {/* Tour button — matches banner style */}
        <button
          onClick={() => startTour()}
          className='mt-4 self-start flex items-center gap-2 
            px-4 py-2 rounded-xl 
            bg-white text-primary-600 
            font-roboto font-bold text-xs md:text-sm
            hover:bg-primary-50 transition-colors relative'
        >
          {/* Pulsing indicator dot */}
          <span className='absolute -top-1 -right-1 flex h-3 w-3'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75' />
            <span className='relative inline-flex rounded-full h-3 w-3 bg-yellow-400' />
          </span>

          <span className='w-4 h-4 rounded-full border-2 border-primary-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0'>
            ?
          </span>
          Need help?
        </button>
        

    </div>
    <img
      className='h-28 w-28 lg:h-32 lg:w-32 2xl:h-36 2xl:w-36 md:h-32 md:w-32 rounded-full object-cover border-2 border-white bg-white'
      src={profilePic}
      alt="Profile"
    />
  </div>
</div>




              <div id='dash_stats'>                
                {/* Dashboard Header */}
                <div className='mx-8 my-6 2xl:my-10 xl:my-8 lg:my-6'>
                  <div className='flex items-center gap-3 lg:bg-pink-600'>
                    <span className='text-md  lg:text-lg xl:text-xl 2xl:text-2xl font-semibold text-primary-600 tracking-widest uppercase'>
                      Dashboard
                    </span>
                    <div className='flex-1 h-0.5 bg-primary-100' />
                    <p className='fixed top-0 left-0 z-50 text-xs bg-black text-white p-1'>
  {window.innerWidth}px
</p>
                  </div>
                </div>
                

                {/* Stats Row */}
                <div className='flex flex-wrap sm:flex-nowrap items-stretch justify-center gap-3 lg:gap-4 xl:gap-6 2xl:gap-8 mx-6 lg:mx-10 xl:mx-10 2xl:mx-24 mb-6'>

                  {/* Current Time Spent */}
                  <div id='currentTime'           
                    className='w-[calc(50%-6px)] sm:flex-1 min-w-0 lg:min-w-[200px] xl:min-w-[250px] 2xl:min-w-[280px]
                    lg:h-[120px] xl:h-[140px] 2xl:h-[160px]
                    p-3 lg:p-4 xl:p-5 border-2 border-primary-600 rounded-xl flex items-center justify-center gap-3'>
                    <img src="/currentTime.png" alt="Timer"
                      className='h-10 w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 xl:h-20 xl:w-20 2xl:h-24 2xl:w-24 flex-shrink-0' />
                    <div className='flex flex-col'>
                      <p className='text-[10px] md:text-xs lg:text-sm xl:text-base 2xl:text-lg font-semibold text-center text-primary-600'>Current Time Spent</p>
                      <p className='text-xs md:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-orbitron text-center text-primary-600'>
                        {formatElapsed(elapsedSeconds)}
                      </p>
                    </div>
                  </div>

                  {/* Current Score */}
                  <div id='currentScore'          
                    className='w-[calc(50%-6px)] sm:flex-1 min-w-0 lg:min-w-[200px] xl:min-w-[250px] 2xl:min-w-[280px]
                    lg:h-[120px] xl:h-[140px] 2xl:h-[160px]
                    p-3 lg:p-4 xl:p-5 border-2 border-primary-600 rounded-xl flex items-center justify-center gap-3'>
                    <img src="/currentScore.png" alt="Score"
                      className='h-10 w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 xl:h-20 xl:w-20 2xl:h-24 2xl:w-24 flex-shrink-0' />
                    <div className='flex flex-col'>
                      <p className='text-[10px] md:text-xs lg:text-sm xl:text-base 2xl:text-lg font-semibold text-center text-primary-600'>Current Score</p>
                      <p className='text-sm md:text-2xl lg:text-2xl xl:text-3xl 2xl:text-3xl font-bold text-center text-primary-600'>
                        {latestQuiz ? `${latestQuiz.score}/${latestQuiz.total}` : '00/00'}
                      </p>
                    </div>
                  </div>

                  {/* Generated History */}
                  <button
                    id='genHistory'               
                    onClick={() => navigate('/history')}
                    className='w-full sm:flex-1 min-w-0 lg:min-w-[140px] xl:min-w-[170px] 2xl:min-w-[180px]
                    lg:h-[120px] xl:h-[140px] 2xl:h-[160px]
                    p-3 lg:p-4 xl:p-5 border-2 border-primary-600 rounded-xl flex
                    flex-row sm:flex-col items-center justify-center gap-2 hover:bg-primary-50'
                  >
                    <img src="/genHistory.png" alt="history" className='w-6 h-6 md:w-6 md:h-6 lg:w-10 lg:h-10 xl:w-12 xl:h-12 2xl:w-14 2xl:h-14' />
                    <span className='text-xs md:text-sm lg:text-sm xl:text-base 2xl:text-lg font-bold text-primary-600 text-center'>
                      Generated History
                    </span>
                  </button>

                </div>
              </div>

              {/* Activities Header */}
              <div className='mx-8 my-6 2xl:my-10 xl:my-8 lg:my-6'>
                <div className='flex items-center gap-3'>
                  <span className='text-md font-semibold lg:text-lg xl:text-xl 2xl:text-2xl text-primary-600 tracking-widest uppercase'>
                    Activities
                  </span>
                  <div className='flex-1 h-0.5 bg-primary-100' />
                </div>
              </div>

              {/* Activities Grid */}
              <div className='flex justify-center pb-8 px-4'>
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8 xl:gap-10 2xl:gap-14'>
                  {activities.map((activity) => (
                    <button
                      key={activity.label}
                      onClick={() => navigate(activity.path)}
                      className='group flex flex-col items-center justify-center gap-1 py-2 px-2
                        md:gap-2 md:py-3
                        lg:py-4 lg:gap-2 lg:w-44
                        xl:w-48 xl:py-4
                        2xl:w-64 2xl:h-48 2xl:py-6
                        border-2 border-primary-600 rounded-xl 
                        hover:bg-primary-600 hover:text-white hover:border-white'
                    >
                      <img
                        src={activity.icon}
                        alt={activity.label}
                        className='w-full rounded-lg h-16 md:h-20 lg:h-24 xl:h-24 2xl:h-32 object-contain'
                      />
                      <div className='border w-full border-primary-600 group-hover:border-white' />
                      <span className='text-xs md:text-[14px] lg:text-[14px] xl:text-[16px] 2xl:text-xl lg:pt-2 xl:pt-2 2xl:pt-3 font-roboto font-bold text-primary-600 group-hover:text-white tracking-widest uppercase text-center'>
                        {activity.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Floating Tour Button — add just before the closing </main> tag */}
              <button
                onClick={() => startTour()}
                className='fixed bottom-6 right-6 z-50 
                  bg-primary-600 text-white 
                  w-14 h-14 rounded-full shadow-lg
                  flex items-center justify-center
                  hover:bg-primary-700 active:scale-95 transition-all
                  text-2xl font-bold
                  lg:bottom-8 lg:right-8'
                title='Take a Tour'
              >
                ?
              </button>
            </main>

            {/* Mobile backdrop */}
            {showTimer && (
              <div
                className='fixed inset-0 z-30 bg-black/40 lg:hidden'
                onClick={() => setShowTimer(false)}
              />
            )}

            {/* Timer Panel */}
            <div
              id='timer'                           
              className={`
                fixed top-0 right-0 h-full w-64 xl:w-72 2xl:w-80 bg-white border-l shadow-lg z-40
                transition-transform duration-300
                ${showTimer ? 'translate-x-0' : 'translate-x-full'}
                lg:translate-x-0 lg:static lg:flex lg:flex-[1] lg:shadow-none lg:h-full
              `}>
              <div className='h-full w-full overflow-y-auto'>
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