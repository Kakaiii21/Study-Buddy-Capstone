import { useState } from 'react'
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
  const {
    seconds, minutes, hours,
    isRunning, isActive,
    setTimer, pause, resume, stop,
  } = useTimerContext()

  const [errorMsg,     setErrorMsg]     = useState<string>('')
  const [inputHours,   setInputHours]   = useState<string>('0')
  const [inputMinutes, setInputMinutes] = useState<string>('0')
  const [inputSeconds, setInputSeconds] = useState<string>('0')

  const formatTime = (t: number): string => t.toString().padStart(2, '0')

  const handleSetTime = (): void => {
    if (isActive) {
      setErrorMsg('Please stop the current timer first')
      return
    }

    const hrs  = Math.max(0, parseInt(inputHours)   || 0)
    const mins = Math.max(0, parseInt(inputMinutes) || 0)
    const secs = Math.max(0, parseInt(inputSeconds) || 0)

    if (hrs === 0 && mins === 0 && secs === 0) { setErrorMsg('Please set a valid time'); return }
    if (hrs > 23 || mins > 59 || secs > 59)    { setErrorMsg('Invalid time values');     return }

    setErrorMsg('')
    setTimer(hrs, mins, secs)
  }

  return (
    <div className='flex flex-col h-full w-full bg-white
      px-3 xs:px-4 sm:px-5 lg:px-0 lg:pr-5 xl:px-5 2xl:px-6
      py-6 sm:py-7 lg:py-0 lg:pt-10 xl:py-6 2xl:py-6 
      gap-8 sm:gap-10 md:gap-12 lg:gap-2 xl:gap-5 2xl:gap-5
      items-start justify-start overflow-y-auto overflow-x-hidden box-border'>

      <div className='w-full flex flex-col gap-4 lg:gap-3 xl:gap-4 2xl:gap-y-10 
      rounded-2xl lg:rounded-xl
       justify-center items-center lg:bg-pink-600 xl:bg-yellow-600 2xl:bg-blue-600 bg-primary-800'>
        <p className='font-bold text-center font-inter text-white tracking-widest 
        mt-6 sm:mt-8 lg:mt-5 xl:mt-10 2xl:mt-10 text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl 2xl:text-2xl uppercase px-2'>
          Study Timer
        </p>

        {/* TIMER DISPLAY */}
        <div id='timer' className='flex items-end gap-1 xs:gap-2 flex-wrap justify-center px-2'>
          {[
            { val: formatTime(hours),   label: 'HOUR' },
            { val: formatTime(minutes), label: 'MIN'  },
            { val: formatTime(seconds), label: 'SEC'  },
          ].map((item, i) => (
            <div key={i} className='flex items-end gap-1 xs:gap-2'>
              <div className='flex flex-col items-center'>
                <span className='font-orbitron leading-none text-white text-2xl xs:text-3xl sm:text-4xl md:text-4xl lg:text-[25px] xl:text-[35px] 2xl:text-[40px]'>{item.val}</span>
                <span className='text-xs xs:text-sm sm:text-base md:text-lg font-roboto font-medium leading-none mt-1 sm:mt-2 lg:mt-1 lg:text-[14px] xl:text-[20px] 2xl:text-[20px] text-white tracking-widest'>{item.label}</span>
              </div>
              {i < 2 && (
                <div className='flex flex-col items-center'>
                  <span className='font-orbitron font-bold leading-none text-white text-2xl xs:text-3xl sm:text-4xl md:text-4xl lg:text-[20px] xl:text-[35px] 2xl:text-[40px]'>:</span>
                  <span aria-hidden className='invisible text-xs xs:text-sm sm:text-base md:text-lg font-roboto font-medium leading-none mt-1 lg:text-[18px] xl:text-[20px] 2xl:text-[40px] tracking-widest'>0</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* BUTTONS — Stop/Pause/Resume, always rendered to reserve height */}
        <div className={`flex flex-wrap justify-center gap-3 mb-0 sm:mb-10 lg:mb-4 px-2 transition-opacity ${
          isActive ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}>
          <button onClick={() => stop()}
            tabIndex={isActive ? 0 : -1}
            className='px-5 sm:px-6 lg:px-5 xl:px-3 2xl:px-10 py-2 lg:py-0 xl:py-2 2xl:py-2 
            rounded-md lg:rounded-sm
            bg-[#4A4A49] text-white font-inter font-extrabold uppercase 
            text-xs sm:text-sm lg:text-[8px] xl:text-sm 2xl:text-sm hover:bg-red-50'>
            Stop
          </button>
          <button
            onClick={() => { if (isRunning) { pause(); return } resume() }}
            tabIndex={isActive ? 0 : -1}
            className='px-5 sm:px-6 lg:px-5 xl:px-3 2xl:px-10 py-2 lg:py-0 xl:py-2 2xl:py-2 
            rounded-md lg:rounded-sm
            bg-white text-primary-800 font-inter font-extrabold uppercase 
            text-xs sm:text-sm lg:text-[8px] xl:text-sm 2xl:text-sm hover:bg-primary-700'>
            {isRunning ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <div className='flex w-full'>
        <p className='font-inter font-semibold uppercase text-left text-xs sm:text-sm md:text-md lg:text-[10px] xl:text-md 2xl:text-lg text-[#B3B3B3]'>set your study time</p>
      </div>

      {/* SET-TIMER PANEL */}
      <div className='w-full bg-white rounded-2xl p-4 sm:p-5 lg:p-4 xl:p-6 2xl:p-8 flex flex-col gap-0 border-2 border-primary-800'>
<p className={`text-red-500 text-xs lg:text-[9px] text-center font-inter mb-0 h-4 lg:h-3 transition-opacity ${
  errorMsg ? 'opacity-100' : 'opacity-0'
}`}>
  {errorMsg || '\u00A0'}
</p>

        <div className='flex flex-wrap justify-center items-end text-xs gap-x-1 xs:gap-x-0 sm:gap-x-2 lg:gap-1 xl:gap-5 2xl:gap-6 text-primary-600 mt-4 sm:mt-5 lg:mt-1 xl:mt-5 2xl:mt-6 uppercase font-roboto'>
          {[
            { label: 'Hours',   val: inputHours,   set: setInputHours,   id: 'hours'   },
            { label: 'Minutes', val: inputMinutes, set: setInputMinutes, id: 'minutes' },
            { label: 'Seconds', val: inputSeconds, set: setInputSeconds, id: 'seconds' },
          ].map((field, i) => (
            <div key={field.id} className='flex items-end'>
              <div className='flex flex-col items-center'>
                <label htmlFor={field.id} className='text-sm sm:text-md lg:text-[10px] xl:text-[15px] 2xl:text-lg text-primary-600 mb-2 sm:mb-3 lg:mb-2 xl:mb-3 2xl:mb-4'>{field.label}</label>
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
                  className='w-12 xs:w-14 sm:w-16 lg:w-14 xl:w-16 2xl:w-20 text-center border-2 border-primary-800 rounded text-lg xs:text-xl lg:text-sm xl:text-lg 2xl:text-2xl text-primary-600 mb-8 sm:mb-10 lg:mb-6 xl:mb-8 2xl:mb-10'
                />
              </div>
              {i < 2 && (
                <span className='text-sm lg:text-xs xl:text-sm 2xl:text-base font-bold text-primary-600 mb-8 sm:mb-10 lg:mb-6 xl:mb-8 2xl:mb-10 mx-0.5 leading-none'>:</span>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSetTime}
          className='w-full py-2 lg:py-[1px] xl:py-2 2xl:py-3 bg-primary-800 font-inter text-xs sm:text-sm lg:text-[10px] xl:text-[16px] 2xl:text-lg font-extrabold uppercase text-white rounded-md mb-2'
        >
          Set Timer
        </button>

        <p className='text-primary-800 mb-3 lg:mb-2 xl:mb-3 2xl:mb-4 font-inter font-normal text-xs sm:text-sm lg:text-[10px] xl:text-[15px] 2xl:text-lg uppercase text-center'>Quick Presets</p>

        <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 gap-x-2 px-2 sm:px-5 lg:px-1 xl:gap-x-5 xl:px-4 2xl:gap-x-6 2xl:px-6 w-full uppercase justify-center mb-8'>
          {PRESETS.map((p) => (
            <button
              key={p.label} 
              onClick={() => {
                setInputHours(String(p.h))
                setInputMinutes(String(p.m))
                setInputSeconds(String(p.s))
              }}
              className='px-1 w-full py-2 lg:py-[1px] xl:py-2 2xl:py-3 text-xs sm:text-sm lg:text-[9px] xl:text-[15px] 2xl:text-base uppercase bg-[#4A4A49] rounded-md text-white font-inter font-bold'
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StudyTimer