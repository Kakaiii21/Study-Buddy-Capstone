import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useCourseFiles } from '../hooks/useCourseFiles'
import { uploadToCloudinary } from '../services/cloudinary'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { doc, getDoc, setDoc, increment } from 'firebase/firestore'
import { db } from '../services/firebase'
import { STORAGE_LIMIT } from '../utils/fileUtils'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

interface CourseFile {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: string
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.txt'


function TxtPreview({ url }: { url: string }) {
  const [text, setText] = useState('Loading...')

  useEffect(() => {
    fetch(url)
      .then((r) => r.text())
      .then(setText)
      .catch(() => setText('Failed to load file.'))
  }, [url])

  return (
    <pre className='w-full h-full overflow-auto p-6 bg-white text-gray-800 font-mono text-sm whitespace-pre-wrap'>
      {text}
    </pre>
  )
}


function SoftDeleteModal({ itemName, onConfirm, onCancel }: { itemName: string; onConfirm: () => void; onCancel: () => void }) {
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    if (confirming) return
    setConfirming(true)
    await onConfirm()
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
        <div className='flex items-center gap-3 mb-3'>
          <img src="/delete.png" alt="delteicon" className='w-7 h-7' />
          <h2 className='text-lg font-bold text-gray-800'>Move to Recently Deleted?</h2>
        </div>
        <p className='text-sm text-gray-500 mb-1'>
          <span className='font-semibold text-gray-700'>"{itemName}"</span> will be moved to{' '}
          <span className='font-semibold text-primary-600'>Recently Deleted</span>.
        </p>
        <p className='text-xs text-gray-400 mb-6'>
          You can restore it anytime within <span className='font-semibold text-red-400'>30 days</span>, after which it will be permanently deleted.
        </p>
        <div className='flex gap-3 justify-end'>
          <button onClick={onCancel} disabled={confirming} className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50'>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={confirming} className='px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
            {confirming ? 'Moving...' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CourseFolder() {
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { courseId } = useParams()

  const folderName = location.state?.folderName || 'Course Folder'
  const isRestoredFolder = folderName === 'Restored Files'

  const [previewFile, setPreviewFile] = useState<CourseFile | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [activeFileMenu, setActiveFileMenu] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFileName, setUploadingFileName] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const [storageUsed, setStorageUsed] = useState(0)

  const isOnline = useNetworkStatus()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { files, loading, addCourseFile, renameCourseFile, deleteCourseFile } = useCourseFiles(user, courseId)

  // ─── Shared helper: always reads fresh value from Firestore ───────────────
  const refreshStorage = useCallback(async () => {
    if (!user) return
    const snap = await getDoc(doc(db, 'users', user.uid))
    const val = snap.data()?.storageUsed ?? 0
    setStorageUsed(Math.max(0, val))
  }, [user])

  // ─── On mount (and whenever user changes) fetch storage immediately ───────
  useEffect(() => {
    if (!user) return
    let cancelled = false
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (cancelled) return
      const val = snap.data()?.storageUsed ?? 0
      setStorageUsed(Math.max(0, val))
    })
    return () => { cancelled = true }
  }, [user])

  // ─── Block navigation while uploading ────────────────────────────────────
  useEffect(() => {
    if (!uploading) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [uploading])

  const handleFileClick = (file: CourseFile) => {
    setPreviewFile(file)
  }

const handleFiles = async (incoming: FileList | null) => {
  if (!incoming) return
  if (!isOnline) {
    setError('You are offline. Please reconnect to upload files.')
    return
  }

    const allowed = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'txt']
    const messages: string[] = []
    const rejected: string[] = []
    const duplicates: string[] = []
    const toUpload: File[] = []
    const MAX_FILE_SIZE = 10 * 1024 * 1024

    Array.from(incoming).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const trimmedName = file.name.trim()

      if (!allowed.includes(ext)) { rejected.push(file.name); return }
      if (!trimmedName) { rejected.push(file.name); return }

      if (file.size > MAX_FILE_SIZE) {
        messages.push(`"${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Max is 10 MB.`)
        return
      }

      const alreadyExists = files.some(
        (f) => f.fileName.toLowerCase() === trimmedName.toLowerCase()
      )
      if (alreadyExists) { duplicates.push(file.name); return }

      toUpload.push(file)
    })

    if (rejected.length > 0) messages.push(`File(s) not allowed: ${rejected.join(', ')}`)
    if (duplicates.length > 0) messages.push(`Duplicate file(s): ${duplicates.join(', ')}`)

    // Check storage only against files that passed validation
    if (user && toUpload.length > 0) {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const currentUsed: number = userDoc.data()?.storageUsed ?? 0
      const incomingSize = toUpload.reduce((sum, f) => sum + f.size, 0)

      if (currentUsed + incomingSize > STORAGE_LIMIT) {
        const usedMB = (currentUsed / (1024 * 1024)).toFixed(1)
        messages.push(`Storage limit reached. You've used ${usedMB} MB of 1 GB.`)
        toUpload.length = 0
      }
    }

    if (messages.length > 0) setError(messages.join(' | '))
    if (toUpload.length === 0) return

    setUploading(true)

    for (const file of toUpload) {
      setUploadProgress(0)
      setUploadingFileName(file.name)

      // Step 1: Upload to Cloudinary
      let result
      try {
        result = await uploadToCloudinary(file, (percent) => {
          setUploadProgress(percent)
        })
      } catch (err) {
        console.error('Cloudinary upload failed:', err)
        setError((prev) => prev ? `${prev} | Failed to upload ${file.name}. Please try again.` : `Failed to upload ${file.name}. Please try again.`)
        continue // skip to next file, nothing was saved anywhere
      }

      // Step 2: Save to Firestore + update storage
      try {
        await addCourseFile(
          result.fileName,
          result.url,
          result.publicId,
          result.fileType,
          result.fileSize,
        )

        if (user) {
          await setDoc(doc(db, 'users', user.uid), {
            storageUsed: increment(file.size)
          }, { merge: true })
        }

        setStorageUsed((prev) => prev + file.size)

      } catch (err) {
        console.error('Firestore save failed:', err)
        setError((prev) => prev ? `${prev} | "${file.name}" uploaded but failed to save metadata. Please refresh.` : `"${file.name}" uploaded but failed to save metadata. Please refresh.`)
        await refreshStorage()
      }
    }

    setUploading(false)
    setUploadProgress(0)
    setUploadingFileName('')
  }

  async function handleDelete() {
    if (!pendingDelete) return
    await deleteCourseFile(pendingDelete.id)
    setPendingDelete(null)
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

  const handleDownload = async (file: CourseFile) => {
    setActiveFileMenu(null)
    try {
      const response = await fetch(file.fileUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      window.open(file.fileUrl, '_blank')
    }
  }

  const handleEditSave = async () => {
    const trimmedName = editName.trim()
    if (!trimmedName) { setEditError('File name cannot be empty.'); return }

    const currentFile = files.find((f) => f.id === editingId)
    if (!currentFile) return

    const extension = currentFile.fileName.match(/\.[^/.]+$/)?.[0] || ''
    const finalName = `${trimmedName}${extension}`

    const duplicateExists = files.some(
      (f) => f.id !== editingId && f.fileName.toLowerCase() === finalName.toLowerCase()
    )
    if (duplicateExists) { setEditError('A file with this name already exists.'); return }

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
      : filter === 'word'
      ? files.filter((f) => ['doc', 'docx'].includes(f.fileType))
      : filter === 'powerpoint'
      ? files.filter((f) => ['ppt', 'pptx'].includes(f.fileType))
      : filter === 'excel'
      ? files.filter((f) => ['xls', 'xlsx'].includes(f.fileType))
      : files.filter((f) => f.fileType === filter)
      

  const pdfFile = useMemo(
    () => previewFile?.fileType === 'pdf' ? { url: previewFile.fileUrl } : null,
    [previewFile?.fileUrl]
  )

  const storagePercent = Math.min((storageUsed / STORAGE_LIMIT) * 100, 100)
  const storageColor =
    storagePercent > 90 ? 'bg-red-500' :
    storagePercent > 70 ? 'bg-yellow-400' :
    'bg-primary-600'

  return (
    <div className='flex h-screen' onClick={() => setActiveFileMenu(null)}>

      <div className='hidden lg:block md:block'>
        <Sidebar uploading={uploading} />
      </div>

      <main className='flex-1 overflow-y-auto p-8 overflow-hidden'>
        <div className='min-h-screen flex flex-col'>

          {/* Header */}
          <div className='flex flex-col md:flex-row  md:justify-between md:items-center lg:justify-between lg:items-center w-full gap-3 mb-6'>
            <div className="flex items-center gap-4">
              <button
                title="Go Back to Courses"
                onClick={() => navigate('/courses')}
                className="flex flex-col items-center md:pl-16 lg:pl-0 xl:pl-0 2xl:pl-0 px-3 py-1 rounded hover:bg-gray-100 transition"
              >
                <span className="text-5xl leading-none">←</span>
                <span className="text-sm">Back</span>
              </button>
              <p className="text-3xl lg:text-4xl md:text-4xl font-bold text-primary-600 uppercase font-roboto">
                {folderName}
              </p>
            </div>
            <div className='flex flex-row lg:ml-auto'>
              <div className='flex items-center gap-2 mx-2 lg:mx-2 md:mx-2'>
                <select
                  id='file-filter'
                  aria-label='Filter files by type'
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className='border border-primary-600 pl-4 rounded-md px-0 py-2 text-sm font-roboto text-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600 bg-white cursor-pointer'
                >
                  <option value='all'>All Files</option>
                  <option value='pdf'>PDF</option>
                  <option value='word'>Word Documents</option>
                  <option value='powerpoint'>PowerPoint</option>
                  <option value='txt'>TXT</option>
                  <option value='excel'>Excel</option>
                  <option value='images'>Images (PNG / JPG)</option>
                </select>
              </div>

              <input
                aria-label='Upload Files'
                ref={fileInputRef}
                type='file'
                accept={ACCEPTED_TYPES}
                multiple
                className='hidden'
                onChange={(e) => !isRestoredFolder && handleFiles(e.target.files)}
                disabled={isRestoredFolder}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || isRestoredFolder || !isOnline}  // ← add !isOnline
                className='bg-primary-600 w-52 lg:px-10 py-2 rounded-md lg:mx-0 hover:bg-white hover:border hover:border-primary-600 hover:text-primary-600 text-white font-bold font-roboto text-md disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {!isOnline ? '📶 Offline' : '+ Upload Files'}
              </button>
            </div>
          </div>

          <hr className='w-full border-t border-primary-600 lg:mb-4' />
          {uploading && (
            <div className='w-full bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm font-roboto px-4 py-2 rounded-md mb-3 flex items-center gap-2'>
              ⚠ Please wait — navigating away will cancel the upload.
            </div>
          )}

          {/* Storage Bar */}
          <div className='w-full mb-4 mt-3'>
            <div className='flex justify-between text-xs text-gray-400 font-roboto mb-1'>
              <span>Storage used</span>
              <span className={storagePercent > 90 ? 'text-red-500 font-semibold' : ''}>
                {(storageUsed / (1024 * 1024)).toFixed(1)} MB / 1 GB
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className={`h-2 rounded-full transition-all duration-300 ${storageColor}`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            {storagePercent > 90 && (
              <p className='text-red-400 text-xs font-roboto mt-1'>
                ⚠ You're almost out of storage. Delete some files to free up space.
              </p>
            )}
            <p className='text-xs text-gray-400 font-roboto mt-1'>
              💡 Deleted files go to{' '}
              <span className='font-semibold text-primary-600'>Recently Deleted</span>
              {' '}and still count toward your storage. Permanently delete them there to free up space.
            </p>
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
            isRestoredFolder ? (
              <div className='flex flex-col items-center mt-3 justify-center border-2 border-dashed border-gray-200 rounded-xl py-24'>
                <p className='text-5xl mb-4'>📂</p>
                <p className='text-gray-400 font-roboto text-center text-sm md:text-lg'>
                  No restored files yet.
                </p>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => isOnline && fileInputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); if (isOnline) handleFiles(e.dataTransfer.files) }}
                className={`flex flex-col items-center mt-3 justify-center border-2 border-dashed rounded-xl py-24 transition-colors
                  ${!isOnline ? 'opacity-50 cursor-not-allowed border-gray-200' :
                    dragOver ? 'border-primary-600 bg-primary-50 cursor-pointer' : 
                    'border-gray-300 hover:border-primary-600 cursor-pointer'}`}
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
            )
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
                    <button onClick={(e) => { e.stopPropagation(); handleFileClick(file) }} title={`Open ${file.fileName}`}>
                      <img
                        src={
                          ['doc', 'docx'].includes(file.fileType) ? '/docsIcon.png' :
                          file.fileType === 'pdf' ? '/pdfIcon.png' :
                          ['ppt', 'pptx'].includes(file.fileType) ? '/pptIcon.png' :
                          ['xls', 'xlsx'].includes(file.fileType) ? '/xlsIcon.png' :
                          file.fileType === 'txt' ? '/txtIcon.png' :
                          ['png', 'jpg', 'jpeg'].includes(file.fileType) ? '/ImageIcon.png' :
                          '/fileIcon.png'
                        }
                        alt={file.fileType}
                        className='w-32 h-32 md:w-40 md:h-40 object-contain mt-4 hover:opacity-80 hover:cursor-pointer'
                      />
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveFileMenu(activeFileMenu === file.id ? null : file.id) }}
                      className='flex flex-col items-center justify-center gap-[3px] p-2 rounded-full hover:bg-gray-100 w-8 h-12'
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
                          onClick={() => handleDownload(file)}
                          className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                        >
                          <img src='/download.png' alt='download icon' className='w-5 h-5' /> Download
                        </button>
                        <hr className='my-1 border-gray-100' />
                        <button
                          onClick={() => { setPendingDelete({ id: file.id, name: file.fileName }); setActiveFileMenu(null) }}
                          className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-red-50 font-semibold'
                        >
                          <img src='/delete.png' alt='delete icon' className='w-5 h-5' /> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <p className='text-center font-inter font-semibold text-primary-600 text-xs md:text-sm 2xl:text-md mt-1 w-full truncate px-1'>
                    {file.fileName}
                  </p>
                  <p className='text-center font-roboto text-gray-400 text-xs'>{file.fileSize}</p>
                </div>
              ))}

              {/* ── Drop more files zone: hidden in Restored Files folder ── */}
              {!isRestoredFolder && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                    onClick={() => isOnline && fileInputRef.current?.click()}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); if (isOnline) handleFiles(e.dataTransfer.files) }}
                  className={`flex items-center justify-center border-2 border-dashed rounded-xl py-6 cursor-pointer transition-colors
                    ${dragOver ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-600'}`}
                >
                  <p className='text-gray-400 font-roboto text-sm text-center'>
                    + Drop more files or <span className='text-primary-600 font-bold'>click to browse</span>
                    <br />
                    <span className='text-xs text-gray-500'>Max 10 MB per file</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* File Preview Modal */}
      {previewFile && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col' onClick={(e) => e.stopPropagation()}>
          <div className='flex justify-between items-center px-4 py-3 bg-primary-600'>
            <p className='text-white font-roboto font-semibold truncate'>{previewFile.fileName}</p>
            <div className='flex items-center gap-5'>
              {previewFile.fileType === 'pdf' ? (
                <a href={previewFile.fileUrl} target="_blank" rel="noopener noreferrer" className="text-white text-xs md:text-md lg:text-[16px] xl:text-[16px] 2xl:text-[16px] font-roboto hover:opacity-70" title="Open PDF in new tab">
                  <div className="flex flex-row gap-3 items-center">
                    <img className="w-5 h-5 " src="/ViewIcon.png" alt="view icon" />
                    View in New Tab
                  </div>
                </a>
              ) : (
                <a href={previewFile.fileUrl} download className="text-white text-md font-roboto hover:opacity-70" title="Download file">
                  <div className="flex flex-row gap-3 items-center">
                    <img className="w-5 h-5" src="/downloadIcon.png" alt="download icon" />
                    Download
                  </div>
                </a>
              )}
              <button
                onClick={() => { setPreviewFile(null); setPageNumber(1); setNumPages(0) }}
                className='text-white font-bold text-xl hover:opacity-70'
              >
                ✕
              </button>
            </div>
          </div>

          <div className={`flex-1 bg-gray-900 ${previewFile.fileType === 'pdf' ? 'flex flex-col overflow-hidden' : 'flex items-center justify-center overflow-auto'}`}>
            {['png', 'jpg', 'jpeg'].includes(previewFile.fileType) && (
              <img src={previewFile.fileUrl} alt={previewFile.fileName} className='max-w-full max-h-full object-contain' />
            )}

            {previewFile.fileType === 'pdf' && (
              <div className='flex flex-col w-full h-full'>
                <div className='flex-1 overflow-y-auto flex justify-center py-4'>
                  <Document
                    file={pdfFile}
                    onLoadSuccess={({ numPages }) => { setNumPages(numPages); setPageNumber(1) }}
                    onLoadError={(error) => console.error('PDF load error:', error)}
                    loading={<p className='text-white font-roboto mt-10'>Loading PDF...</p>}
                    error={<p className='text-red-400 font-roboto mt-10'>Failed to load PDF.</p>}
                  >
                    <Page
                      pageNumber={pageNumber}
                      width={Math.min(window.innerWidth - 32, 800)}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </Document>
                </div>
                {numPages > 0 && (
                  <div className='flex-shrink-0 flex items-center justify-center gap-4 py-4 bg-gray-900'>
                    <div className='flex items-center gap-4 bg-gray-800 px-6 py-3 rounded-full'>
                      <button onClick={(e) => { e.stopPropagation(); setPageNumber((p) => Math.max(p - 1, 1)) }} disabled={pageNumber <= 1} className='text-white font-bold text-lg disabled:opacity-30 px-2'>‹</button>
                      <p className='text-white font-roboto text-sm'>Page {pageNumber} of {numPages}</p>
                      <button onClick={(e) => { e.stopPropagation(); setPageNumber((p) => Math.min(p + 1, numPages)) }} disabled={pageNumber >= numPages} className='text-white font-bold text-lg disabled:opacity-30 px-2'>›</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {previewFile.fileType === 'txt' && <TxtPreview url={previewFile.fileUrl} />}

            {['doc', 'docx', 'ppt', 'pptx'].includes(previewFile.fileType) && (
              <iframe
                src={`https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(previewFile.fileUrl)}`}
                className='w-full h-full'
                title={previewFile.fileName}
              />
            )}
              {['xls', 'xlsx'].includes(previewFile.fileType) && (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewFile.fileUrl)}`}
                  className='w-full h-full'
                  title={previewFile.fileName}
                />
              )}
          </div>
        </div>
      )}

      {pendingDelete && (
        <SoftDeleteModal
          itemName={pendingDelete.name}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

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
                onChange={(e) => { setEditName(e.target.value); setEditError('') }}
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