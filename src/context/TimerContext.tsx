import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useTimer } from 'react-timer-hook'

interface TimerContextType {
  seconds: number
  minutes: number
  hours: number
  isRunning: boolean
  totalSeconds: number
  elapsedSeconds: number
  showExpired: boolean
  setShowExpired: (v: boolean) => void
  setTimer: (h: number, m: number, s: number) => void
  pause: () => void
  resume: () => void
}

const TimerContext = createContext<TimerContextType | null>(null)
const INITIAL_EXPIRY = new Date(Date.now() - 1000)

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [totalSeconds,    setTotalSeconds]   = useState(0)
  const [elapsedSeconds,  setElapsedSeconds] = useState(0)
  const [showExpired,     setShowExpired]    = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const getExpiry = (h: number, m: number, s: number): Date => {
    const t = new Date()
    t.setSeconds(t.getSeconds() + h * 3600 + m * 60 + s)
    return t
  }

  // ← useTimer FIRST so isRunning is declared before the useEffect below
  const { seconds, minutes, hours, isRunning, pause, resume, restart } = useTimer({
    expiryTimestamp: INITIAL_EXPIRY,
    autoStart: false,
    onExpire: () => {
      setShowExpired(true)
      setTotalSeconds(0)

      const audio = new Audio('/alarm.mp3')
      audio.play()

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification('Study Timer ⏰', {
            body: "Time's up! Great study session! 🎉",
            icon: '/timer.png',
          })
        })
      } else if (Notification.permission === 'granted') {
        new Notification('Study Timer ⏰', {
          body: "Time's up! Great study session! 🎉",
          icon: '/timer.png',
        })
      }
    },
  })

  // ← now isRunning is available here
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const setTimer = useCallback((h: number, m: number, s: number) => {
    setShowExpired(false)
    setElapsedSeconds(0)
    setTotalSeconds(h * 3600 + m * 60 + s)
    restart(getExpiry(h, m, s), false)
  }, [restart])

  return (
    <TimerContext.Provider value={{
      seconds, minutes, hours, isRunning,
      totalSeconds, elapsedSeconds,
      showExpired, setShowExpired,
      setTimer, pause, resume,
    }}>
      {children}
    </TimerContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTimerContext = () => {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimerContext must be used inside TimerProvider')
  return ctx
}