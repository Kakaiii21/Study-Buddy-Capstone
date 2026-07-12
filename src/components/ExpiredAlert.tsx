import { useTimerContext } from "../context/TimerContext"

function ExpiredAlert() {
  const { showExpired, setShowExpired } = useTimerContext()
  if (!showExpired) return null

  return (
    <div className='fixed top-0 left-0 right-0 z-[99999] bg-primary-600 text-white text-center py-3 lg:py-1 font-bold flex items-center justify-center gap-4'>
      <span className="font-serif font-medium text-sm lg:text-[12px] "> Time's up! Great study session! </span>
      <button
        onClick={() => setShowExpired(false)}
        className='bg-white text-primary-600 text-xs lg:text-[10px] font-bold px-3 py-1 lg:py-0 rounded-lg lg:rounded-sm'
      >
        Dismiss
      </button>
    </div>
  )
}

export default ExpiredAlert