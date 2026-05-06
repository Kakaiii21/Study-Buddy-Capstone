import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useClassSched } from '../hooks/useClassSched'

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
  const [formError, setFormError] = useState('')

  const [menuOpenIndex, setMenuOpenIndex] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const typeRoom = ['Lecture', 'Laboratory']

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
    setFormError(''); setEditTargetId(null)
  }

  const handleSave = async () => {
    if (!selectedDay || !subjectName || !timeStart || !timeEnd || !roomAssigned || !selectedRoomType || !instructor) {
      setFormError('Please fill in all fields before saving.')
      return
    }
    if (timeEnd <= timeStart) {
      setFormError('Time End must be later than Time Start.')
      return
    }

    const conflictExists = schedules
      .filter(s => s.day === selectedDay && s.id !== editTargetId)
      .some(s => {
        const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
        return toMinutes(timeStart) < toMinutes(s.timeEnd) && toMinutes(timeEnd) > toMinutes(s.timeStart)
      })

    if (conflictExists) {
      setFormError(`Time conflict! ${selectedDay} already has a class scheduled during that time.`)
      return
    }

    if (editTargetId) {
      await updateSchedule(editTargetId, {
        day: selectedDay, subject: subjectName, timeStart, timeEnd,
        room: roomAssigned, roomType: selectedRoomType, instructor,
      })
    } else {
      await addSchedule(selectedDay, subjectName, timeStart, timeEnd, roomAssigned, selectedRoomType, instructor)
    }

    setIsAddSubOpen(false)
    resetForm()
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

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    await deleteSchedule(deleteConfirmId)
    setDeleteConfirmId(null)
  }

  const byDay = (day: string) =>
    schedules.filter(s => s.day === day).sort((a, b) => a.timeStart.localeCompare(b.timeStart))

  // Reusable schedule card per day
  const DayCard = ({ day }: { day: string }) => {
    const daySchedules = byDay(day)
    return (
      <div className='flex flex-col mt-7 pb-2 bg-primary-600 rounded-xl self-start w-full'>
        <p className='text-white text-center text-3xl uppercase mt-4 font-fustat'>{day}</p>
        <div className='space-y-2 pb-5'>
          {daySchedules.length > 0 ? (
            daySchedules.map((s) => (
              <div key={s.id} className='bg-white mt-2 p-4 mx-4 mb-1 rounded-md relative'>
                <div className='flex flex-row'>
                  <p className='text-xl font-roboto font-bold text-primary-600'>{s.subject}</p>

                  {/* 3-dot menu */}
                  <div data-note-menu className='relative ml-auto'>
                    <button
                      onClick={() => setMenuOpenIndex(menuOpenIndex === s.id ? null : s.id)}
                    >
                      <img src="subM.png" alt="menu" className='h-[5px] w-[28px]' />
                    </button>

                    {menuOpenIndex === s.id && (
                      <>
                        <div className='fixed inset-0 z-0' onClick={() => setMenuOpenIndex(null)} />
                        <div className='absolute right-0 top-6 bg-white border rounded-md shadow-lg z-10 w-28'>
                          <button
                            onClick={() => handleEditOpen(s)}
                            className='w-full flex gap-3 font-bold text-left px-4 py-3 text-md text-primary-600 hover:bg-gray-100 font-roboto'
                          >
                            <img src='edit.png' alt='edit icon' className='h-5 w-5' /> Edit
                          </button>
                          <hr className='border-primary-600 mx-2' />
                          <button
                            onClick={() => { setDeleteConfirmId(s.id); setMenuOpenIndex(null) }}
                            className='w-full flex gap-2 font-bold text-left px-4 py-2 text-md text-primary-600 hover:bg-gray-100 font-roboto'
                          >
                            <img src='delete.png' alt='delete icon' className='h-5 w-5' /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <p className='text-md font-roboto font-medium text-primary-600'>
                  {formatTime(s.timeStart)} - {formatTime(s.timeEnd)} — {s.room} [ {s.roomType} ]
                </p>
                <p className='text-sm text-gray-600'>{s.instructor}</p>
              </div>
            ))
          ) : (
            <p className='text-white text-center mt-4 lg:mt-10 mb-5 lg:mb-0 font-fustat'>No scheduled class here.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-8'>
        <div className='min-h-screen flex flex-col items-center justify-start'>

          {/* Header */}
          <div className='flex flex-col  md:flex-row lg:flex-row justify-between items-center w-full'>
            <p className='text-2xl lg:text-4xl lg:ml-0 md:ml-12 md:text-4xl text-primary-600 font-roboto uppercase font-bold'>Class Schedule</p>
            <button
              onClick={() => { resetForm(); setIsAddSubOpen(true) }}
              className='bg-primary-600 hover:bg-primary-100 font-bold hover:text-primary-600 py-4 md:py-4 mt-8 md:mt-0 lg:mt-0 px-8 text-white uppercase font-roboto text-sm rounded-md'
            >
              + Add Schedule
            </button>
          </div>
          <hr className='w-full border-t mt-3 border-primary-600 mb-6' />


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
                    <select
                    aria-label='Select Day'
                    value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className='border rounded-md px-3 py-2 w-full'>
                      <option value='' disabled>Select a day</option>
                      {days.map((day) => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </div>
                  <div className='flex-1 flex flex-col'>
                    <label className='text-white text-md font-roboto mb-1'>SUBJECT NAME</label>
                    <input type='text' placeholder='Enter Subject Name' className='py-2 rounded-md pl-4 text-md w-full'
                      value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
                  </div>
                </div>

                <div className='flex flex-row gap-2 w-full mt-4'>
                  <div className='flex-1 flex flex-col'>
                    <label className='text-white text-md font-roboto mb-1'>TIME START</label>
                    <input aria-label='Time Start' type='time' className='py-2 pl-4 text-md rounded-md w-full'
                      value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
                  </div>
                  <div className='flex-1 flex flex-col'>
                    <label className='text-white text-md font-roboto mb-1'>TIME END</label>
                    <input aria-label='Time End' type='time' className='py-2 pl-4 text-md rounded-md w-full'
                      value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
                  </div>
                </div>

                <div className='flex flex-row gap-2 w-full mt-4'>
                  <div className='flex-1 flex flex-col'>
                    <label className='text-white uppercase text-md font-roboto mb-1'>Room Assigned</label>
                    <input type='text' placeholder='Enter Room' className='py-2 pl-4 text-md rounded-md w-full'
                      value={roomAssigned} onChange={(e) => setRoomAssigned(e.target.value)} />
                  </div>
                  <div className='flex-1 flex flex-col'>
                    <label className='text-white text-md uppercase font-roboto mb-1'>Room Type</label>
                    <select
                    aria-label='Select Day'
                    value={selectedRoomType} onChange={(e) => setSelectedRoomType(e.target.value)} className='border rounded-md py-2 px-3 w-full'>
                      <option value='' disabled>Select type</option>
                      {typeRoom.map((room) => <option key={room} value={room}>{room}</option>)}
                    </select>
                  </div>
                </div>

                <div className='flex flex-col mt-4'>
                  <label className='uppercase text-white font-roboto mb-1'>Teacher / Instructor</label>
                  <input type='text' placeholder='Enter Teacher/Instructor Name' className='rounded-md py-2 pl-4 w-full'
                    value={instructor} onChange={(e) => setInstructor(e.target.value)} />
                </div>

                {formError && <p className='text-yellow-300 text-sm text-center font-roboto mt-4'>{formError}</p>}

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
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-start'>
              {days.map((day) => <DayCard key={day} day={day} />)}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 w-full max-w-sm mx-5 shadow-lg'>
              <h2 className='text-xl font-bold font-roboto text-primary-600 text-center mb-2'>Delete Schedule</h2>
              <p className='text-center text-gray-600 font-roboto mb-6'>Are you sure you want to delete this class?</p>
              <div className='flex flex-row justify-center gap-6'>
                <button onClick={() => setDeleteConfirmId(null)}
                  className='bg-gray-200 text-primary-600 uppercase font-bold font-roboto px-8 rounded-full py-1'>
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className='bg-red-500 text-white uppercase font-bold font-roboto px-8 rounded-full py-1'>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ClassSchedule