import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useClassSched } from '../hooks/useClassSched'
import { useTour } from '../hooks/useTour'

function SoftDeleteModal({ itemName, onConfirm, onCancel }: { 
  itemName: string
  onConfirm: () => void
  onCancel: () => void 
}) {
  const [confirming, setConfirming] = useState(false)  // ← add this

  const handleConfirm = () => {
    if (confirming) return          // ← block double click
    setConfirming(true)
    onConfirm()
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
        <div className='flex items-center gap-3 mb-3'>
          <img src="/delete.png" alt="deleteicon" className='w-7 h-7' />
          <h2 className='text-lg font-bold text-gray-800'>Move to Recently Deleted?</h2>
        </div>
        <p className='text-sm text-gray-500 mb-1'>
          <span className='font-semibold text-gray-700'>"{itemName}"</span> will be moved to{' '}
          <span className='font-semibold text-primary-600'>Recently Deleted</span>.
        </p>
        <p className='text-xs text-gray-400 mb-6'>
          You can restore it anytime within <span className='font-semibold text-red-400'>30 days</span>, after which it will be permanently deleted.
        </p>
        <div className='flex gap-3 justify-end'>
          <button 
            onClick={onCancel} 
            disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40'
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60'
          >
            {confirming ? 'Deleting...' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  )
}
function ClearScheduleModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
        <div className='flex items-center gap-3 mb-3'>
          <img src="/delete.png" alt="delete icon" className='w-7 h-7' />
          <h2 className='text-lg font-bold text-gray-800'>Clear All Schedules?</h2>
        </div>
        <p className='text-sm text-gray-500 mb-1'>
          This will  delete{' '}
          <span className='font-semibold text-gray-700'>all subjects</span> from your class schedule.
        </p>
        <p className='text-xs text-gray-400 mb-6'>
          This action <span className='font-semibold text-red-400'>cannot be undone</span>.
        </p>
        <div className='flex gap-3 justify-end'>
          <button
            onClick={onCancel}
            className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors'
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}

function ClassSchedule() {
  const { user } = useAuth()
  const { schedules, loading, addSchedule, updateSchedule, deleteSchedule } = useClassSched(user)

  const [isAddSubOpen, setIsAddSubOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedRoomType, setSelectedRoomType] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [roomAssigned, setRoomAssigned] = useState('')
  const [instructor, setInstructor] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [menuOpenIndex, setMenuOpenIndex] = useState<string | null>(null)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [showClearModal, setShowClearModal] = useState(false)

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const typeRoom = ['Lecture', 'Laboratory']
  const { startTour } = useTour(
    'classschedule',
    false,
    () => {},
    () => {},
    user
  )
  const formatTime = (time: string) => {
    if (!time) return ''
    const [hourStr, minute] = time.split(':')
    const hour = parseInt(hourStr)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minute} ${ampm}`
  }

    const resetForm = () => {
      setSelectedDay(''); setSubjectName(''); setTimeStart(''); setTimeEnd('')
      setRoomAssigned(''); setSelectedRoomType(''); setInstructor('')
      setFieldErrors({}); setEditTargetId(null)  // ← replace setFormError with setFieldErrors
    }
    const errClass = (field: string) =>
  fieldErrors[field] ? 'border-2 border-red-400 bg-red-50' : ''

    
const handleSave = () => {
  const errors: Record<string, string> = {}
  if (!selectedDay) errors.selectedDay = 'Required'
  if (!subjectName.trim()) errors.subjectName = 'Required'
  if (!timeStart) errors.timeStart = 'Required'
  if (!timeEnd) errors.timeEnd = 'Required'
  if (!roomAssigned.trim()) errors.roomAssigned = 'Required'
  if (!selectedRoomType) errors.selectedRoomType = 'Required'
  if (!instructor.trim()) errors.instructor = 'Required'

  if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }

  if (timeEnd <= timeStart) {
    setFieldErrors({ timeEnd: 'Must be later than start time' })
    return
  }

  const conflictExists = schedules
    .filter(s => s.day === selectedDay && s.id !== editTargetId)
    .some(s => {
      const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
      return toMinutes(timeStart) < toMinutes(s.timeEnd) && toMinutes(timeEnd) > toMinutes(s.timeStart)
    })

  if (conflictExists) {
    setFieldErrors({ timeStart: 'Time conflict', timeEnd: `${selectedDay} already has a class during this time` })
    return
  }

  // ✅ capture before resetForm clears it
  const targetId = editTargetId
  const snap = { day: selectedDay, subject: subjectName, timeStart, timeEnd, room: roomAssigned, roomType: selectedRoomType, instructor }

  setIsAddSubOpen(false)
  resetForm()

  if (targetId) {
    updateSchedule(targetId, snap)
  } else {
    addSchedule(snap.day, snap.subject, snap.timeStart, snap.timeEnd, snap.room, snap.roomType, snap.instructor)
  }
}
  async function handleDelete() {
    if (!pendingDelete) return
    await deleteSchedule(pendingDelete.id)
    setPendingDelete(null)
  }

    async function handleClearAll() {
      await Promise.all(schedules.map(s => deleteSchedule(s.id)))
      setShowClearModal(false)
    }


  const handleEditOpen = (s: { id: string; day: string; subject: string; timeStart: string; timeEnd: string; room: string; roomType: string; instructor: string }) => {
    setSelectedDay(s.day)
    setSubjectName(s.subject)
    setTimeStart(s.timeStart)
    setTimeEnd(s.timeEnd)
    setRoomAssigned(s.room)
    setSelectedRoomType(s.roomType)
    setInstructor(s.instructor)
    setEditTargetId(s.id)
    setMenuOpenIndex(null)
    setIsAddSubOpen(true)
  }

  const byDay = (day: string) =>
    schedules.filter(s => s.day === day).sort((a, b) => a.timeStart.localeCompare(b.timeStart))

  const DayCard = ({ day }: { day: string }) => {
    const daySchedules = byDay(day)
    return (
      <div id='scheduleGrid'
      className='flex flex-col mt-7 pb-2 bg-primary-600 
      bg-gradient-to-br from-[#0f1f3a] to-[#0b1730]
        rounded-2xl

      
      border border-white/10
        hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]
        transition-all duration-300
        self-start w-full'>
        <p className='text-white text-center text-[25px] md:text-3xl lg:text-[29px] xl:text-[30px] 2xl:text-3xl uppercase mt-4 font-fustat'>{day}</p>
        <div className='space-y-2 pb-5'>
          {daySchedules.length > 0 ? (
            daySchedules.map((s) => (
              <div key={s.id} className='bg-white  mt-2 p-4 mx-4 mb-1 rounded-md relative'>
                <div className='flex flex-row'>
                  <p className=' text-[18px] md:text-[20px] lg:text-[21px] xl:text-[22px] 2xl:text-[23px] font-roboto font-bold text-primary-600'>{s.subject}</p>

                  <div data-note-menu className='relative ml-auto '>
                    <button
                    id='scheduleOptionsBtn'
                    className='hover:opacity-50'
                      title='More Options'
                      onClick={() => setMenuOpenIndex(menuOpenIndex === s.id ? null : s.id)}
                    >
                      <img src="subM.png" alt="menu" className='h-[5px] w-[28px]' />
                    </button>

                    {menuOpenIndex === s.id && (
                      <>
                        <div className='fixed inset-0 z-0' onClick={() => setMenuOpenIndex(null)} />
                        <div className='absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-36 py-1'>
                          <button
                            onClick={() => handleEditOpen(s)}
                            className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                          >
                            <img className='w-5 h-5' src="edit.png" alt="edit icon" />Edit
                          </button>
                          <hr className='my-1 border-gray-100' />
                          <button
                            onClick={() => {
                              setMenuOpenIndex(null)
                              setPendingDelete({ id: s.id, name: s.subject })
                            }}
                            className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-red-50 font-semibold'
                          >
                            <img src="delete.png" alt="delete icon" className='w-5 h-5' />Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <p className='text-[16px] md:text-[16px] lg:text-[16px] xl:text-[18px] 2xl:text-[20px] font-roboto text-primary-600'>
                  {formatTime(s.timeStart)} - {formatTime(s.timeEnd)} — {s.room} [ {s.roomType} ]
                </p>
                <p className='text-sm   text-gray-600'>{s.instructor}</p>
              </div>
            ))
          ) : (
            <p className='text-white  text-center mt-4 lg:mt-10 mb-5 lg:mb-0 font-fustat'>No scheduled class here.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen'>
      
      <div className='p-3 '>
       <Sidebar /> 
      </div>
      <main className='flex-1 overflow-auto p-8'>
        <div className='min-h-screen flex flex-col items-center justify-start'>

          {/* Header */}
          <div className='flex flex-col md:flex-row lg:flex-row  justify-between items-center w-full'>
            <p className='text-2xl lg:text-4xl lg:ml-0 md:ml-12 md:text-4xl text-primary-600 font-roboto uppercase font-bold'>Class Schedule</p>
            <hr className='lg:hidden md:hidden w-full border-t mt-3 border-primary-600' />
              <div className='flex flex-row gap-3 lg:gap-10'>

                <button
                  id='addScheduleBtn'
                  onClick={() => { resetForm(); setIsAddSubOpen(true) }}
                  className='bg-primary-600 hover:bg-white font-bold hover:text-primary-600 
                  py-2 px-3 mt-2 md:mt-0 lg:mt-0 
                  md:py-3 md:px-4 lg:px-4 xl:px-4 2xl:px-4 
                  lg:text-[15px] xl:text-[15px] 2xl:text-[15px]
                  text-white uppercase font-roboto text-xs
                  shadow-[0_4px_8px_rgba(0,0,0,0.35)]
                  rounded-md backdrop-blur-xs
                  hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.5)]
                  transition-all duration-300'
                >
                  + Add Schedule
                </button>

                <button
                  id='clearScheduleBtn'
                  onClick={() => setShowClearModal(true)}
                  className='bg-red-700 text-xs hover:bg-red-500 border border-red-400/30 font-bold hover:text-white 
                  py-2 px-3 mt-2 md:mt-0 lg:mt-0 
                  md:py-3 md:px-4 lg:px-4 xl:px-4 2xl:px-4 
                  lg:text-[15px] xl:text-[15px] 2xl:text-[15px]
                  text-white uppercase font-roboto 
                  shadow-[0_4px_8px_rgba(220,38,38,0.35)]
                  rounded-md backdrop-blur-xs
                  hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(220,38,38,0.5)]
                  transition-all duration-300'
                >
                  Clear Schedule
                </button>


              </div>
          </div>
          <hr className='hidden md:block sm:block w-full border-t mt-3 border-primary-600 mb-6' />

          {/* Add / Edit Modal */}
          {isAddSubOpen && (
            <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
              <div className='bg-primary-600 rounded-lg p-6 w-full max-w-md mx-5 shadow-lg'>
                <h2 className='text-2xl text-white uppercase text-center font-bold font-roboto mb-4'>
                  {editTargetId ? 'Edit Schedule' : 'Add Schedule'}
                </h2>

                <div className='flex flex-row gap-2 w-full'>
                  <div className='flex-1 flex flex-col'>
                    <label className='text-white text-md font-roboto font-medium mb-1'>DAY</label>
                    <select aria-label='Select Day' value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className={`border rounded-md px-3 py-2 w-full ${errClass('selectedDay')}`}>
                      <option value='' disabled>Select a day</option>
                      {days.map((day) => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </div>
                  <div className='flex-1 flex flex-col'>
                    <label className='text-white text-md font-roboto mb-1'>SUBJECT NAME</label>
                    <input type='text' placeholder='Enter Subject' className={`py-2 rounded-md pl-4 text-md w-full ${errClass('subjectName')}`} 
                      value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
                  </div>
                </div>

                <div className='flex flex-row gap-2 w-full mt-4'>
                  <div className='flex-1 flex flex-col'>
                    <label className='text-white text-md font-roboto mb-1'>TIME START</label>
                    <input aria-label='Time Start' type='time' className={`py-2 pl-4 text-md rounded-md w-full ${errClass('timeStart')}`}
                      value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
                  </div>
                  <div className='flex-1 flex flex-col'>
                    <label className='text-white text-md font-roboto mb-1'>TIME END</label>
                    <input aria-label='Time End' type='time' className={`py-2 pl-4 text-md rounded-md w-full ${errClass('timeEnd')}`}
                      value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
                  </div>
                </div>

                <div className='flex flex-row gap-2 w-full mt-4'>
                  <div className='flex-1 flex flex-col'>
                    <label className='text-white uppercase text-md font-roboto mb-1'>Room Assigned</label>
                    <input type='text' placeholder='Enter Room' className={`py-2 pl-4 text-md rounded-md w-full ${errClass('roomAssigned')}`}
                      value={roomAssigned} onChange={(e) => setRoomAssigned(e.target.value)} />
                  </div>
                  <div className='flex-1 flex flex-col'>
                    <label className='text-white text-md uppercase font-roboto mb-1'>Room Type</label>
                    <select aria-label='Select Room Type' value={selectedRoomType} onChange={(e) => setSelectedRoomType(e.target.value)} className={`border rounded-md py-2 px-3 w-full ${errClass('selectedRoomType')}`}>
                      <option value='' disabled>Select type</option>
                      {typeRoom.map((room) => <option key={room} value={room}>{room}</option>)}
                    </select>
                  </div>
                </div>

                <div className='flex flex-col mt-4'>
                  <label className='uppercase text-white font-roboto mb-1'>Teacher / Instructor</label>
                  <input type='text' placeholder='Enter Teacher/Instructor Name' className={`rounded-md py-2 pl-4 w-full ${errClass('instructor')}`}
                    value={instructor} onChange={(e) => setInstructor(e.target.value)} />
                </div>

                  {(fieldErrors.timeEnd?.includes('already has') || fieldErrors.timeEnd?.includes('later')) && (
                    <p className='text-yellow-300 text-sm text-center font-roboto mt-4'>{fieldErrors.timeEnd}</p>
                  )}
                  {Object.keys(fieldErrors).length > 0 && !fieldErrors.timeEnd?.includes('already has') && !fieldErrors.timeEnd?.includes('later') && (
                    <p className='text-yellow-300 text-sm text-center font-roboto mt-4'>Please fill in all highlighted fields.</p>
                  )}
                <div className='flex flex-row justify-center items-center gap-6 mt-6'>
                  <button onClick={() => { setIsAddSubOpen(false); resetForm() }}
                    className='bg-white text-primary-600 uppercase font-bold font-roboto px-8 rounded-full py-1'>
                    Cancel
                  </button>
                  <button onClick={handleSave}
                    className='bg-orange-500 text-white uppercase font-bold font-roboto px-8 rounded-full py-1'>
                    {editTargetId ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Day Cards */}
          {loading ? (
            <div className='flex-1 flex items-center justify-center text-primary-400 text-xl mt-10'>
              Loading schedules...
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6 w-full  items-start'>
              {days.map((day) => <DayCard key={day} day={day} />)}
            </div>
          )}
        </div>

        {/* Soft Delete Modal — rendered at root level, outside DayCard */}
        {pendingDelete && (
          <SoftDeleteModal
            itemName={pendingDelete.name}
            onConfirm={handleDelete}
            onCancel={() => setPendingDelete(null)}
          />
        )}
        {showClearModal && (
            <ClearScheduleModal
              onConfirm={handleClearAll}
              onCancel={() => setShowClearModal(false)}
            />
          )}

          <button
            id='tour-btn'
            onClick={() => startTour()}
            className='fixed bottom-6 right-6 z-50
              flex flex-col items-center gap-1
              hover:opacity-80 active:scale-95 transition-all
              lg:bottom-8 lg:right-8'
            title='Take a Tour'
          >
            <div className='bg-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl font-bold'>
              <img src="/needhelp.png" alt="?" className='w-12 block mx-auto mt-1' />
            </div>
            <p className='text-xs text-primary-600 font-inter font-medium'>Need Help?</p>
          </button>
      </main>
    </div>
  )
}

export default ClassSchedule