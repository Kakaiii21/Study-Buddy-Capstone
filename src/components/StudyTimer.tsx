import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { useTimerContext } from '../context/TimerContext'

const PRESETS = [
  { label: '15 min', h: 0, m: 15, s: 0 },
  { label: '30 min', h: 0, m: 30, s: 0 },
  { label: '45 min', h: 0, m: 45, s: 0 },
  { label: '1 hr',   h: 1, m: 0,  s: 0 },
  { label: '1.5 hr', h: 1, m: 30, s: 0 },
  { label: '2 hr',   h: 2, m: 0,  s: 0 },
]

function StudyTimer() {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const { tasks } = useTasks(user)

const completedPercent = useMemo(() => {
  const total = tasks.length

  const done = tasks.filter(
    (t: { status: string }) => t.status === 'done'
  ).length

  return total === 0 ? 0 : Math.round((done / total) * 100)
}, [tasks])
  // ↓ from context now — replaces useTimer + totalTimeInSeconds + showExpiredMsg
  const {
    seconds, minutes, hours,
    isRunning, totalSeconds,
    setTimer, pause, resume,
  } = useTimerContext()

  // ↓ these stay local — only used inside the modal
  const [showModal,    setShowModal]    = useState<boolean>(false)
  const [errorMsg,     setErrorMsg]     = useState<string>('')
  const [inputHours,   setInputHours]   = useState<string>('0')
  const [inputMinutes, setInputMinutes] = useState<string>('0')
  const [inputSeconds, setInputSeconds] = useState<string>('0')

  // ↓ remove: useState for totalTimeInSeconds, getExpiryTimestamp, initialExpiry, useTimer

  const closeModal = () => setShowModal(false)
  const formatTime = (t: number): string => t.toString().padStart(2, '0')

  const handleSetTime = (): void => {
    const hrs  = Math.max(0, parseInt(inputHours)   || 0)
    const mins = Math.max(0, parseInt(inputMinutes) || 0)
    const secs = Math.max(0, parseInt(inputSeconds) || 0)

    if (hrs === 0 && mins === 0 && secs === 0) { setErrorMsg('Please set a valid time'); return }
    if (hrs > 23 || mins > 59 || secs > 59)    { setErrorMsg('Invalid time values');     return }

    setErrorMsg('')
    setTimer(hrs, mins, secs)  // ← context handles it now
    closeModal()
  }

      const handleStartPause = (): void => {
        if (isRunning) {
          pause()
        } else {
          if (totalSeconds === 0) { setShowModal(true); return }  // ← this already handles it
          resume()
        }
      }

  return (
    <div className='flex flex-col h-full w-full bg-gradient-to-t from-primary-500 to-primary-50 p-6 gap-20 items-center justify-center'>

      <p className='font-orbitron font-semibold text-primary-600 tracking-widest text-3xl uppercase'>
        Study Timer
      </p>



      {/* TIMER DISPLAY — exact same as before */}
      <div className='flex items-end gap-2'>
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

      {/* BUTTONS — exact same as before */}
      <div className='flex gap-3'>
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

      {/* CIRCULAR PROGRESS — exact same as before */}
      <div className='relative flex items-center justify-center w-40 h-40'>
        <svg className='w-full h-full -rotate-90' viewBox='0 0 36 36'>
          <circle cx='18' cy='18' r='15.9' fill='none' stroke='#e2e8f0' strokeWidth='3' />
          <circle
            cx='18' cy='18' r='15.9'
            fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round'
            className='text-primary-600'
            strokeDasharray='100'
            strokeDashoffset={100 - completedPercent}
          />
        </svg>
        <span className='absolute font-orbitron font-bold text-primary-700 text-xl'>
          {completedPercent}%
        </span>
      </div>

      {/* VIEW TASKS — exact same as before */}
      <button
        onClick={() => navigate('/todolist')}
        className='px-8 py-2 rounded-xl bg-white text-primary-600 font-bold text-sm'
      >
        View Tasks
      </button>

      {/* MODAL — exact same as before, portal still works fine */}
      {showModal && createPortal(
        <div
          className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/40'
          onMouseDown={() => closeModal()}
        >
          <div
            className='bg-white rounded-2xl p-6 w-full lg:mx-[700px] mx-5 h-auto  flex flex-col gap-0 shadow-xl'
            onMouseDown={(e) => e.stopPropagation()}
          >       
          {/*  
              <button className='text-xl  ml-auto font-bold font-roboto' onClick={() => closeModal()}>CLOSE</button>
              <h3 className='font-bold  mb-7 text-center text-primary-600 text-2xl font-roboto uppercase'>Set Timer</h3>
 */}     
             <div className='flex justify-between'>
              <h3 className='font-bold font-roboto text-primary-600 text-xl uppercase'>Set Timer</h3>
              <button className='font-bold mb-3 text-xl uppercase' onClick={() => setShowModal(false)}>Close</button>
            </div>
              <hr className='w-full border-t border-primary-600 mb-6' />


            {errorMsg && (
              <p className='text-red-500 text-xs text-center'>{errorMsg}</p>
            )}

            <div className='flex justify-center gap-10 text-primary-600 font-roboto'>
              {[
                { label: 'Hours',   val: inputHours,   set: setInputHours,   id: 'hours'   },
                { label: 'Minutes', val: inputMinutes, set: setInputMinutes, id: 'minutes' },
                { label: 'Seconds', val: inputSeconds, set: setInputSeconds, id: 'seconds' },
              ].map((field) => (
                <div key={field.id} className='flex flex-col items-center'>
                  <label htmlFor={field.id} className='text-md text-primary-600 '>{field.label}</label>
                  <input
                    id={field.id}
                    type='text'
                    inputMode='numeric'
                    pattern='[0-9]*'
                    value={field.val}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '')
                      field.set(clean === '' ? '0' : clean)
                    }}
                    onFocus={(e) => e.target.select()}
                    className='w-16 text-center border rounded text-xl text-primary-600 mb-10'
                  />
                </div>
              ))}
            </div>
            <p className='text-xl text-primary-600 mb-5 font-roboto text-center'>Quick Presets</p>

            <div className='grid grid-cols-3 gap-2 justify-center mb-10'>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setInputHours(String(p.h))
                    setInputMinutes(String(p.m))
                    setInputSeconds(String(p.s))
                  }}
                  className='px-3 py-1 text-md border bg-primary-600 text-white  font-roboto rounded'
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
        </div>,
        document.body
      )}
    </div>
  )
}

export default StudyTimer