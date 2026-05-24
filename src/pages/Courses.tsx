import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCourses } from '../hooks/useCourses'


function SoftDeleteModal({ itemName, onConfirm, onCancel, isFolder = false }: { 
  itemName: string
  onConfirm: () => void
  onCancel: () => void
  isFolder?: boolean
}) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
        <div className='flex items-center gap-3 mb-3'>
          <span className='text-2xl'>🗑️</span>
          <h2 className='text-lg font-bold text-gray-800'>Move to Recently Deleted?</h2>
        </div>
        <p className='text-sm text-gray-500 mb-1'>
          <span className='font-semibold text-gray-700'>"{itemName}"</span> will be moved to{' '}
          <span className='font-semibold text-primary-600'>Recently Deleted</span>.
        </p>

        {isFolder && (
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mt-2 mb-2'>
            <p className='text-xs text-yellow-700 font-semibold'>
              ⚠️ All files inside this folder will also be moved to Recently Deleted.
            </p>
          </div>
        )}

        <p className='text-xs text-gray-400 mb-6 mt-2'>
          You can restore it anytime within <span className='font-semibold text-red-400'>30 days</span>, after which it will be permanently deleted.
        </p>
        <div className='flex gap-3 justify-end'>
          <button onClick={onCancel} className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors'>
            Cancel
          </button>
          <button onClick={onConfirm} className='px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors'>
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  )
}

function Courses() {
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const { user } = useAuth()
  const { courses, loading, addCourse, updateCourse, deleteCourse } = useCourses(user)

  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const navigate = useNavigate()

  const handleSave = async () => {
    if (folderName.trim() === '') return
    await addCourse(folderName.trim())
    setFolderName('')
    setShowModal(false)
  }

  const handleClose = () => {
    setFolderName('')
    setShowModal(false)
  }

  async function handleDelete() {
    if (!pendingDelete) return
    await deleteCourse(pendingDelete.id)
    setPendingDelete(null)
  }
  const handleEditOpen = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
    setActiveMenu(null)
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!editingId || editName.trim() === '') return
    await updateCourse(editingId, editName.trim())
    setEditingId(null)
    setEditName('')
    setShowEditModal(false)
  }

  const handleEditClose = () => {
    setEditingId(null)
    setEditName('')
    setShowEditModal(false)
  }

  return (
    <div className='flex h-screen' onClick={() => setActiveMenu(null)}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 mt-0">
        <div className='min-h-screen flex flex-col'>

          {/* Header */}
          <div className='flex flex-col md:flex-row justify-between lg:flex-row lg:items-center w-full gap-3 mb-6'>
            <p className='text-3xl lg:text-4xl lg:ml-0 md:text-4xl md:ml-10 font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
              Courses
            </p>
                         <hr className='lg:hidden w-full border-t border-primary-600 ' />

            <button
              onClick={() => setShowModal(true)}
              className='bg-primary-600 px-10 py-2 rounded-md mx-10 lg:mx-0 md:mx-0 hover:bg-white hover:border hover:border-primary-600 hover:text-primary-600 text-white font-bold font-roboto text-md'
            >
              + Course Folder
            </button>
          </div>
<hr className='hidden sm:block w-full border-t mt-3 border-primary-600 mb-6' />

          {/* Folder Area */}
          {loading ? (
            <div className='flex-1 flex items-center justify-center text-primary-400 text-xl'>
              Loading courses...
            </div>
          ) : (
            <div className='grid grid-cols-2 lg:grid-cols-5 md:grid-cols-3 md:gap-x-5 gap-y-5 w-full md:mt-10 mt-5 lg:mt-10'>
              {courses.length === 0 ? (
                <div className='col-span-2 md:col-span-3 lg:col-span-3 flex items-center justify-center py-20'>
                  <p className='text-gray-400 font-roboto text-center text-sm md:text-lg'>
                    No folders yet. Click <span className='text-primary-600 font-bold'>+ Course Folder</span> to create one.
                  </p>
                </div>
              ) : (
                courses.map((course) => (
                  <div key={course.id} className='max-w-36 md:max-w-52   lg:max-w-52'>
                    <div className="relative">
                      <button
                        title={`Open ${course.name} Folder`}
                        onClick={() => navigate(`/courses/${course.id}`, { state: { folderName: course.name } })}
                      >
                        <img src="folder.png" alt="folder" className='hover:opacity-90' />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenu(activeMenu === course.id ? null : course.id)
                        }}
                        className="absolute hover:{setActivemenu} top-2 right-2 w-8 mr-1 md:w-10 md:mr-4 md:mt-2 lg:w-10 lg:mr-4 lg:mt-2"
                      >
                        <img
                        
                          src="folderbtn.png"
                          alt="menu"
                          title='More Options'
                          className="brightness-200 contrast-200 hover:scale-110 transition"
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenu === course.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-10 right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-32 overflow-hidden"
                        >
                          <button
                            onClick={() => handleEditOpen(course.id, course.name)}
                            className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                          >
                            <img className='w-5 h-5' src="edit.png" alt="edit icon" /> Rename
                          </button>
                          <hr className='my-1 border-gray-100' />
                          <button
                            onClick={() => { setPendingDelete({ id: course.id, name: course.name }); setActiveMenu(null) }}
                            className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-red-50 font-semibold'
                          >
                            <img src="delete.png" alt="delete icon" className='w-5 h-5' /> Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <p className='text-center font-bold font-roboto text-md md:text-2xl lg:text-2xl text-primary-600'>
                      {course.name}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Add Folder Modal */}
        {showModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-primary-600 rounded-xl shadow-xl p-8 w-[95%] max-w-md flex flex-col gap-5'>
              <div className='flex flex-row'>
                <button onClick={handleClose} className='w-5'>
                  <img src="X.png" alt="X" />
                </button>
                <p className='ml-12 md:ml-24 text-2xl font-bold font-roboto text-white uppercase'>
                  Add a course
                </p>
              </div>
              <div className='flex flex-row w-full gap-2'>
                <input
                  type='text'
                  maxLength={20}
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder='Enter folder name'
                  className='flex-1 border border-gray-300 rounded-md px-4 py-2 font-roboto text-gray-800 focus:outline-none focus:border-primary-600'
                />
                <button
                  onClick={handleSave}
                  className='flex items-center justify-center w-12 h-12 rounded-full bg-orange-400 text-white font-roboto font-semibold hover:bg-white hover:border hover:border-primary-600 hover:text-primary-600'
                >
                  <img src="saveIcon.png" alt="saveicon" className='w-5 brightness-0 invert hover:invert-0' />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Folder Modal */}
        {showEditModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-primary-600 rounded-xl shadow-xl p-8 w-[95%] max-w-md flex flex-col gap-5'>
              <div className='flex flex-row'>
                <button onClick={handleEditClose} className='w-5'>
                  <img src="X.png" alt="X" />
                </button>
                <p className='ml-12 md:ml-20 text-2xl font-bold font-roboto text-white uppercase'>
                  Edit Course
                </p>
              </div>
              <div className='flex flex-row w-full gap-2'>
                <input
                  autoFocus
                  type='text'
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                  placeholder='Enter folder name'
                  className='flex-1 border border-gray-300 rounded-md px-4 py-2 font-roboto text-gray-800 focus:outline-none focus:border-primary-600'
                />
                <button
                  onClick={handleEditSave}
                  className='flex items-center justify-center w-12 h-12 rounded-full bg-orange-400 text-white font-roboto font-semibold hover:bg-white hover:border hover:border-primary-600 hover:text-primary-600'
                >
                  <img src="saveIcon.png" alt="saveicon" className='w-5 brightness-0 invert' />
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
        {pendingDelete && (
          <SoftDeleteModal
            itemName={pendingDelete.name}
            onConfirm={handleDelete}
            onCancel={() => setPendingDelete(null)}
            isFolder={true}   // ← add this
          />
        )}
    </div>
  )
}

export default Courses