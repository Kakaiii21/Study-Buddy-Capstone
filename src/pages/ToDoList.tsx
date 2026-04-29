import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'

function ToDoList() {

  const [isModalOpen, setIsModalOpen]= useState(false)
  const [taskName, setTaskName]= useState('')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [taskStatus , setTaskStatus] = useState('todo')

  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-8 mt-16 lg:mt-0'>
        <div className='min-h-screen flex flex-col border '>
          {/* TOP */}
        <div className='min-w-screen flex flex-row justify-between items-center border p-2'>
          <p className=' text-5xl font-bold text-primary-600 font-roboto border' >TO DO LIST</p>
          <button onClick={()=> setIsModalOpen(true)} className=' bg-green-500 text-white font-roboto font-bold text-md py-3 px-9 rounded-md' >+ New Task</button>
        </div>

        {isModalOpen && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50' onClick={()=> setIsModalOpen(false)}>

            {/* LOOB white */}
            <div className='bg-white rounded-2xl p-12 mx-6 w-full max-w-md' onClick={(e)=> e.stopPropagation()}>
              <p className='text-center font-bold text-primary-600 text-3xl p-4 pt-1'>ADD A TASK</p>
              <label className='flex font-semibold text-primary-600 text-xl py-2'>Task</label>
              <input className='flex border-2 rounded-md border-primary-600 min-w-full my-2 py-3 px-3' 
              value={taskName} 
              onChange={(e)=>setTaskName(e.target.value)} 
              type="text" 
              placeholder="Enter Task Name"
              />


              
              {/* Suggested Tasks */}
                <div className="flex flex-col gap-1">
                  <label className='flex text-primary-600 font-semibold text-xl py-3'>Suggested Tasks:</label>
                  <div className="flex flex-wrap gap-2">
                    {['Prepare report', 'Review', 'Study', 'Plan', 'Research', 'Advance Study','Read'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setTaskName(suggestion)}
                        className="text-sm px-3 py-1 rounded-full border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              <label className='flex text-primary-600 text-xl font-semibold pt-3'>Deadline</label>
              <input className='flex border-2  rounded-md border-primary-600 min-w-full my-3 p-3'
              
              type="date" 
              placeholder="MM/DD/YYYY" />

              <div className='flex flex-row'>
                <button>CANCEL</button>
                <button>SAVE</button>
              </div>
            </div>

          </div>
        )}

        {/* TO DO CONTAINER*/}
        <div className='min-w-screen flex flex-row h-screen justify-start items-start mt-10 border-primary-600 border-2 rounded-3xl'>

          {/* TO DO */}
          <div className='flex-1 min-h-full border flex flex-col justify-start items-center p-10'>
              <div className='bg-primary-600 max-w-64 w-full p-3'>
              <p className='text-white text-xl text-center font-semibold ' >TO DO</p>
            </div>
          </div>


          {/* IN PROGRESS */}
          <div className='flex-1 min-h-full border flex flex-col justify-start items-center p-10'>
            <div className='bg-primary-600 max-w-64 w-full p-3'>
              <p className='text-white text-xl text-center font-semibold'>IN PROGRESS</p>
            </div>
          </div>
          
          {/* DONE */}
          <div className='flex-1 min-h-full border flex flex-col justify-start items-center p-10'>
            <div className='bg-primary-600 max-w-64 w-full p-3'>
              <p className='text-white text-xl text-center font-semibold'>DONE</p>
            </div>
          </div>

        </div>

        </div>
      </main>
    </div>
  )
}

export default ToDoList