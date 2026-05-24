import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'


type DeletedItem = {
  id: string
  name: string
  type: string
  deletedAt: string
}

const ITEMS: DeletedItem[] = [
  { id: '1', name: 'The Kingdom',     type: 'Notes',           deletedAt: '2025-05-20' },
  { id: '2', name: 'Story Telling',   type: 'Notes',           deletedAt: '2025-05-21' },
  { id: '3', name: 'Math Homework',   type: 'To Do',           deletedAt: '2025-05-18' },
  { id: '4', name: 'Week 3 Lecture',  type: 'Class Schedule',  deletedAt: '2025-05-17' },
  { id: '5', name: 'Bio Study Plan',  type: 'Study Generator', deletedAt: '2025-05-15' },
]

const PAGE_TYPES = ['To Do', 'Notes', 'Class Schedule', 'Course', 'Study Generator', 'Generated History']

function RecentlyDeleted() {
  const [selectedType, setSelectedType] = useState('To Do')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = ITEMS.filter((item) => {
    const matchesType = item.type === selectedType
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div className='flex h-screen'>
      <Sidebar />

      <main className='flex-1 overflow-auto p-4 md:p-8 mt-1 lg:mt-0'>
        <div className='min-h-screen flex flex-col'>

          {/* Header */}
          <div className='flex flex-col md:flex-row lg:flex-row lg:items-center w-full gap-3 mb-6 lg:mt-0 mt-4'>
            <p className='text-2xl lg:ml-0 md:ml-16 md:text-4xl lg:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
              Recently Deleted
            </p>
          </div>
          <hr className='w-full border-t border-primary-600 mb-6' />

          {/* Dropdown and Search Bar */}
          <div className='flex flex-row justify-end items-center gap-3 mb-7'>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className='border-2 border-primary-600 rounded-lg px-4 py-2 text-primary-600 font-semibold bg-white focus:outline-none text-sm'
              aria-label='Filter by page type'
            >
              {PAGE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type='text'
              placeholder='Search...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full sm:w-72 border-2 border-primary-600 rounded-full px-4 py-2 text-primary-600 bg-white focus:outline-none text-sm'
            />
          </div>

          {/* Table header */}
          <div className='grid grid-cols-[1fr_auto_auto] gap-4 pb-3 border-b border-gray-200 text-gray-500 text-xs font-medium px-3'>
            <p>Name</p>
            <p className='w-16 text-center'>Restore</p>
            <p className='w-16 text-center'>Delete</p>
          </div>

          {/* Rows */}
          <ul className='divide-y divide-gray-100'>
            {filtered.map((item) => (
              <li
                key={item.id}
                className='grid grid-cols-[1fr_auto_auto] gap-4 items-center py-4 px-3 hover:bg-gray-50 rounded-xl transition-colors'
              >
                <p className='font-medium text-gray-700 text-xl'>{item.name}</p>

                {/* Restore */}
                <div className='w-16 flex justify-center'>
                  <button aria-label={`Restore ${item.name}`} className='p-2 rounded-lg hover:bg-primary-50 transition-colors'>
                    <img src='/Restore.png' alt='Restore' className='w-8 h-8' />
                  </button>
                </div>

                {/* Delete */}
                <div className='w-16 flex justify-center'>
                  <button aria-label={`Delete ${item.name}`} className='p-2 rounded-lg hover:bg-red-50 transition-colors'>
                    <img src='/delete.png' alt='Delete' className='w-7 h-7' />
                  </button>
                </div>
              </li>
            ))}
          </ul>

        </div>
      </main>
    </div>
  )
}

export default RecentlyDeleted