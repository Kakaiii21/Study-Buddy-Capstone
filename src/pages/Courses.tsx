import  { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCourses, type CourseColor } from '../hooks/useCourses'
import { useTour } from '../hooks/useTour'

function SoftDeleteModal({ itemName, onConfirm, onCancel, isFolder = false }: { 
  itemName: string
  onConfirm: () => void
  onCancel: () => void
  isFolder?: boolean
}) 


{
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl lg:rounded-lg shadow-2xl p-6 lg:p-3 xl:p-4 max-w-sm lg:max-w-[300px] xl:max-w-[350px] w-full mx-4'>
        <div className='flex items-center gap-3 lg:gap-1.5 mb-3 lg:mb-1.5'>
          <img src="/delete.png" alt="delteicon" className='w-7 h-7 lg:w-4 lg:h-4 xl:w-5 xl:h-5' />
          <h2 className='text-lg lg:text-xs xl:text-sm font-bold text-gray-800'>Move to Recently Deleted?</h2>
        </div>
        <p className='text-sm lg:text-[10px] xl:text-[11px] mb-1'>
          <span className='font-semibold text-gray-700'>"{itemName}"</span> will be moved to{' '}
          <span className='font-semibold text-primary-600'>Recently Deleted</span>.
        </p>

        {isFolder && (
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg lg:rounded-sm px-3 py-2 lg:px-1.5 lg:py-1 mt-2 lg:mt-1 mb-2 lg:mb-1'>
            <p className='text-xs lg:text-[9px] xl:text-[10px] text-yellow-700 font-semibold'>
              ⚠️ All files inside this folder will also be moved to Recently Deleted.
            </p>
          </div>
        )}

        <p className='text-xs lg:text-[9px] xl:text-[10px] text-gray-400 mb-6 lg:mb-3 mt-2 lg:mt-1'>
          You can restore it anytime within <span className='font-semibold text-red-400'>30 days</span>, after which it will be permanently deleted.
        </p>
        <div className='flex gap-3 lg:gap-1.5 justify-end'>
          <button onClick={onCancel} className='px-4 py-2 lg:px-2 lg:py-1 rounded-lg lg:rounded-sm text-sm lg:text-[10px] xl:text-[11px] font-medium text-gray-600 hover:bg-gray-100 transition-colors'>
            Cancel
          </button>
          <button onClick={onConfirm} className='px-4 py-2 lg:px-2 lg:py-1 rounded-lg lg:rounded-sm text-sm lg:text-[10px] xl:text-[11px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors'>
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  )
}

function Courses() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

useEffect(() => {
  const handleOnline = () => setIsOnline(true)
  const handleOffline = () => setIsOnline(false)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [])
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const { user } = useAuth()
  const { courses, loading, addCourse, updateCourse, deleteCourse } = useCourses(user)
const { startTour } = useTour(
  'courses',
  false,
  () => {},
  () => {},
  user
)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedColor, setSelectedColor] = useState<CourseColor>('blue')
  const [isSaving, setIsSaving] = useState(false)

  const [folderError, setFolderError] = useState('')
  const [editError, setEditError] = useState('')

  const navigate = useNavigate()

  const handleSave = async () => {
    if (isSaving) return

    if (folderName.trim() === '') {
      setFolderError('Please enter a folder name.')
      return
    }

    const isDuplicate = courses.some(
      (c) => c.name.toLowerCase() === folderName.trim().toLowerCase()
    )
    if (isDuplicate) {
      setFolderError('A folder with that name already exists.')
      return
    }

    setIsSaving(true)
    await addCourse(folderName.trim(), selectedColor)
    setFolderName('')
    setFolderError('')
    setSelectedColor('blue')
    setIsSaving(false)
    setShowModal(false)
  }

  const handleClose = () => {
    setFolderName('')
    setFolderError('')
    setSelectedColor('blue')
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
    if (!editingId || editName.trim() === '') {
      setEditError('Please enter a folder name.')
      return
    }

    const isDuplicate = courses.some(
      (c) => c.id !== editingId && c.name.toLowerCase() === editName.trim().toLowerCase()
    )
    if (isDuplicate) {
      setEditError('A folder with that name already exists.')
      return
    }

    await updateCourse(editingId, editName.trim())
    setEditingId(null)
    setEditName('')
    setEditError('')
    setShowEditModal(false)
  }

  const handleEditClose = () => {
    setEditingId(null)
    setEditName('')
    setEditError('')
    setShowEditModal(false)
  }

  return (
    <div className='flex h-screen' onClick={() => setActiveMenu(null)}>
      <div className='lg:p-3 '>
      <Sidebar />
      </div>
      <div className='flex-1 flex flex-col overflow-hidden'>

              {/* Top Bar — mobile only */}
        <div className='lg:hidden flex items-center justify-between px-4 sm:px-6 py-2 bg-white  top-0 left-0 right-0 z-10 relative'>
          <p className='absolute left-1/2 -translate-x-1/2 font-inter mt-4 font-semibold text-xl text-[#B3B3B3] uppercase'>Courses</p>
            <button
            id='tour-btn'
              onClick={() => startTour()}
              className='flex flex-col items-center gap-1 ml-auto
                hover:opacity-80 active:scale-95 transition-all'
              title='Take a Tour'
            >
              <div className='bg-white  w-14 h-14 rounded-full  flex items-center justify-center text-2xl font-bold'>
              <img src="/needhelp.png" alt="?" className='w-12 block mx-auto mt-1' />
              </div>
              <p className='text-xs text-primary-600 lg:text-primary-600 md:text-primary-600 xl:text-primary-600 2xl:text-primary-600 font-inter font-medium '>Need Help?</p>
            </button>
        </div>
      <main  className="flex-1  w-full  overflow-auto p-2 px-5 md:px-7  md:py-0 md:pt-0 py-0  lg:p-2 lg:pt-2 2xl:pt-0 2xl:px-10 pt-1">
        <div className="min-h-screen  w-full flex flex-col">
            <p className='hidden lg:flex justify-center lg:justify-start w-full lg:pl-3 2xl:p-4  
            font-inter font-semibold text-sm md:text-md lg:text-[10px] xl:text-[12px] 2xl:text-[14px] text-[#B3B3B3] uppercase
            mt-2 md:mt-4 lg:mt-1 xl:mt-2 2xl:mt-3 '>Courses</p>
          {/* Header */}
        <div className="flex flex-col w-full lg:flex lg:flex-row md:flex-row 
          px-14 sm:px-12 justify-center items-center py-1
          lg:justify-end lg:items-start lg:pr-10 2xl:pr-16 lg:px-0 lg:gap-3
          md:justify-between md:items-start sm:items-center gap-1 p-0">
            <button
              id='addCourseBtn'
              onClick={() => setShowModal(true)}
              disabled={!isOnline}
              title={!isOnline ? 'You are offline' : undefined}
              className="bg-[#FEE248] uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] text-primary-800 
              py-2 md:py- px-4 rounded-sm  w-full
              order-2 lg:order-1
              font-inter font-black
              text-[10px] lg:text-[8px]
              xl:text-[10px] 2xl:text-[12px]
              hover:opacity-90 lg:w-auto
              backdrop-blur-xs
              hover:-translate-y-1 
              hover:shadow-[0_2px_5px_rgba(0,0,0,0.5)]
              transition-all duration-300"            >
              + Course Folder
            </button>
            {/* Search bar */}
            <div className="relative order-1 lg:order-2 flex items-center w-full lg:max-w-[180px] xl:max-w-[220px] 2xl:max-w-[260px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full border border-primary-800 rounded-md
                  py-2 pl-3 pr-8 
                  text-[10px] lg:text-[8px] xl:text-[10px] 2xl:text-[12px]
                  font-inter text-primary-800 placeholder:text-primary-800
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                  transition-all duration-200"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute right-2 w-3.5 h-3.5 lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5 2xl:w-4 2xl:h-4 text-primary-800 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>


          </div>
            <hr className=' sm:block w-full border-t mt-3 border-[#E9E9E9] mb-2' />

          {/* Folder Area */}
          {loading ? (
            <div className='flex-1  flex items-center justify-center text-primary-400 text-xl'>
              Loading courses...
            </div>
          ) : (
            <div id='coursesGrid'
            className='grid grid-cols-2  pl-8 lg:pl-0 lg:grid-cols-5 md:grid-cols-3  md:gap-x-5 gap-y-5 w-full md:mt-10 mt-5 lg:mt-1'>
              {courses.length === 0 ? (
              <div className='col-span-2 md:col-span-3  lg:col-span-5 flex items-center justify-center py-20 w-full'>
                <p className='text-gray-400 font-roboto text-center text-sm md:text-lg'>
                  No folders yet. Click <span className='text-primary-600 font-bold'>+ Course Folder</span> to create one.
                </p>
              </div>
              ) : (
                courses.map((course) => (
                  <div id='courseFolder' key={course.id} className='max-w-36 md:max-w-52   lg:max-w-[130px]  xl:max-w-[150px] 2xl:max-w-[180px]'>
                    <div className="relative">
                      <button
                        title={`Open ${course.name} Folder`}
                        onClick={() => navigate(`/courses/${course.id}`, { state: { folderName: course.name } })}
                      >
                      <img
                        src={`${course.fileCount && course.fileCount > 0 ? "storefolder" : "folder"}-${course.color || 'blue'}.png`}
                        alt="folder"
                        className='hover:opacity-90'
                      />                      
                      </button>

                      <button
                      id='courseOptionsBtn'
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenu(activeMenu === course.id ? null : course.id)
                        }}
                        className="absolute bottom-2  right-2 w-10 lg:right-0 lg:w-10 xl:right-1 xl:w-11 2xl:right-2 2xl:w-12  h-6 flex items-center justify-center transition group"
                        title='More Options'
                      >
                        <div  className="flex flex-row items-center justify-center gap-[8px] lg:gap-[3px] 2xl:gap-[5px] lg:pr-0 pr-0 md:pr-5">
                          <span className="w-2 h-2 lg:w-1 lg:h-1 2xl:w-2 2xl:h-2 rounded-full bg-white group-hover:bg-primary-600 transition"></span>
                          <span className="w-2 h-2 lg:w-1 lg:h-1 2xl:w-2 2xl:h-2 rounded-full bg-white group-hover:bg-primary-600 transition"></span>
                          <span className="w-2 h-2 lg:w-1 lg:h-1 2xl:w-2 2xl:h-2 rounded-full bg-white group-hover:bg-primary-600 transition"></span>
                        </div>
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenu === course.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-[70px] left-32 lg:left-32 xl:left-[140px] xl:top-[95px] 2xl:left-[165px] 2xl:top-[115px] bg-white border border-primary-800 rounded-sm shadow-lg z-20 w-[110px] overflow-hidden"
                        >
                          <button
                            onClick={() => handleEditOpen(course.id, course.name)}
                            className='flex items-center lg:text-[12px] gap-2 w-full text-left px-4 py-1 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                          >
                            <img className='w-5 h-5 lg:w-3 lg:h-3' src="edit.png" alt="edit icon" /> Rename
                          </button>
                          <hr className='my-0 border-primary-800 mx-2' />
                          <button
                            onClick={() => { setPendingDelete({ id: course.id, name: course.name }); setActiveMenu(null) }}
                            className='flex items-center lg:text-[12px] gap-2 w-full text-left px-4 py-1 text-sm text-primary-600 hover:bg-red-50 font-semibold'
                          >
                            <img src="delete.png" alt="delete icon" className='w-5 h-5 lg:w-3 lg:h-3' /> Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <p className='text-center  font-normal font-inter text-md md:text-2xl  lg:text-[14px] xl:text-[15px] 2xl:text-[16px] text-primary-600'>
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
            <div className='bg-primary-600 rounded-xl shadow-xl p-8 lg:p-0 lg:px-6 lg:py-4 xl:p-0 xl:px-5 xl:py-3 2xl:p-0 2xl:px-4 2xl:py-4 w-[95%] lg:w-[350px] xl:w-[360px] 2xl:w-[370px] max-w-md flex flex-col gap-5'>
              <div className='flex flex-row'>
                <button onClick={handleClose} className='w-5 lg:w-3 xl:w-4 2xl:w-5'>
                  <img src="X.png" alt="X" />
                </button>
                <p className='ml-12 md:ml-24 text-2xl text-center lg:ml-[80px] lg:text-lg xl:ml-[80px] xl:text-xl font-bold font-roboto text-white uppercase'>
                  Add a course
                </p>
              </div>
              <div className='flex flex-row w-full gap-2 lg:h-8 xl:h-10'>
                <input
                  type='text'
                  maxLength={20}
                  value={folderName}
                  onChange={(e) => { setFolderName(e.target.value); setFolderError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder='Enter folder name'
                  className={`flex-1 border rounded-md px-2 py-1 text-xs font-roboto text-gray-800 focus:outline-none ${
                    folderError ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                <button onClick={handleSave} disabled={isSaving} className='flex items-center justify-center w-12 h-12 lg:w-8 lg:h-8 xl:w-9 xl:h-9 rounded-full bg-orange-400 text-white font-roboto font-semibold hover:bg-white hover:border hover:border-primary-600 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed'>
                  <img src="saveIcon.png" alt="saveicon" className='w-5 lg:w-4 xl:w-5 brightness-0 invert hover:invert-0' />
                </button>
              </div>
              <p className='font-inter font-bold uppercase text-sm text-center'>Color</p>
              {/* Folder color picker */}
              <div className='flex flex-c gap-3 mb-2 justify-center'>
               
                {(['blue', 'yellow', 'grey'] as const).map((color) => (
                  <button
                    key={color}
                    type='button'
                    onClick={() => setSelectedColor(color)}
                    title={`${color.charAt(0).toUpperCase() + color.slice(1)} folder`}
                    className={`w-8 h-8 rounded-sm border-2 transition-all
                      ${selectedColor === color ? 'border-white scale-110' : 'border-transparent opacity-70'}
                      ${color === 'yellow' ? 'bg-[#FEE248]' : color === 'blue' ? 'bg-[#95CAFF]' : 'bg-[#D9D9D9]'}`}
                  />
                ))}
              </div>

              {/* ← Add this below the input row */}
              {folderError && (
                <p className='text-red-300 text-sm font-semibold lg:text-[10px] -mt-3'>{folderError}</p>
              )}
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
                    onChange={(e) => { setEditName(e.target.value); setEditError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                    placeholder='Enter folder name'
                    className={`flex-1 border rounded-md px-4 py-2 font-roboto text-gray-800 focus:outline-none ${
                      editError ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  <button onClick={handleEditSave} className='flex items-center justify-center w-12 h-12 rounded-full bg-orange-400 text-white font-roboto font-semibold hover:bg-white hover:border hover:border-primary-600 hover:text-primary-600'>
                    <img src="saveIcon.png" alt="saveicon" className='w-5 brightness-0 invert' />
                  </button>
                </div>

                {/* ← Add this below the input row */}
                {editError && (
                  <p className='text-red-300 text-sm font-semibold -mt-3'>{editError}</p>
                )}
            </div>
          </div>
        )}

          <button
            id='tour-btn'
            onClick={() => startTour()}
            className='hidden lg:flex fixed bottom-6 right-6 z-50
            flex-col items-center gap-1
            hover:opacity-80 active:scale-95 transition-all
            lg:bottom-8 lg:right-8'
            title='Take a Tour'
          >
            <div className='bg-white w-14 h-14 lg:w-10 lg:h-10 xl:w-11 xl:h-11 2xl:w-12 2xl:h-12    rounded-full  flex items-center justify-center text-2xl font-bold'>
              <img src="/needhelp.png" alt="?" className='w-12  lg:w-10 xl:w-11 2xl:w-12 block mx-auto mt-1' />
            </div>  
            <p className='text-xs lg:text-[8px] xl:text-[9px] 2xl:text-[12px] text-primary-600 font-inter font-medium'>Need Help?</p>
          </button>
      </main>
      </div>
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