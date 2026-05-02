import { useState } from 'react'
import { useTimer } from 'react-timer-hook'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'

function StudyTimer() {
  const navigate = useNavigate()

  const { user } = useAuth()
  const { tasks } = useTasks(user)

  const totalTasks = tasks.length
  const doneTasks  = tasks.filter((t) => t.status === 'done').length
  const completedPercent = totalTasks === 0
    ? 0
    : Math.round((doneTasks / totalTasks) * 100)

  const [showModal, setShowModal] = useState<boolean>(false)
  const [inputHours, setInputHours] = useState<string>('0')
  const [inputMinutes, setInputMinutes] = useState<string>('0')
  const [inputSeconds, setInputSeconds] = useState<string>('0')
  const [totalTimeInSeconds, setTotalTimeInSeconds] = useState<number>(0)

  const getExpiryTimestamp = (hours: number, minutes: number, seconds: number): Date => {
    const time = new Date()
    time.setSeconds(time.getSeconds() + hours * 3600 + minutes * 60 + seconds)
    return time
  }

  const { seconds, minutes, hours, isRunning, pause, resume, restart } = useTimer({
    expiryTimestamp: getExpiryTimestamp(0, 0, 0),
    autoStart: false,
    onExpire: () => alert('Timer finished! Great study session!'),
  })

  const formatTime = (t: number): string => t.toString().padStart(2, '0')

  const handleSetTime = (): void => {
    const hrs  = parseInt(inputHours)   || 0
    const mins = parseInt(inputMinutes) || 0
    const secs = parseInt(inputSeconds) || 0

    if (hrs === 0 && mins === 0 && secs === 0) { alert('Please set a valid time'); return }
    if (hrs > 23 || mins > 59 || secs > 59)    { alert('Invalid time values');     return }

    setTotalTimeInSeconds(hrs * 3600 + mins * 60 + secs)
    restart(getExpiryTimestamp(hrs, mins, secs), false)
    setShowModal(false)
  }

  const handleStartPause = (): void => {
    if (isRunning) {
      pause()
    } else {
      if (totalTimeInSeconds === 0) { setShowModal(true); return }
      resume()
    }
  }

  const presets = [
    { label: '15 min', h: 0, m: 15, s: 0 },
    { label: '30 min', h: 0, m: 30, s: 0 },
    { label: '45 min', h: 0, m: 45, s: 0 },
    { label: '1 hr',   h: 1, m: 0,  s: 0 },
    { label: '1.5 hr', h: 1, m: 30, s: 0 },
    { label: '2 hr',   h: 2, m: 0,  s: 0 },
  ]


  return (
    <div className='flex flex-col h-full w-full bg-gradient-to-t from-primary-500 to-primary-50 p-6 gap-6 items-center justify-start'>

      <p className='font-orbitron mt-20 mb-10 font-semibold text-primary-600 tracking-widest text-3xl uppercase'>
        Study Timer
      </p>

      {/* TIMER DISPLAY */}
      <div className='flex items-end gap-2 mb-20'>
        {[
          { val: formatTime(hours),   label: 'HOUR' },
          { val: formatTime(minutes), label: 'MIN'  },
          { val: formatTime(seconds), label: 'SEC'  },
        ].map((item, i) => (
          <div key={i} className='flex items-end gap-2'>
            <div className='flex flex-col items-center'>
              <span className='font-orbitron font-bold text-primary-600 text-5xl'>{item.val}</span>
              <span className='text-md font-bold text-primary-600 tracking-widest'>{item.label}</span>
            </div>
            {i < 2 && (
              <span className='font-orbitron font-bold text-primary-600 text-3xl mb-4'>:</span>
            )}
          </div>
        ))}
      </div>

      {/* BUTTONS */}
      <div className='flex gap-3 mb-10'>
        <button
          onClick={() => setShowModal(true)}
          className='px-6 py-2 rounded-xl text-primary-600 font-bold text-sm bg-white hover:bg-primary-100'
        >
          Set Time
        </button>
        <button
          onClick={handleStartPause}
          className='px-8 py-2 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700'
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
      </div>

      {/* CIRCULAR PROGRESS — connected to todo tasks */}
      <div className='relative flex items-center justify-center w-40 h-40'>

        {/* ✅ SVG only contains SVG elements */}
        <svg className='w-full h-full -rotate-90' viewBox='0 0 36 36'>
          {/* Background track */}
          <circle
            cx='18' cy='18' r='15.9'
            fill='none'
            stroke='#e2e8f0'
            strokeWidth='3'
          />
          {/* Progress fill */}
          <circle
            cx='18' cy='18' r='15.9'
            fill='none'
            stroke='currentColor'
            strokeWidth='3'
            strokeLinecap='round'
            className='text-primary-600'
            strokeDasharray='100'
            strokeDashoffset={100 - completedPercent}
          />
        </svg>

        {/* ✅ Text is OUTSIDE svg, positioned with absolute — this is the fix */}
        <span className='absolute font-orbitron font-bold text-primary-700 text-xl'>
          {completedPercent}%
        </span>

      </div>

   
      {/* VIEW */}
      <button
        onClick={() => navigate('/todolist')}
        className='px-8 py-2 rounded-xl bg-white text-primary-600 font-bold text-sm'
      >
        View Tasks
      </button>

      {/* MODAL */}
      {showModal && (
        <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/40'>
          <div className='bg-white rounded-2xl p-6 w-80 flex flex-col gap-4 shadow-xl'>

            <div className='flex justify-between'>
              <h3 className='font-bold text-primary-700 text-lg'>Set Study Timer</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className='flex justify-center gap-2'>
              {[
                { label: 'Hours',   val: inputHours,   set: setInputHours,   id: 'hours'   },
                { label: 'Minutes', val: inputMinutes, set: setInputMinutes, id: 'minutes' },
                { label: 'Seconds', val: inputSeconds, set: setInputSeconds, id: 'seconds' },
              ].map((field) => (
                <div key={field.id} className='flex flex-col items-center'>
                  <label htmlFor={field.id} className='text-xs'>{field.label}</label>
                  <input
                    id={field.id}
                    type='number'
                    value={field.val}
                    onChange={(e) => field.set(e.target.value)}
                    className='w-16 text-center border rounded'
                    min={0}
                  />
                </div>
              ))}
            </div>

            <div className='flex flex-wrap gap-2 justify-center'>
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setInputHours(String(p.h))
                    setInputMinutes(String(p.m))
                    setInputSeconds(String(p.s))
                  }}
                  className='px-3 py-1 text-xs border rounded'
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleSetTime}
              className='w-full py-2 bg-primary-600 text-white rounded-xl'
            >
              Set Timer
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default StudyTimer