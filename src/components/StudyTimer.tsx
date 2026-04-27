// src/components/StudyTimer.tsx
import { useState, useEffect, useRef } from 'react'

function StudyTimer() {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Format seconds to HH:MM:SS
  const format = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const handleReset = () => {
    setIsRunning(false)
    setSeconds(0)
  }

  return (
    <div className='flex flex-col h-full lg:w-full bg-gradient-to-t from-primary-500 to-primary-50 p-6 gap-6'>
      {/* Header */}
      <div className='flex items-center gap-3 border-b pb-4'>
        <img src='/timer.png' alt='timer' className='w-8 h-8 object-contain' />
        <h2 className='text-lg font-roboto font-bold text-primary-600'>
          Study Timer
        </h2>
      </div>

      {/* Timer Display */}
      <div className='flex flex-col items-center justify-center flex-1 gap-6'>

        {/* Clock Circle */}
        <div className='w-40 h-40 rounded-full border-4 border-primary-600 flex items-center justify-center bg-primary-50'>
          <span className='font-digital text-2xl text-primary-600'>
            {format(seconds)}
          </span>
        </div>

        {/* Status */}
        <p className='text-sm font-roboto text-primary-100'>
          {isRunning ? '⏱ Studying...' : seconds > 0 ? '⏸ Paused' : 'Ready to study?'}
        </p>

        {/* Buttons */}
        <div className='flex flex-col gap-3 w-full'>

          {/* Start / Pause */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`
              w-full py-3 rounded-xl font-roboto font-bold text-white transition-colors
              ${isRunning
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-primary-600 hover:bg-primary-500'
              }
            `}
          >
            {isRunning ? '⏸ Pause' : '▶ Start'}
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className='w-full py-3 rounded-xl font-roboto font-bold border-2 border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors'
          >
            ↺ Reset
          </button>

        </div>
      </div>

      {/* Session Info */}
      <div className='border-t pt-4 flex flex-col gap-2'>
        <p className='text-xs font-roboto text-gray-400 uppercase tracking-widest'>
          Current Session
        </p>
        <p className='text-xl font-bold font-digital text-primary-600'>
          {format(seconds)}
        </p>
      </div>

    </div>
  )
}

export default StudyTimer