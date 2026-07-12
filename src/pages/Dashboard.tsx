import { useEffect, useRef, useState, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import StudyTimer from '../components/StudyTimer'
import { useAuth } from '../hooks/useAuth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useTimerContext } from '../context/TimerContext' 
import { useQuizHistory } from '../hooks/useQuizHistory'
import { useTasks } from '../hooks/useTasks'
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
    () => setShowSidebar(false), // onCloseSidebar
    user
  )
  const { elapsedSeconds } = useTimerContext() 

  const { quizHistory } = useQuizHistory(user)
  const latestQuiz = quizHistory[0] ?? null

  const { tasks } = useTasks(user)
  const completedPercent = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter(
      (t: { status: string }) => t.status === 'done'
    ).length
    return total === 0 ? 0 : Math.round((done / total) * 100)
  }, [tasks])


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
    { label: 'To Do List',     path: '/todolist',       color: '#FFD84D' },
    { label: 'Notes',          path: '/notes',          color: '#7FC4FF' },
    { label: 'Class Schedule', path: '/schedule',       color: '#B5E8A0' },
    { label: 'Courses',        path: '/courses',        color: '#C9A9F0' },
    { label: 'Study Generator',path: '/studyGenerator', color: '#FFB8D9' },
    { label: 'Generated History', path: '/generatedHistory', color: '#FFB870' },
  ]
  if (!authChecked) return null  

  return (
    <div className='h-screen w-full  overflow-hidden bg-white'>
      <div className='flex h-full'>

        {/* Sidebar */}
        <div className='md:p-3 '>
          <Sidebar
            isOpenExternal={showSidebar}
            onExternalClose={() => setShowSidebar(false)}
          />
        </div>
        

        {/* Right of sidebar */}
        <div className='flex-1  flex flex-col overflow-hidden'>

        {/* Top Bar — mobile only */}
        <div className='lg:hidden flex items-center justify-between px-4 py-2 bg-white fixed top-0 left-0 right-0 z-10 relative'>
          <p className='absolute left-1/2 -translate-x-1/2 font-inter font-semibold text-md text-[#B3B3B3] uppercase'>Dashboard</p>
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
<div className='flex w-full flex-1 overflow-hidden mt-0 lg:mt-0'>

     {/* Scrollable Main Content */}
<main ref={mainRef} className='flex-1 min-w-0 w-full overflow-hidden bg-white px-8 lg:px-5 xl:px-1 2xl:px-8'>
<p className='hidden md:flex w-full max-w-[520px] lg:max-w-[clamp(560px,58vw,680px)] xl:max-w-[780px] 2xl:max-w-[900px] mx-auto 
font-inter mt-6 lg:mt-3 xl:mt-10 2xl:mt-6 font-semibold text-sm md:text-md lg:text-[10px] text-[#B3B3B3] uppercase'>Dashboard</p>

{/* Wrapper aligns ID card + stats row with the sections below (same max-w container) */}
<div className='w-full max-w-[520px] lg:max-w-[clamp(560px,58vw,680px)] xl:max-w-[780px] 2xl:max-w-[900px] mx-auto mt-2'>
<div className='flex  flex-col sm:flex-row sm:flex-nowrap w-full gap-4 md:gap-6 lg:gap-6 xl:gap-8 2xl:gap-[clamp(1rem,2vw,4rem)] mt-0 justify-center items-center'>
    
    {/* ID Card */}
<div className='w-full flex-1 min-w-0 xl:mt-0 2xl:mt-4 lg:min-w-[260px] lg:max-w-[clamp(320px,34vw,400px)] xl:min-w-[340px] xl:max-w-[420px] 2xl:min-w-[400px] 2xl:max-w-[530px] 
h-auto pb-3 bg-white border-2 border-primary-800 rounded-2xl overflow-hidden relative'>
                        
      {/* Yellow header strip */}
      <div className='w-full h-8 md:h-9 lg:h-7 xl:h-12 2xl:h-12  bg-[#FFF1AB] rounded-t-2xl border-b-2 border-primary-800 relative'>
        {/* White pill notch */}
        <div className='absolute left-1/2 -translate-x-1/2 bottom-2 bg-white w-20 md:w-22 lg:w-24 xl:w-28 2xl:w-32 h-3 md:h-3 lg:h-3 2xl:h-6 border-2 border-primary-800 rounded-full'></div>
      </div>
      {/* Main content: photo + text + logo */}
      <div className='flex  flex-row items-start gap-3 px-4 md:px-4 lg:px-2 xl:px-3 2xl:px-4 lg:mt-2 xl:mt-6'>
        <img 
          src={profilePic} 
          alt="Profile" 
          className='w-[70px] h-[95px] md:w-[75px] md:h-[100px] lg:w-[80px] lg:h-[100px] xl:w-[110px] xl:h-[145px] 2xl:w-[130px] 2xl:h-[170px] object-cover border-2 border-primary-800'
        />
        <div className='flex flex-col flex-1 pl-1'>
          <div className='flex flex-row items-start justify-between'>
            <span className='font-kapakana italic text-[28px] md:text-[30px] lg:text-[28px] xl:text-[44px] 2xl:text-[50px] font-extrabold text-primary-800 leading-tight'>Welcome,</span>
            <img src='/idLogo.png' alt="Logo" className='w-7 h-6 md:w-7 md:h-6 lg:w-8 lg:h-6 xl:w-11 xl:h-9 2xl:w-12 2xl:h-10' />
          </div>
          <span className='font-bold font-inter text-primary-800 text-xl md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl leading-tight -mt-3 md:-mt-3 lg:-mt-2 xl:-mt-5 2xl:-mt-6'> {firstName ?? ''}</span>
          <span className='text-[8px] md:text-[9px] lg:text-[8px] xl:text-[11px] 2xl:text-[12px] font-inter font-medium text-primary-800 tracking-wide mt-2'>
            START YOUR DAY BY BEING PRODUCTIVE.
          </span>
          {/* Barcode right under the subtitle */}
          <div 
            className='w-full h-4 md:h-4 lg:h-4 xl:h-7 2xl:h-8 mt-2 lg:mt-1'
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 5px, transparent 5px, transparent 8px)',
            }}
          />
        </div>
      </div>
    </div>

    {/* Stats column */}
<div className='flex w-full flex-1 min-w-0 flex-row gap-x-2 md:flex-col md:flex-1 lg:flex-1
  lg:min-w-[200px] lg:max-w-[clamp(260px,28vw,320px)] xl:min-w-[260px] xl:max-w-[320px] 2xl:max-w-[360px]
  gap-y-3 md:gap-y-3 lg:gap-y-2 xl:gap-y-7 justify-between md:justify-center items-center pr-3'>
      {/* Current Time Spent */}
      <div id='currentTime'           
        className='w-full h-auto px-3 md:px-4 lg:px-3 xl:min-px-8 2xl:min-px-2 py-3
          border-2 border-primary-600 rounded-xl flex items-center justify-start gap-x-4 md:gap-x-3 lg:gap-x-2 xl:gap-x-8 2xl:gap-x-1
          md:min-h-[70px]
        '>
        <img src="/currentTime.png" alt="Timer"
          className='h-9 w-9 md:h-10 md:w-10 lg:h-[40px]  lg:w-[40px] xl:h-[60px] xl:w-[60px] 2xl:h-16 2xl:w-16 flex-shrink-0' />
        <div className='flex flex-col flex-1 items-center'>
          <p className='text-[10px] md:text-[10px] lg:text-[12px] xl:text-[16px] 2xl:min-text-lg font-extrabold font-inter text-center text-primary-600'>Current Time Spent</p>
          <p className='text-xs md:text-sm lg:text-[18px] xl:text-[25px] 2xl:min-text-[35px] font-orbitron font-normal text-center text-primary-600'>
            {formatElapsed(elapsedSeconds)}
          </p>
        </div>
      </div>
      {/* Current Score */}
      <div id='currentScore'          
        className='w-full h-auto px-3 md:px-4 lg:px-3 xl:min-px-8 2xl:min-px-2 py-3
          border-2 border-primary-600 rounded-xl flex items-center justify-start gap-x-4 md:gap-x-3 lg:gap-x-2 xl:gap-x-8 2xl:gap-x-10
          md:min-h-[70px]
        '>
        <img src="/currentScore.png" alt="Score"
          className='h-9 w-9 md:h-10 md:w-10 lg:h-[40px] lg:w-[40px] xl:h-[60px] xl:w-[60px] 2xl:h-16 2xl:w-16 flex-shrink-0' />
        <div className='flex flex-col flex-1 items-center'>
          <p className='text-[10px] md:text-[10px] lg:text-[13px] xl:text-[16px] 2xl:min-text-lg font-extrabold font-inter text-center text-primary-600'>Current Score</p>
          <p className='text-sm md:text-base lg:text-[20px] xl:text-[25px] 2xl:min-text-[35px] font-roboto font-bold text-center text-primary-600'>
            {latestQuiz ? `${latestQuiz.score}/${latestQuiz.total}` : '00/00'}
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

{/* TASK PROGRESS heading with percent aligned right */}
<div className='flex items-center justify-between w-full max-w-[520px] lg:max-w-[clamp(560px,58vw,680px)] xl:max-w-[780px] 2xl:max-w-[900px] lg:pr-3 mx-auto lg:mt-4 2xl:mt-10 mt-6'>
  <p className='font-inter font-semibold text-sm md:text-md lg:text-[10px] text-[#B3B3B3] uppercase'>TASK PROGRESS IN TO DO LIST</p>
  <span className='font-inter font-semibold text-sm md:text-md lg:text-[10px] text-primary-600'>{completedPercent}%</span>
</div>

{/* HORIZONTAL PROGRESS BAR */}
<div id='progressC' className='w-full max-w-[520px] lg:max-w-[clamp(560px,58vw,680px)] xl:max-w-[780px] 2xl:max-w-[900px] mx-auto px-2 mt-3 xl:mt-5 2xl:mt-6 mb-2'>
  <div className='w-full h-3 lg:h-3 xl:h-5 bg-gray-200 rounded-full overflow-hidden'>
    <div
      className='h-full bg-[#9CCF7E] rounded-full  transition-all  duration-500 ease-out'
      style={{ width: `${completedPercent}%` }}
    />
  </div>
</div>

<div className='flex border flex-row w-full mt-5 lg:mt-1 lg:pr-3  2xl:mt-6 max-w-[520px] lg:max-w-[clamp(560px,58vw,680px)] xl:max-w-[780px] 2xl:max-w-[900px] mx-auto justify-between'>
  <p className='font-inter xl:text-[16px] mt-5 2xl:mt-8 font-semibold text-sm md:text-md lg:text-[10px] text-[#B3B3B3] uppercase'>Activities</p>

  <button
    id='tour-btn'
    onClick={() => startTour()}
    title='Take a Tour'
    className='flex flex-col items-center justify-center'
  >
    <div className='w-14 h-14 lg:w-7 lg:h-7 flex items-center justify-center text-2xl font-bold'>
      <img src="/needhelp.png" alt="?" className='w-12 block mx-auto mt-1' />
    </div>
    <p className='text-xs text-primary-800  uppercase text-center lg:text-[8px]
    font-inter font-semibold'>Need Help?</p>
  </button>
  </div>


{/* Activities Grid */}
<div className='flex justify-center pb-8 mt-3 lg:mt-3 lg:pr-3 2xl:mt-7 pr-1'>
  <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3  2xl:px-1 2xl:grid-cols-3 gap-4 md:gap-6  lg:gap-x-10  lg:gap-y-4 xl:gap-x-10 xl:gap-y-5 2xl:gap-x-12 2xl:gap-y-5'>
    {activities.map((activity) => (
      <button
        key={activity.label}
        onClick={() => navigate(activity.path)}
        style={{ backgroundColor: activity.color }}
      className='relative flex flex-col justify-between text-left p-2
        w-[100px] h-[100px] md:w-[190px] md:h-[120px]  lg:w-full lg:max-w-[170px] lg:h-[100px] xl:w-[180px] xl:h-[140px] 2xl:w-[220px] 2xl:h-[150px]
        border-2 border-black rounded-2xl lg:rounded-lg
        hover:scale-[1.02] active:scale-[0.98] transition-transform'
      >
        <span className='font-inter font-black text-base md:text-lg lg:text-[16px]  2xl:text-2xl text-black uppercase leading-tight  pr-8'>
          {activity.label}
        </span>
        <div className='absolute bottom-3 
        drop-shadow-[0_4px_2px_rgba(0,0,0,0.4)]
        right-3 w-8 h-8 md:w-9 md:h-9 2xl:w-12 2xl:h-12 rounded-full bg-black flex items-center justify-center'>
          <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round'>
            <polyline points='9 6 15 12 9 18' />
          </svg>
        </div>
      </button>
    ))}
  </div>
</div>

</main>

{/* Mobile backdrop — only relevant below lg */}
{showTimer && (
  <div
    className='fixed inset-0 z-30 bg-black/40 lg:hidden'
    onClick={() => setShowTimer(false)}
  />
)}

{/* Timer Panel — drawer on mobile, static flexible column on lg+ */}
<div
  id='timer'
  className={`
    fixed top-0 right-0 h-full w-full max-w-[256px]
    transition-transform duration-300
    ${showTimer ? 'translate-x-0' : 'translate-x-full'}

    lg:static lg:translate-x-0 lg:flex lg:flex-shrink-0 lg:h-full
    lg:w-[28%] xl:w-[26%] 2xl:w-[24%]lg:border-l lg:shadow-none lg:max-w-none 
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