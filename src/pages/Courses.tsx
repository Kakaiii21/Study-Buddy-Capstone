import React from 'react'
import Sidebar from '../components/Sidebar'

function Courses() {
  return (
    <div className='flex h-screen'>
    <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 mt-16 lg:mt-0">
        <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-primary-500 mb-6">
        Welcome to Course Module!
      </h1>
      </div>

    </main>
    </div>
  )
}


export default Courses