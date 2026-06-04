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
const STORAGE_KEY = 'studyTimer'
const INITIAL_EXPIRY = new Date(Date.now() - 1000)

// ── Read persisted state from sessionStorage on startup ──────────────────────
function loadPersistedTimer(): {
  expiryTimestamp: Date
  totalSeconds: number
  elapsedSeconds: number
  wasRunning: boolean
} {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { expiryTimestamp: INITIAL_EXPIRY, totalSeconds: 0, elapsedSeconds: 0, wasRunning: false }

    const { expiryMs, totalSeconds, elapsedSeconds, wasRunning } = JSON.parse(raw)
    const expiryTimestamp = new Date(expiryMs)

    // If the timer already expired while the page was closed, treat as fresh
    if (expiryTimestamp <= new Date()) {
      sessionStorage.removeItem(STORAGE_KEY)
      return { expiryTimestamp: INITIAL_EXPIRY, totalSeconds: 0, elapsedSeconds: 0, wasRunning: false }
    }

    return { expiryTimestamp, totalSeconds, elapsedSeconds, wasRunning }
  } catch {
    return { expiryTimestamp: INITIAL_EXPIRY, totalSeconds: 0, elapsedSeconds: 0, wasRunning: false }
  }
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const persisted = loadPersistedTimer()

  const [totalSeconds,   setTotalSeconds]   = useState(persisted.totalSeconds)
  const [elapsedSeconds, setElapsedSeconds] = useState(persisted.elapsedSeconds)
  const [showExpired,    setShowExpired]     = useState(false)
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

  const { seconds, minutes, hours, isRunning, pause, resume, restart } = useTimer({
    expiryTimestamp: persisted.expiryTimestamp,
    autoStart: persisted.wasRunning,
    onExpire: () => {
      setShowExpired(true)
      setTotalSeconds(0)
      sessionStorage.removeItem(STORAGE_KEY)

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

  // ── Elapsed seconds ticker ────────────────────────────────────────────────
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

  // ── Persist to sessionStorage on every tick ───────────────────────────────
  useEffect(() => {
    if (totalSeconds === 0) return // nothing to persist
    const expiryMs = new Date(
      Date.now() + (hours * 3600 + minutes * 60 + seconds) * 1000
    ).getTime()
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ expiryMs, totalSeconds, elapsedSeconds, wasRunning: isRunning })
    )
  }, [seconds, minutes, hours, isRunning, totalSeconds, elapsedSeconds])

  const setTimer = useCallback((h: number, m: number, s: number) => {
    setShowExpired(false)
    setElapsedSeconds(0)
    const total = h * 3600 + m * 60 + s
    setTotalSeconds(total)
    const expiry = getExpiry(h, m, s)
    restart(expiry, false)
    // Persist immediately so a quick refresh before the first tick still works
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ expiryMs: expiry.getTime(), totalSeconds: total, elapsedSeconds: 0, wasRunning: false })
    )
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