import React, {useState } from 'react'
import Sidebar from '../components/Sidebar'


function ClassSchedule() {
  const [isAddSubOpen, setIsAddSubOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedRoomType, setSelectedRoomType] = useState('')

  const days = ['Monday', 'Tuesday', 'Wednesday' , 'Thursday' , 'Friday' , 'Saturday' , 'Sunday']

  const typeRoom = ['Lecture', 'Laboratory']


  const [schedules, setSchedules] = useState<
  {
    day:string,
    subject: string,
    timeStart: string,
    timeEnd: string,
    room: string,
    roomType: string,
    instructor: string
  }[]>([])

  const formatTime = (time: string) => {
  if (!time) return ''
  const [hourStr, minute] = time.split(':')
  const hour = parseInt(hourStr)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minute} ${ampm}`
}
  const [subjectName, setSubjectName] = useState('')
  const [timeStart, setTimeStart]= useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [roomAssigned, setRoomAssigned] = useState('')
  const [instructor, setInstructor] = useState('')

const handleSave = () => {
  if (!selectedDay || !subjectName) return
  setSchedules([...schedules, {
    day: selectedDay,
    subject: subjectName,
    timeStart,
    timeEnd,
    room: roomAssigned,
    roomType: selectedRoomType,
    instructor
  }])
  setIsAddSubOpen(false)
  setSelectedDay('')
  setSubjectName('')
  setTimeStart('')
  setTimeEnd('')
  setRoomAssigned('')
  setSelectedRoomType('')
  setInstructor('')
  }

  const monSchedules  = schedules.filter(s => s.day === 'Monday')
  const tueSchedules = schedules.filter(s => s.day === 'Tuesday')
  const wedSchedule = schedules.filter(s => s.day === 'Wednesday')
  const thuSchedule = schedules.filter(s => s.day === 'Thursday')
  const friSchedule = schedules.filter(s => s.day === 'Friday')
  const satSchedule = schedules.filter(s => s.day === 'Saturday')
  //const sunSchedule = schedules.filter(s => s.day === 'Sunday')

  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-8'>
        <div className='min-h-screen flex flex-col  items-center  justify-start'>
          {/* Header */}
          <div className=' flex flex-col  lg:flex-row justify-between items-center w-full'>
            <p className='text-2xl lg:text-4xl md:text-4xl text-primary-600 font-roboto uppercase font-bold'>Class Schedule</p>
            <button 
            onClick={() => setIsAddSubOpen(true)}
            className='bg-primary-600 py-2 mt-8 lg:mt-0 px-8 text-white uppercase font-roboto text-sm rounded-md'
            >
              + Add Schedule
            </button>

            {/* Add Schedule Subject Modal*/}
            {isAddSubOpen && (
              <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                <div className='bg-primary-600 rounded-lg p-6 w-full max-w-md mx-5 shadow-lg'>
                  <h2 className='text-2xl text-white uppercase text-center font-bold font-roboto mb-4'>Add Schedule</h2>

                  {/* Day & Subject Name */}
                  <div className='flex flex-row gap-2 w-full'>
                    {/* Day */}
                    <div className='flex-1 flex flex-col'>
                      <label htmlFor='day-select' className='text-white text-md font-roboto font-medium mb-1'>DAY</label>
                      <select
                        id='day-select'
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className='border rounded-md px-3 py-2 w-full'
                      >
                        <option value='' disabled>Select a day</option>
                        {days.map((day) => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subject Name */}
                    <div className='flex-1 flex flex-col'>
                      <label htmlFor='subNtxt' className='text-white text-md font-roboto mb-1'>SUBJECT NAME</label>
                      <input
                        type='text' id='subNtxt' placeholder='ex. Math'
                        className='py-2 rounded-md pl-4 text-md w-full'
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Time Start & Time End */}
                  <div className='flex flex-row gap-2 w-full mt-4'>
                    {/* Time Start */}
                    <div className='flex-1 flex flex-col'>
                      <label htmlFor='timeStart' className='text-white text-md font-roboto mb-1'>TIME START</label>
                      <input
                        type='time' id='timeStart'
                        className='py-2 pl-4 text-md rounded-md w-full'
                        value={timeStart}
                        onChange={(e) => setTimeStart(e.target.value)}
                      />
                    </div>

                    {/* Time End */}
                    <div className='flex-1 flex flex-col'>
                      <label htmlFor='timeEnd' className='text-white text-md font-roboto mb-1'>TIME END</label>
                      <input
                        type='time' id='timeEnd'
                        value={timeEnd}
                        onChange={(e) => setTimeEnd(e.target.value)}
                        className='py-2 pl-4 text-md rounded-md w-full'
                      />
                    </div>
                  </div>

                  {/*Room Assigned & Room Type */}
                  <div className='flex flex-row gap-2 w-full mt-4'>
                    {/* Room Assigned */}
                    <div className='flex-1 flex flex-col'>
                      <label htmlFor='assignR' className='text-white uppercase text-md font-roboto mb-1'>Room Assigned</label>
                      <input
                        type='text' id='assignR' placeholder='ex. SCS 204'
                        className='py-2 pl-4 text-md rounded-md w-full'
                        value={roomAssigned}
                        onChange={(e) => setRoomAssigned(e.target.value)}
                      />
                    </div>

                    {/* Room Type */}
                    <div className='flex-1 flex flex-col'>
                      <label htmlFor='typeR' className='text-white text-md uppercase font-roboto mb-1'>Room Type</label>
                      <select
                        id='typeR'
                        value={selectedRoomType}
                        onChange={(e) => setSelectedRoomType(e.target.value)}
                        className='border rounded-md py-2 px-3 w-full'
                      >
                        <option value='' disabled>Select type</option>
                        {typeRoom.map((room) => (
                          <option key={room} value={room}>{room}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Instructor */}
                  <div className='flex flex-col mt-4'>
                    <label htmlFor='instN' className='uppercase text-white font-roboto mb-1'>Teacher / Instructor</label>
                    <input
                      type='text' id='instN' placeholder='ex. Ms. Jane Smith'
                      className='rounded-md py-2 pl-4 w-full'
                      value={instructor}
                      onChange={(e) => setInstructor(e.target.value)}
                    />
                  </div>

                  {/* Cancel & Save */}
                  <div className='flex flex-row justify-center items-center gap-6 mt-8'>
                    <button
                      onClick={() => setIsAddSubOpen(false)}
                      className='bg-white text-primary-600 uppercase font-bold font-roboto px-8 rounded-full py-1'
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className='bg-orange-500 text-white uppercase font-bold font-roboto px-8 rounded-full py-1'
                    >
                      Save
                    </button>
                  </div>

                </div>{/* ← closes inner modal box */}
              </div>  /* ← closes overlay */
            )}
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border border-pink-600 min-h-screen w-full'>
            {/*Monday Card*/}
            <div className='flex flex-col mt-7 pb-2 bg-primary-600 rounded-xl '>
              <p className='text-white  text-center text-3xl uppercase mt-4 font-fustat'>Monday</p>

              {/*Subjects Area*/}
              <div className='space-y-2 pb-5 '>

                  {/*Subjects*/}
                  {monSchedules.length > 0 ? (
                    monSchedules.map((s, i) => (
                      <div key={i} className='bg-white mt-2 py-4 px-4 mx-4 mb-1 rounded-md'>
                        <p>{s.subject}</p>
                      </div>
                    ))
                  ) : (
                    <p className='text-white text-center mt-4 lg:mt-10 mb-5 lg:mb-0 md:mb-0 font-fustat'>No scheduled class here.</p>
                  )}
                  
              </div>
            </div>

            {/*----Tuesday Card----*/}
            <div className='flex flex-col mt-7 pb-2 bg-primary-600 rounded-xl '>
              <p className='text-white  text-center text-3xl uppercase mt-4 font-fustat'>Tuesday</p>

              {/*Subjects Area*/}
              <div className='space-y-2 pb-5 '>

                  {/*Subjects*/}
                  {tueSchedules.length > 0 ? (
                    tueSchedules.map((s, i) => (

                      <div key={i} className='bg-white mt-2 p-4 mx-4 mb-1 rounded-md'>
                        <p>{s.subject}</p>
                      </div>
                    ))
                  ): (
                    <p className='text-white text-center mt-4 lg:mt-10 mb-5 lg:mb-0 md:mb-0 font-fustat'>No scheduled class here.</p>
                  )
                }
              </div>
            </div>

            {/*----Wednesday Card----*/}
            <div className='flex flex-col mt-7 pb-2 bg-primary-600 rounded-xl '>
              <p className='text-white  text-center text-3xl uppercase mt-4 font-fustat'>Wednesday</p>

              {/*Subjects Area*/}
              <div className='space-y-2 pb-5 '>

                  {/*Subjects*/}
                  {wedSchedule.length > 0 ?  (
                    wedSchedule.map((s, i )=>(
                      <div key={i} className='bg-white mt-2 p-4 mx-4 mb-1 rounded-md'>
                        <p>{s.subject}</p>
                      </div>
                    ))
                  ): (
                    <p className='text-white text-center mt-4 lg:mt-10 mb-5 lg:mb-0 md:mb-0 font-fustat'>No scheduled class here.</p>
                  )
                }
              </div>
            </div>
            {/*----Thursday Card----*/}
            <div className='flex flex-col mt-7 pb-2 bg-primary-600 rounded-xl '>
              <p className='text-white  text-center text-3xl uppercase mt-4 font-fustat'>Thrusday</p>

              {/*Subjects Area*/}
              <div className='space-y-2 pb-5 '>

                  {/*Subjects*/}
                  {thuSchedule.length > 0 ? (
                    thuSchedule.map((s,i) =>(
                      <div key={i}
                      className='bg-white mt-2 p-4 mx-4 lg:mt-10 mb-5 lg:mb-0 md:mb-0 font-fustat'>
                        <p>{s.subject}</p>
                      </div>
                    ))
                  ):(
                    <p className='text-white text-center mt-4 lg:mt-0 mb-5 lg:mb-0 md:mb-0 font-fustat'>
                      No scheduled class here.
                    </p>
                  )
                }

              </div>
            </div>
            {/*----Friday Card----*/}
            <div className='flex flex-col mt-7 pb-2 bg-primary-600 rounded-xl '>
              <p className='text-white  text-center text-3xl uppercase mt-4 font-fustat'>Friday</p>

              {/*Subjects Area*/}
              <div className='space-y-2 pb-5 '>

                  {/*Subjects*/}
                  {friSchedule.length > 0 ? (
                    friSchedule.map((s,i)=> (
                      <div key={i} 
                      className='bg-white mt-2 p-4 mx-4 lg:mt-10 mb-5 lg:mb-0 md:mb-0 font-fustat'>
                        <p>{s.subject}</p>
                      </div>
                    ))
                  ):(
                    <p
                    className='text-white text-center mt-4 lg:mt-0 mb-5 lg:mb-0 md:mb-0 font-fustat'
                    >No scheduled class here.</p>
                  )
                  }
              </div>
            </div>

            {/*----Saturday Card----*/}
            <div className='flex flex-col mt-7 pb-2 bg-primary-600 rounded-xl '>
              <p className='text-white  text-center text-3xl uppercase mt-4 font-fustat'>Saturday</p>

              {/*Subjects Area*/}
              <div className='space-y-2 pb-5 '>

                  {/*Subjects*/}
                  {satSchedule.length > 0 ? (
                    satSchedule.map((s, i)=> (
                      <div key={i}
                      className='bg-white rounded-md mt-2 p-4 mx-4 lg:mt-10 mb-5 lg:mb-0 md:mb-0 font-fustat'>
                        <p>{formatTime(s.timeStart)} - {formatTime(s.timeEnd)} : {s.subject}</p>
                      </div>
                    ))
                  ) : (
                    <p
                    className='text-white text-center mt-4 lg:mt-0 mb-5 lg:mb-0 md:mb-0 font-fustat'
                    >No Scheduled class here.</p>
                  )}
              </div>
            </div>

            <div className='flex flex-col mt-7 pb-2 bg-primary-600 rounded-xl '>
              <p className='text-white  text-center text-3xl uppercase mt-4 font-fustat'>Sunday</p>

              {/*Subjects Area*/}
              <div className='space-y-2 pb-5 '>

                  {/*Subjects
                  {sunSchedule.length > 0 ? (
                    sunSchedule.map((s,i)=>(
                      <div key={i}
                      className='bg-white mt-2 p-4 mx-4 lg:mt-10 mb-5 lg:mb-0 md:mb-0 font-fustat'>
                        <p>{s.subject}</p>
                      </div>
                    ))
                  ):(
                    <p
                    className='text-white text-center mt-4 lg:mt-0 mb-5 lg:mb-0 md:mb-0 font-fustat'
                    >No Scheduled class here.</p>
                  )}*/}
                  <div
                  className='bg-white  rounded-md mt-2 p-2 py-5 mx-4 lg:mt-10 mb-5 lg:mb-0 md:mb-0 font-fustat'>
                    <div className='flex flex-row gap-2'>
                      <p>10:40 am</p>
                      <p>:</p>
                      <p>ARALING PANLIPUNAN</p>
                    </div>

                  </div>


              </div>
            </div>
          </div>




          
        </div>
      </main>
    </div>
  )
}

export default ClassSchedule