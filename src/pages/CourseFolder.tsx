import React, { useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useCourseFiles } from '../hooks/useCourseFiles'
import { uploadToCloudinary } from '../services/cloudinary'

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt'

function CourseFolder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { courseId } = useParams()
    console.log('courseId:', courseId)

  // Get folder name from navigation state
  const folderName = location.state?.folderName || 'Course Folder'

  const { files, loading, addCourseFile, renameCourseFile, deleteCourseFile } = useCourseFiles(user, courseId)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [activeFileMenu, setActiveFileMenu] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  // Upload progress state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFileName, setUploadingFileName] = useState('')

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')

  const handleFiles = async (incoming: FileList | null) => {
    if (!incoming) return
    setError('')

    const allowed = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'txt']
    const rejected: string[] = []
    const duplicates: string[] = []
    const toUpload: File[] = []

    Array.from(incoming).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const trimmedName = file.name.trim()

      if (!allowed.includes(ext)) {
        rejected.push(file.name)
        return
      }

      if (!trimmedName) {
        rejected.push(file.name)
        return
      }

      const alreadyExists = files.some(
        (f) => f.fileName.toLowerCase() === trimmedName.toLowerCase()
      )

      if (alreadyExists) {
        duplicates.push(file.name)
        return
      }

      toUpload.push(file)
    })

    const messages: string[] = []
    if (rejected.length > 0) messages.push(`File(s) not allowed: ${rejected.join(', ')}`)
    if (duplicates.length > 0) messages.push(`Duplicate file(s): ${duplicates.join(', ')}`)
    if (messages.length > 0) setError(messages.join(' | '))

    // Upload each file to Cloudinary then save to Firestore
    for (const file of toUpload) {
      try {
        setUploading(true)
        setUploadProgress(0)
        setUploadingFileName(file.name)

        const result = await uploadToCloudinary(file, (percent) => {
        setUploadProgress(percent)
        })

        console.log('Cloudinary result:', result)  // ← add this

        await addCourseFile(
        result.fileName,
        result.url,
        result.publicId,
        result.fileType,
        result.fileSize,
        )

console.log('Saved to Firestore!')  // ← add this
        } catch (error) {
        console.error('Full upload error:', error)
        setError(`Failed to upload ${file.name}. Please try again.`)
        } finally {
        setUploading(false)
        setUploadProgress(0)
        setUploadingFileName('')
      }
    }
  }

  const handleDelete = async (id: string) => {
    await deleteCourseFile(id)
    setActiveFileMenu(null)
  }

  const handleEdit = (id: string) => {
    const file = files.find((f) => f.id === id)
    if (!file) return
    setEditingId(id)
    setEditName(file.fileName.replace(/\.[^/.]+$/, ''))
    setShowEditModal(true)
    setActiveFileMenu(null)
    setEditError('')
  }

  const handleEditSave = async () => {
    const trimmedName = editName.trim()
    if (!trimmedName) {
      setEditError('File name cannot be empty.')
      return
    }

    const currentFile = files.find((f) => f.id === editingId)
    if (!currentFile) return

    const extension = currentFile.fileName.match(/\.[^/.]+$/)?.[0] || ''
    const finalName = `${trimmedName}${extension}`

    const duplicateExists = files.some(
      (f) => f.id !== editingId && f.fileName.toLowerCase() === finalName.toLowerCase()
    )

    if (duplicateExists) {
      setEditError('A file with this name already exists.')
      return
    }

    await renameCourseFile(editingId!, finalName)
    setShowEditModal(false)
    setEditingId(null)
    setEditName('')
    setEditError('')
  }

  const handleEditClose = () => {
    setEditError('')
    setShowEditModal(false)
    setEditingId(null)
    setEditName('')
  }

  const filteredFiles =
    filter === 'all'
      ? files
      : filter === 'images'
      ? files.filter((f) => ['png', 'jpg', 'jpeg'].includes(f.fileType))
      : files.filter((f) => f.fileType === filter)

  return (
    <div className='flex h-screen' onClick={() => setActiveFileMenu(null)}>
      <Sidebar />
      <main className='flex-1 overflow-y-auto p-8'>
        <div className='min-h-screen flex flex-col'>

          {/* Header */}
          <div className='flex flex-col md:flex-row justify-between lg:flex-row lg:items-center w-full gap-3 mb-6'>
            <div className='flex items-center gap-3'>
              <button
                title='Go Back to Courses'
                onClick={() => navigate('/courses')}
                className='text-primary-600 lg:ml-0 ml-10 font-extrabold font-roboto hover:underline text-3xl'
              >
                ←
              </button>
              <p className='text-3xl lg:text-4xl md:text-4xl font-bold text-primary-600 uppercase font-roboto'>
                {folderName}
              </p>
            </div>
            <div className='flex flex-row gap-2'>

              {/* Filter Dropdown */}
              {files.length > 0 && (
                <div className='flex items-center gap-2 mx-10 lg:mx-0 md:mx-0'>
                  <label
                    htmlFor='file-filter'
                    className='text-sm font-semibold font-roboto text-primary-600 whitespace-nowrap'
                  >
                    Filter:
                  </label>
                  <select
                    id='file-filter'
                    aria-label='Filter files by type'
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className='border border-primary-600 rounded-md px-3 py-2 text-sm font-roboto text-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600 bg-white cursor-pointer'
                  >
                    <option value='all'>All Files</option>
                    <option value='pdf'>PDF</option>
                    <option value='doc'>DOC</option>
                    <option value='docx'>DOCX</option>
                    <option value='ppt'>PPT</option>
                    <option value='pptx'>PPTX</option>
                    <option value='txt'>TXT</option>
                    <option value='images'>Images (PNG / JPG)</option>
                  </select>
                </div>
              )}

              <input
                aria-label='Upload academic files'
                ref={fileInputRef}
                type='file'
                accept={ACCEPTED_TYPES}
                multiple
                className='hidden'
                onChange={(e) => handleFiles(e.target.files)}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className='bg-primary-600 px-10 py-2 rounded-md mx-10 lg:mx-0 md:mx-0 hover:bg-white hover:border hover:border-primary-600 hover:text-primary-600 text-white font-bold font-roboto text-md disabled:opacity-50 disabled:cursor-not-allowed'
              >
                + Upload Files
              </button>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className='mb-4 w-full'>
              <div className='flex justify-between text-sm font-roboto text-primary-600 mb-1'>
                <span>Uploading <span className='font-bold'>{uploadingFileName}</span>...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-primary-600 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <p className='text-red-500 text-sm font-roboto mb-4 text-center'>{error}</p>
          )}

          {/* Files Area */}
          {loading ? (
            <div className='flex-1 flex items-center justify-center text-primary-400 text-xl'>
              Loading files...
            </div>
          ) : files.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-24 cursor-pointer transition-colors
                ${dragOver ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-600'}`}
            >
              <p className='text-5xl mb-4'>📂</p>
              <p className='text-gray-400 font-roboto text-center text-sm md:text-lg'>
                Drag & drop files here or{' '}
                <span className='text-primary-600 font-bold'>click to browse</span>
              </p>
              <p className='text-gray-300 font-roboto text-xs mt-2'>
                Accepted: PDF, DOC, DOCX, PPT, PPTX, PNG, JPG, TXT
              </p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <p className='text-gray-400 font-roboto text-sm text-center mt-10'>
              No files match the selected filter.
            </p>
          ) : (
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-2 md:gap-x-2 md:gap-y-5 lg:gap-x-0'>
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className='flex flex-col items-center bg-white border-gray-200 rounded-xl p-4 hover:shadow-md transition relative w-36 md:w-44 lg:w-48'
                >
                  <div className='relative w-full flex justify-center items-end'>

                    {/* File icon — clicking opens the file URL */}
                    <a
                    href={file.fileUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    title={`Open ${file.fileName}`}
                    >
                    <img
                        src={
                        ['doc', 'docx'].includes(file.fileType) ? '/docsIcon.png' :
                        file.fileType === 'pdf' ? '/pdfIcon.png' :
                        ['ppt', 'pptx'].includes(file.fileType) ? '/pptIcon.png' :
                        file.fileType === 'txt' ? '/txtIcon.png' :
                        ['png', 'jpg', 'jpeg'].includes(file.fileType) ? '/imgIcon.png' :
                        '/fileIcon.png'
                        }
                        alt={file.fileType}
                        className='w-32 h-32 md:w-40 md:h-40 object-contain mt-4 hover:opacity-80 hover:cursor-pointer'
                    />
                    </a>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveFileMenu(activeFileMenu === file.id ? null : file.id)
                      }}
                      className='flex flex-col items-center justify-center gap-[3px] p-2 rounded-full hover:bg-gray-100 w-7 h-7'
                      title='Options'
                    >
                      <span className='w-1 h-1 bg-gray-500 rounded-full'></span>
                      <span className='w-1 h-1 bg-gray-500 rounded-full'></span>
                      <span className='w-1 h-1 bg-gray-500 rounded-full'></span>
                    </button>

                    {activeFileMenu === file.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className='absolute top-7 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-32 overflow-hidden'
                      >
                        <button
                          onClick={() => handleEdit(file.id)}
                          className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                        >
                          <img src='/edit.png' alt='edit icon' className='w-5 h-5' /> Rename
                        </button>
                        <hr className='my-1 border-gray-100' />
                        <button
                          onClick={() => handleDelete(file.id)}
                          className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-red-50 font-semibold'
                        >
                          <img src='/delete.png' alt='delete icon' className='w-5 h-5' /> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <p className='text-center font-roboto font-semibold text-primary-600 text-xs md:text-sm mt-1 w-full truncate px-1'>
                    {file.fileName}
                  </p>
                  <p className='text-center font-roboto text-gray-400 text-xs'>{file.fileSize}</p>
                </div>
              ))}

              {/* Drop more files zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center border-2 border-dashed rounded-xl py-6 cursor-pointer transition-colors
                  ${dragOver ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-600'}`}
              >
                <p className='text-gray-400 font-roboto text-sm text-center'>
                  + Drop more files or <span className='text-primary-600 font-bold'>click to browse</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Filename Modal */}
      {showEditModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-primary-600 rounded-xl shadow-xl p-8 w-[95%] max-w-md flex flex-col gap-5'>
            <div className='flex flex-row'>
              <button onClick={handleEditClose} className='w-5'>
                <img src='/X.png' alt='X' />
              </button>
              <p className='ml-12 md:ml-24 text-2xl font-bold font-roboto text-white uppercase'>
                Rename File
              </p>
            </div>
            <div className='flex flex-row w-full gap-2'>
              <input
                autoFocus
                type='text'
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value)
                  setEditError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                placeholder='Enter file name'
                aria-label='Edit file name'
                className='flex-1 border border-gray-300 rounded-md px-4 py-2 font-roboto text-gray-800 focus:outline-none focus:border-white'
              />
              <button
                onClick={handleEditSave}
                className='flex items-center justify-center w-12 h-12 rounded-full bg-orange-400 text-white font-roboto font-semibold hover:bg-white hover:border hover:border-primary-600 hover:text-primary-600'
              >
                <img src='/saveIcon.png' alt='save' className='w-5 brightness-0 invert' />
              </button>
            </div>
            {editError && (
              <p className='text-orange-300 text-sm font-roboto -mt-2'>{editError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseFolder