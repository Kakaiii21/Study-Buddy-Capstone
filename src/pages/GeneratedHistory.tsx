import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'

function GeneratedHistory() {
  const [selectedGen, setSelectedGen] = useState('Quiz')
  const [searchQuery, setSearchQuery] = useState('')

  const genOption = ['Quiz', 'Flashcard']


const recentData = [
  {
    id: 1,
    type: 'Quiz',
    title: 'IT 65 - Lesson 1 & 2',
    date: '09/01/26',
    score: 10,
    items: 20,
  },
  {
    id: 2,
    type: 'Quiz',
    title: 'IT 64 - Lesson 1 & 2',
    date: '09/01/26',
    score: 16,
    items: 30,
  },
  {
    id: 3,
    type: 'Flashcard',
    title: 'Database Flashcards',
    date: '09/01/26',
    items: 15,
  },
]
const filteredData = recentData.filter((item) => {
  const matchesSearch = item.title
    .toLowerCase()
    .includes(searchQuery.toLowerCase())

  const matchesType = item.type === selectedGen

  return matchesSearch && matchesType
})

  return (
    <div className='flex h-screen'>
      <Sidebar />

      <main className='flex-1 overflow-auto p-8 mt-1'>
        <div className='min-h-screen flex flex-col'>

          {/* Header */}
          <div className='flex flex-col md:flex-row lg:flex-row lg:items-center w-full gap-3 mb-6'>
            <p className='text-2xl lg:ml-0 md:ml-16 md:text-4xl lg:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
               Generated History
            </p>
          </div>

          <hr className="w-full border-t border-primary-600 mb-6" />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-6">

            {/* Dropdown */}
            <select
              value={selectedGen}
              aria-label="Generation Type"
              onChange={(e) => setSelectedGen(e.target.value)}
              className="border-2 border-primary-600 rounded-lg px-4 py-2 text-primary-600 font-semibold bg-white focus:outline-none"
            >
              {genOption.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 border-2 border-primary-600 rounded-full px-4 py-2 text-primary-600 bg-white focus:outline-none"
            />
          </div>

          {/* Recent */}
          <div className="flex items-center gap-3 mb-4">
            <p className="whitespace-nowrap text-primary-600 font-semibold">
              Recent
            </p>

            <hr className="flex-1 border-t border-primary-100" />
          </div>

          <div className='w-full overflow-x auto'>

            <div className='min-w-[720px'>
          {/* Quiz Table */}
          {selectedGen === 'Quiz' && (
            <>
              {/* Header */}
              <div className="hidden md:grid grid-cols-[1.8fr_.5fr_.5fr_.4fr_.4fr_.4fr] gap-4 pb-3 border-b text-gray-500 text-sm font-medium">

                <p>Name</p>
                <p className="text-center">Score</p>
                <p className="text-center">Items</p>
                <p className="text-center">View</p>
                <p className="text-center">Retake</p>
                <p className="text-center">Delete</p>
              </div>

              {/* Rows */}
              {filteredData.map((item) => (
                <div
                  key={item.id}
                  className="border-b py-4"
                >

                  {/* Desktop */}
                  <div className="grid grid-cols-[1.8fr_.5fr_.5fr_.4fr_.4fr_.4fr] gap-4 items-center">

                  <div className="min-w-0">
                    <p className="text-sm md:text-xl lg:text-2xl font-semibold text-primary-600 
                                  whitespace-normal sm:truncate">
                      {item.title}
                    </p>

                    <p className="text-xs md:text-sm text-gray-400">
                      {item.date}
                    </p>
                  </div>

                    <p className="text-center text-lg text-primary-600">
                      {item.score}
                    </p>

                    <p className="text-center text-lg text-primary-600">
                      {item.items}
                    </p>

                    <div className="flex justify-center">
                      <img
                        src="/View.png"
                        alt="View"
                        className="w-6 h-6 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-center">
                      <img
                        src="/Retake.png"
                        alt="Retake"
                        className="w-6 h-6 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-center">
                      <img
                        src="/delete.png"
                        alt="Delete"
                        className="w-6 h-6 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Flashcard Table */}
          {selectedGen === 'Flashcard' && (
            <>
              {/* Header */}
              <div className="grid grid-cols-[2fr_.7fr_.5fr_.5fr] gap-4 pb-3 border-b text-gray-500 text-sm font-medium">

                <p>Name</p>
                <p className="text-center">Items</p>
                <p className="text-center">View</p>
                <p className="text-center">Delete</p>
              </div>

              {/* Rows */}
              {filteredData.map((item) => (
                <div
                  key={item.id}
                  className="border-b py-4"
                >

                  {/* Desktop */}
                  <div className="grid grid-cols-[2fr_.7fr_.5fr_.5fr] gap-4 items-center">

                    <div>
                      <p className="text-sm md:text-xl lg:text-2xl font-semibold text-primary-600 
                                    whitespace-normal sm:truncate">
                        {item.title}
                      </p>

                      <p className="text-sm text-gray-400">
                        {item.date}
                      </p>
                    </div>

                    <p className="text-center text-lg text-primary-600">
                      {item.items}
                    </p>

                    <div className="flex justify-center">
                      <img
                        src="/View.png"
                        alt="View"
                        className="w-6 h-6 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-center">
                      <img
                        src="/delete.png"
                        alt="Delete"
                        className="w-6 h-6 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}              
            
            </div>

          </div>


        </div>
      </main>
    </div>
  )
}

export default GeneratedHistory