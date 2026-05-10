import { useTimerContext } from '../context/TimerContext'

function ExpiredAlert() {
  const { showExpired, setShowExpired } = useTimerContext()
  if (!showExpired) return null

  return (
    <div className='fixed top-0 left-0 right-0 z-[99999] bg-primary-600 text-white text-center py-3 font-bold flex items-center justify-center gap-4'>
      <span>⏰ Time's up! Great study session! 🎉</span>
      <button
        onClick={() => setShowExpired(false)}
        className='bg-white text-primary-600 text-xs font-bold px-3 py-1 rounded-lg'
      >
        Dismiss
      </button>
    </div>
  )
}

export default ExpiredAlert