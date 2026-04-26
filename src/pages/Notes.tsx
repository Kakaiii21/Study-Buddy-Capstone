import React from 'react'
import Sidebar from '../components/Sidebar'

function Notes() {
  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-8 mt-16 lg:mt-0'>
        <div className='min-h-screen flex flex-col items-center justify-center'>
          <h1>Welcome to Notes Module</h1>
        </div>
      </main>
    </div>
  )
}

export default Notes