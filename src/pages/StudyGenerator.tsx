import { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useCourses } from '../hooks/useCourses'
import { useCourseFiles } from '../hooks/useCourseFiles'
import type { User } from 'firebase/auth'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { useTour } from '../hooks/useTour'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedFile {
  name: string
  size: string
  type: string
  source: 'local' | 'course'
  file?: File
  fileUrl?: string
}

interface CourseFile {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt']
const ACCEPTED_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.txt'
const ENQUEUE_URL = import.meta.env.VITE_STUDY_GENERATOR_ENQUEUE_URL as string
const CANCEL_URL = import.meta.env.VITE_STUDY_GENERATOR_CANCEL_URL as string
const COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes
const COOLDOWN_KEY = 'studygen_cooldown_until'
const TICKET_KEY = 'studygen_ticket_id' // persists the in-flight ticket id across navigation/unmount

// Session storage keys
export const SESSION_KEY_RESULT = 'studygen_result'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Course Picker Modal ──────────────────────────────────────────────────────

function CoursePicker({
  user,
  courses,
  onSelect,
  onClose,
  onError,
}: {
  user: User | null
  courses: { id: string; name: string; color?: string; fileCount?: number }[]
  onSelect: (file: UploadedFile) => void
  onClose: () => void
  onError: (msg: string) => void
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const selectedCourse = courses.find((c) => c.id === selectedCourseId)
  const { files, loading } = useCourseFiles(user, selectedCourseId ?? undefined)
  const allowed = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt']

  const handlePickFile = (file: CourseFile) => {
    const parseSize = (sizeStr: string): number => {
      const num = parseFloat(sizeStr)
      if (sizeStr.includes('GB')) return num * 1024 * 1024 * 1024
      if (sizeStr.includes('MB')) return num * 1024 * 1024
      if (sizeStr.includes('KB')) return num * 1024
      return num
    }

    if (parseSize(file.fileSize) > 10 * 1024 * 1024) {
      onError('File size exceeds 10MB. Please upload a smaller file.')
      return
    }

    onSelect({
      name: file.fileName,
      size: file.fileSize,
      type: file.fileType,
      source: 'course',
      fileUrl: file.fileUrl,
    })
    onClose()
  }

  return (
    <div className='fixed inset-0  bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-2xl w-[95%] 2xl:w-[600px] 3xl:w-[720px] 2xl:h-[500px] 3xl:h-[600px] max-w-xl 3xl:max-w-2xl flex flex-col max-h-[80vh] overflow-hidden'>
        <div className='flex items-center justify-between px-6 3xl:px-8 py-4 3xl:py-5 bg-primary-600 rounded-t-lg'>
          <p className='text-white font-roboto font-bold text-sm lg:text-xs 2xl:text-lg 3xl:text-2xl uppercase'>
            {selectedCourse ? selectedCourse.name : 'Choose a Folder'}
          </p>
          <button onClick={onClose} className='text-white font-bold text-sm lg:text-xs 2xl:text-lg 3xl:text-2xl hover:opacity-70'>✕</button>
        </div>

        <div className='flex-1 overflow-y-auto p-6 3xl:p-8'>
          {!selectedCourseId && (
            <>
              {courses.length === 0 ? (
                <p className='text-gray-400 font-roboto text-center py-10 3xl:text-lg'>
                  No courses found. Create one in the Courses page first.
                </p>
              ) : (
                <div className='grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-3 gap-4 3xl:gap-6'>
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className='flex flex-col items-center gap-2 p-4 3xl:p-6 border-2 border-gray-100 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition group'
                    >
                    <img
                      src={`/${course.fileCount && course.fileCount > 0 ? 'storefolder' : 'folder'}-${course.color || 'blue'}.png`}
                      alt='folder'
                      className='w-16 2xl:w-20 3xl:w-24 group-hover:opacity-80 select-none'
                      onContextMenu={(e) => e.preventDefault()}
                      draggable={false}
                    />
                      <p className='font-roboto font-bold text-primary-600 text-sm 3xl:text-lg text-center truncate w-full'>{course.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {selectedCourseId && (
            <>
              <button
                onClick={() => setSelectedCourseId(null)}
                className='flex items-center gap-1 text-primary-600 font-roboto font-semibold text-sm 3xl:text-lg mb-4 hover:underline'
              >
                ← Back to courses
              </button>

              {loading ? (
                <p className='text-gray-400 font-roboto text-center py-10 3xl:text-lg'>Loading files...</p>
              ) : files.length === 0 ? (
                <p className='text-gray-400 font-roboto text-center py-10 3xl:text-lg'>No files in this folder.</p>
              ) : (
                <div className='flex flex-col gap-2 3xl:gap-3'>
                  {files
                    .filter((f) => allowed.includes(f.fileType))
                    .map((file) => (
                      <button
                        key={file.id}
                        onClick={() => handlePickFile(file)}
                        className='flex items-center gap-4 px-4 py-3 3xl:px-6 3xl:py-4 border border-gray-100 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition text-left'
                      >
                        <img
                          src={
                            file.fileType === 'pdf' ? '/pdfIcon.png' :
                            ['doc', 'docx'].includes(file.fileType) ? '/docsIcon.png' :
                            ['ppt', 'pptx'].includes(file.fileType) ? '/pptIcon.png' :
                            '/txtIcon.png'
                          }
                          alt={file.fileType}
                          className='w-10 h-10 3xl:w-14 3xl:h-14 object-contain flex-shrink-0 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false}
                        />
                        <div className='flex-1 min-w-0'>
                          <p className='font-roboto font-semibold text-primary-600 text-sm 3xl:text-lg truncate'>{file.fileName}</p>
                          <p className='font-roboto text-gray-400 text-xs 3xl:text-sm'>{file.fileSize}</p>
                        </div>
                        <span className='text-primary-600 font-bold text-lg 3xl:text-2xl'>+</span>
                      </button>
                    ))}
                </div>
              )}

              {files.length > 0 && files.filter((f) => allowed.includes(f.fileType)).length === 0 && (
                <p className='text-gray-400 font-roboto text-center py-10 text-sm 3xl:text-lg'>
                  No supported files (PDF, DOC, DOCX, PPT, PPTX, TXT) found in this folder.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

function StudyGenerator() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { courses, loading: coursesLoading } = useCourses(user)

  const [selectItems, setSelectItems] = useState<number | ''>('')
  const [activeTab, setActiveTab] = useState<'quiz' | 'flashcard'>('quiz')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [showCoursePicker, setShowCoursePicker] = useState(false)
  const [fileError, setFileError] = useState('')
const [queueStatus, setQueueStatus] = useState<'idle' | 'queued' | 'processing' | 'done' | 'error'>(
  () => (localStorage.getItem(TICKET_KEY) ? 'queued' : 'idle')
)
const [ticketId, setTicketId] = useState<string | null>(() => localStorage.getItem(TICKET_KEY))
  const [ticketNumber, setTicketNumber] = useState<number | null>(null)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [suggestedMax, setSuggestedMax] = useState<number | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false) // guards against double-click before the server responds

  const [tourPreview, setTourPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const items = [10, 20, 30, 40, 50]
  const isOnline = useNetworkStatus()

  //scroll sa div ng options
  const generateSectionRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (uploadedFile && generateSectionRef.current) {
      const timeout = setTimeout(() => {
        generateSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [uploadedFile])

  // initialize cooldown from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(COOLDOWN_KEY)
    if (stored) {
      const remaining = Math.ceil((parseInt(stored) - Date.now()) / 1000)
      if (remaining > 0) startCooldownTimer(remaining)
    }
  }, [])

  // ── Listen to my ticket's status ─────────────────────────────────────────
  useEffect(() => {
    if (!ticketId) return

    const ref = doc(db, 'queueTickets', ticketId)
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        // ticket no longer exists server-side (expired/purged) — don't leave a stale id around
        localStorage.removeItem(TICKET_KEY)
        setQueueStatus('idle')
        setTicketId(null)
        setTicketNumber(null)
        setQueuePosition(null)
        return
      }
      const data = snap.data()

      if (data.status === 'waiting') {
        setQueueStatus('queued')
        setTicketNumber(data.ticketNumber)
      } else if (data.status === 'processing') {
        setQueueStatus('processing')
      } else if (data.status === 'done') {
        localStorage.removeItem(TICKET_KEY)
        setQueueStatus('done')

        const sessionData = {
          items: data.result?.items ?? [],
          mode: data.mode,
          fileName: uploadedFile?.name ?? data.fileName ?? '',
        }
        sessionStorage.setItem(SESSION_KEY_RESULT, JSON.stringify(sessionData))

        const cooldownUntil = Date.now() + COOLDOWN_MS
        localStorage.setItem(COOLDOWN_KEY, String(cooldownUntil))
        startCooldownTimer(Math.ceil(COOLDOWN_MS / 1000))

        const path = data.mode === 'quiz' ? '/studyGenerator/Quiz' : '/studyGenerator/Flashcard'

        // brief delay so the "ready" banner is visible for a beat before navigating away
        setTimeout(() => {
          navigate(path, { state: sessionData })
        }, 400)

        setTicketId(null)
        setTicketNumber(null)
        setQueuePosition(null)
      } else if (data.status === 'failed') {
        localStorage.removeItem(TICKET_KEY)
        setQueueStatus('error')
        setFileError(data.error || 'Something went wrong. Please try again.')
        setTicketId(null)
        setTicketNumber(null)
        setQueuePosition(null)
      } else if (data.status === 'cancelled') {
        localStorage.removeItem(TICKET_KEY)
        setQueueStatus('idle')
        setTicketId(null)
        setTicketNumber(null)
        setQueuePosition(null)
      }
    })

    return () => unsub()
  }, [ticketId])

  // ── Live position + estimated wait ───────────────────────────────────────
  useEffect(() => {
    if (!ticketNumber || queueStatus !== 'queued') return

    const q = query(
      collection(db, 'queueTickets'),
      where('status', 'in', ['waiting', 'processing']),
      where('ticketNumber', '<', ticketNumber)
    )
    const unsub = onSnapshot(q, (snap) => {
      setQueuePosition(snap.size + 1)
    })

    return () => unsub()
  }, [ticketNumber, queueStatus])

  // ── countdown ticker ────────────────────────────────────────────────
  function startCooldownTimer(seconds: number) {
    setCooldownSeconds(seconds)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          cooldownRef.current = null
          localStorage.removeItem(COOLDOWN_KEY)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // clear interval on unmount
  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  // ── Restore on mount: finished result takes priority, otherwise resume a live ticket ──
// ── Restore a finished result on mount, if one exists (ticket restore now happens via lazy init above) ──
useEffect(() => {
  const saved = sessionStorage.getItem(SESSION_KEY_RESULT)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.mode === 'quiz') {
        navigate('/studyGenerator/Quiz', { state: parsed, replace: true })
      } else if (parsed.mode === 'flashcard') {
        navigate('/studyGenerator/Flashcard', { state: parsed, replace: true })
      }
    } catch {/**/}
  }
}, [])


  // ── Local file handling ───────────────────────────────────────────────────

  const handleLocalFile = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setFileError('')
    setSuggestedMax(null)
    const file = fileList[0]
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setFileError(`File type ".${ext}" is not supported. Please upload PDF, DOC, DOCX, PPT, PPTX, or TXT.`)
      return
    }

    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setFileError('File size exceeds 10MB. Please upload a smaller file.')
      return
    }

    setUploadedFile({ name: file.name, size: formatBytes(file.size), type: ext, source: 'local', file })
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setFileError('')
    setSuggestedMax(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!uploadedFile) { setFileError('Please upload or select a file first.'); return }
    if (!selectItems) { setFileError('Please select the number of items.'); return }
    if (!isOnline) { setFileError('You are offline. Please reconnect to generate.'); return }
    if (cooldownSeconds > 0) return
    if (isSubmitting) return // extra guard in case of rapid double-clicks

    setIsSubmitting(true) // disable immediately, before any await
    setFileError('')
    setSuggestedMax(null)
    sessionStorage.removeItem(SESSION_KEY_RESULT)

    try {
      if (!user) { setFileError('Please log in to generate study materials.'); return }
      const idToken = await user.getIdToken()

      let body: BodyInit
      const headers: Record<string, string> = { Authorization: `Bearer ${idToken}` }

      if (uploadedFile.source === 'local' && uploadedFile.file) {
        const formData = new FormData()
        formData.append('file', uploadedFile.file)
        formData.append('mode', activeTab)
        formData.append('numItems', String(selectItems))
        body = formData
      } else {
        headers['Content-Type'] = 'application/json'
        body = JSON.stringify({
          fileUrl: uploadedFile.fileUrl,
          fileType: uploadedFile.type,
          mode: activeTab,
          numItems: selectItems,
        })
      }

      const response = await fetch(ENQUEUE_URL, { method: 'POST', headers, body })
      const data = await response.json()

      if (!response.ok) {
        if (data.retryAfter) {
          const cooldownUntil = Date.now() + data.retryAfter * 1000
          localStorage.setItem(COOLDOWN_KEY, String(cooldownUntil))
          startCooldownTimer(data.retryAfter)
          setFileError(data.error)
        } else if (data.suggested_max) {
          setFileError(data.error)
          setSuggestedMax(data.suggested_max)
        } else {
          setFileError(data.error || 'Something went wrong. Please try again.')
        }
        return
      }

      setTicketId(data.ticketId)
      localStorage.setItem(TICKET_KEY, data.ticketId) // survive navigation/unmount
      setQueuePosition(data.position)
      setQueueStatus('queued')
    } catch (err) {
      console.error(err)
      setFileError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false) // always release the lock, success or failure
    }
  }

  const handleCancelQueue = async () => {
    if (!ticketId || !user) return
    try {
      const idToken = await user.getIdToken()
      await fetch(CANCEL_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      })
    } catch (err) {
      console.error(err)
    } finally {
      localStorage.removeItem(TICKET_KEY)
      setQueueStatus('idle')
      setTicketId(null)
      setTicketNumber(null)
      setQueuePosition(null)
    }
  }

  const isCoolingDown = cooldownSeconds > 0
  const isQueuedOrProcessing = queueStatus === 'queued' || queueStatus === 'processing'
  const isGenerating = isQueuedOrProcessing || isSubmitting
  const canGenerate = !!uploadedFile && !!selectItems && !isQueuedOrProcessing && !isCoolingDown && !isSubmitting && isOnline

  const fileIconSrc = uploadedFile
    ? uploadedFile.type === 'pdf' ? '/pdfIcon.png'
      : ['doc', 'docx'].includes(uploadedFile.type) ? '/docsIcon.png'
      : ['ppt', 'pptx'].includes(uploadedFile.type) ? '/pptIcon.png'
      : '/txtIcon.png'
    : ''
  const { startTour } = useTour(
    'studygenerator',
    false,
    () => {},
    () => {},
    user,
    () => setTourPreview(false)
  )
  return (
    <div className='flex h-screen'>
      <div className='lg:p-3 '>
        <Sidebar />
      </div>
      <div className='flex-1 flex flex-col overflow-hidden'>

        {/* Top Bar — mobile only */}
        <div className='lg:hidden flex items-center justify-between px-4 sm:px-6 py-2 bg-white  top-0 left-0 right-0 z-10 relative'>
          <p className='absolute left-1/2 -translate-x-1/2 font-inter mt-4 font-semibold text-md text-[#B3B3B3] uppercase'>Study Generator</p>
          <button
            id='tour-btn'
            onClick={() => startTour()}
            className='flex flex-col items-center gap-1 ml-auto pt-3
              hover:opacity-80 active:scale-95 transition-all'
            title='Take a Tour'
          >
            <div className='bg-white  pt-2 w-9 h-9 rounded-full  flex items-center justify-center text-2xl font-bold'>
              <img src="/needhelp.png" alt="?" className='w-9 block mx-auto mt-1 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
            </div>
            <p className='text-[9px] text-primary-600 lg:text-primary-600 md:text-primary-600 xl:text-primary-600 2xl:text-primary-600 font-inter font-medium '>Need Help?</p>
          </button>
        </div>
        <main className="flex-1  w-full  overflow-auto p-2 px-5 md:px-7  md:py-0 md:pt-0 py-0  lg:p-2 lg:pt-2 2xl:pt-0 2xl:px-10 3xl:px-14 3xl:pt-0 pt-1">
          <div className="min-h-screen  w-full flex flex-col">
            <p className='hidden lg:flex justify-center lg:justify-start w-full lg:pl-3 2xl:p-4 3xl:p-6  
            font-inter font-semibold text-sm md:text-md lg:text-[10px] xl:text-[12px] 2xl:text-[14px] 3xl:text-[18px] text-[#B3B3B3] uppercase
            mt-2 md:mt-4 lg:mt-1 xl:mt-2 2xl:mt-3 3xl:mt-4 '>Study Generator</p>
            {/* Header */}
            <div className="flex flex-col w-full lg:flex lg:flex-row md:flex-row 
          px-14 sm:px-12 justify-center items-center py-1
          lg:justify-end lg:items-start lg:pr-10 2xl:pr-16 3xl:pr-20 lg:px-0 lg:gap-3
          md:justify-between md:items-start sm:items-center gap-1 p-0">
            </div>

            {/* Body */}
            <div className='h-full flex flex-col justify-start items-center'>
              <p className='mt-1 text-xl md:text-4xl lg:text-lg 2xl:text-3xl 3xl:text-5xl text-center text-primary-600 font-roboto font-bold'>
                Make your own Quiz/Flashcard Now!
              </p>
              <p className='mt-2 lg:mt-0 xl:mt-1 2xl:mt-2 3xl:mt-3 text-xs lg:text-[10px] 2xl:text-lg 3xl:text-xl text-center text-primary-600 font-roboto'>
                Generate your own quiz or flashcards by uploading a file.
              </p>

              {/* cooldown banner */}
              {isCoolingDown && (
                <div className='mt-2  flex items-center gap-3 lg:text-[9px] xl:text-xs 2xl:text-sm 3xl:text-lg bg-yellow-50 border border-yellow-300  text-yellow-700 font-roboto text-sm font-semibold px-5 py-3 3xl:px-7 3xl:py-4 rounded-xl'>
                  <span>⏳</span>
                  <span>You can generate again in <span className='font-bold text-yellow-800'>{formatCountdown(cooldownSeconds)}</span></span>
                </div>
              )}
              {!isOnline && (
                <div className='mt-2 flex items-center gap-3 lg:text-[9px] 3xl:text-lg bg-red-50 border border-red-300 text-red-700 font-roboto text-sm font-semibold px-5 py-3 3xl:px-7 3xl:py-4 rounded-xl'>
                  <span>📶</span>
                  <span>You're offline. Connect to the internet to use the Study Generator.</span>
                </div>
              )}
              {queueStatus === 'queued' && (
                <div className='mt-2 flex items-center justify-between gap-3 lg:text-[9px] xl:text-xs 2xl:text-sm 3xl:text-lg bg-blue-50 border border-blue-300 text-blue-700 font-roboto text-sm font-semibold px-5 py-3 3xl:px-7 3xl:py-4 rounded-xl'>
                  <span>
                    🕒 You're <span className='font-bold text-blue-800'>#{queuePosition ?? '...'}</span> in queue
                    {queuePosition ? ` — est. wait ~${Math.max(30, queuePosition * 35)}s` : ''}
                  </span>
                  <button onClick={handleCancelQueue} className='text-red-500 hover:text-red-700 font-bold underline flex-shrink-0'>
                    Cancel
                  </button>
                </div>
              )}
              {queueStatus === 'processing' && (
                <div className='mt-2 flex items-center gap-3 lg:text-[9px] xl:text-xs 2xl:text-sm 3xl:text-lg bg-green-50 border border-green-300 text-green-700 font-roboto text-sm font-semibold px-5 py-3 3xl:px-7 3xl:py-4 rounded-xl'>
                  <span>⚙️ Generating your {activeTab === 'quiz' ? 'quiz' : 'flashcards'} now...</span>
                </div>
              )}
              {queueStatus === 'done' && (
                <div className='mt-2 flex items-center gap-3 lg:text-[9px] xl:text-xs 2xl:text-sm 3xl:text-lg bg-green-50 border border-green-300 text-green-700 font-roboto text-sm font-semibold px-5 py-3 3xl:px-7 3xl:py-4 rounded-xl'>
                  <span>✅ Your {activeTab === 'quiz' ? 'quiz' : 'flashcards'} are ready! Redirecting...</span>
                </div>
              )}
              {/* ─────────────────────── */}
              <hr className='w-72 mt-10 lg:mt-2 md:w-[500px] lg:w-[450px] 2xl:w-[650px] 3xl:w-[800px]  md:mt-10  mx-auto border-t border-primary-600 mb-1 md:mb-0' />
              {/* File Source Panel */}
              <div className='flex flex-col justify-center mt-2 md:mt-5 lg:mt-0 gap-1 items-center w-full max-w-[800px] 3xl:max-w-[1000px]  px-6 py-1'>
                <p className='text-sm lg:text-[14px] 2xl:text-lg 3xl:text-2xl md:text-xl text-primary-600 font-bold font-fustat mb-2 md:mb-10 lg:mb-1 2xl:mt-3'>
                  Choose where to access your files
                </p>

                <div className='flex flex-row  w-full justify-center items-center gap-2 md:gap-10 lg:gap-5 2xl:gap-10 3xl:gap-14 mt-4 lg:mt-2 2xl:mt-3'>
                  <div className='flex-shrink-0 flex flex-col gap-3 justify-start items-center border-2 md:border-2  border-primary-600 rounded-xl md:rounded-lg px-7 lg:px-2 lg:py-5 2xl:px-6 3xl:px-10 py-4 3xl:py-10 md:px-12 md:py-8 '>
                    <img className='w-16 h-16 md:w-32 md:h-32  lg:w-20 lg:h-20 2xl:w-28 2xl:h-28 3xl:w-36 3xl:h-36 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} src='Localbtn.png' alt='localbtnicon' />
                    <button
                      id='localFilesBtn'
                      onClick={() => { setFileError(''); setSuggestedMax(null); fileInputRef.current?.click() }}
                      disabled={isGenerating || !isOnline}
                      className='bg-[#FEE248]  disabled:bg-[#B0A030] lg:h-5 lg:w-28 2xl:w-32 2xl:h-7 3xl:w-40 3xl:h-9 w-24 md:w-44 text-xs text-primary-800  rounded-md md:text-xl lg:text-[10px] 2xl:text-sm 3xl:text-base font-roboto font-bold px-3 py-1 md:px-5 md:py-2 lg:mx-4 hover:bg-primary-800 hover:text-white flex items-center justify-center'
                    >
                      Local Files
                    </button>
                  </div>

                  <p className='flex-shrink-0 text-center lg:mt-10 text-primary-600 lg:text-sm 2xl:text-lg 3xl:text-2xl md:text-xl md:mt-16 font-bold font-fustat'>or</p>

                  <div className='flex-shrink-0 flex flex-col gap-3 justify-start items-center border-2 md:border-2  border-primary-600 rounded-xl md:rounded-lg px-7 lg:px-2 lg:py-5 2xl:px-6 3xl:px-10 py-4 3xl:py-10 md:px-12 md:py-8 '>
                    <img className='w-16 h-16 md:w-32 md:h-32  lg:w-20 lg:h-20 2xl:w-28 2xl:h-28 3xl:w-36 3xl:h-36 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} src='Coursesbtn.png' alt='coursesbtnicon' />
                    <button
                      id='courseFilesBtn'
                      onClick={() => { setFileError(''); setSuggestedMax(null); setShowCoursePicker(true) }}
                      disabled={coursesLoading || isGenerating || !isOnline}
                      className='bg-[#FEE248] disabled:bg-[#B0A030] lg:h-5 lg:w-28 2xl:w-32 2xl:h-7 3xl:w-40 3xl:h-9 w-24 md:w-44 text-xs text-primary-800  rounded-md md:text-xl lg:text-[10px] 2xl:text-sm 3xl:text-base font-roboto font-bold px-3 py-1 md:px-5 md:py-2 lg:mx-4 hover:bg-primary-800 hover:text-white flex items-center justify-center'
                    >
                      {coursesLoading ? 'Loading...' : 'Course Files'}
                    </button>
                  </div>
                </div>

                <input
                  aria-label='File input'
                  ref={fileInputRef}
                  type='file'
                  accept={ACCEPTED_TYPES}
                  className='hidden'
                  onChange={(e) => handleLocalFile(e.target.files)}
                />

                {uploadedFile && (
                  <div
                    ref={generateSectionRef}
                    className='w-full mt-2 flex items-center justify-between gap-2 bg-white bg-opacity-90 border border-primary-600 rounded-md px-4 py-3 lg:py-1 3xl:px-6 3xl:py-4'
                  >
                    <div className='flex items-center gap-2 min-w-0'>
                      <img src={fileIconSrc} alt={uploadedFile.type} className='w-10 h-10 lg:w-7 2xl:w-10 lg:h-7 2xl:h-10 3xl:w-14 3xl:h-14 object-contain flex-shrink-0 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
                      <div className='min-w-0 max-w-[180px] lg:max-w-[200px] 2xl:max-w-[180px] 3xl:max-w-[260px]'>
                        <p className='font-roboto font-bold text-primary-600 text-sm lg:text-[12px] 3xl:text-lg truncate'>{uploadedFile.name}</p>
                        <p className='font-roboto text-gray-400 lg:text-[10px] text-xs 3xl:text-sm'>
                          {uploadedFile.size} · from {uploadedFile.source === 'local' ? 'Local' : 'Courses'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className='text-gray-400 hover:text-red-500 font-bold text-xl 3xl:text-2xl flex-shrink-0'
                      title='Remove file'
                      disabled={isGenerating}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {fileError && (
                <p className='mt-1 text-red-500 text-sm lg:text-[10px] 3xl:text-base font-roboto text-center'>{fileError}</p>
              )}

              {suggestedMax && (
                <button
                  className='mt-1 text-sm font-roboto font-bold text-white bg-primary-600 hover:bg-primary-500  py-1 rounded-md uppercase px-2 lg:text-[10px] 2xl:text-lg 3xl:text-xl 3xl:px-4 3xl:py-2 transition'
                  onClick={() => {
                    setSelectItems(suggestedMax)
                    setFileError('')
                  }}
                >
                  Use {suggestedMax} items instead
                </button>
              )}

              <p className='mt-6 lg:mt-2 2xl:mt-6 text-center text-[9px] lg:text-[9px] 2xl:text-sm 3xl:text-base md:text-sm text-primary-600 leading-tight'>
                <i><strong>Reminder:</strong> All files generated by Study Buddy may not be 100% accurate.</i>
              </p>
              <p className='mt-0 text-center text-[9px] lg:text-[9px] 2xl:text-sm 3xl:text-base md:text-sm text-primary-600 leading-tight'>
                <i>Users are advised to review the generated files before proceeding. Thank you.</i>
              </p>
              {(uploadedFile || tourPreview) && (
                <div className='mt-5 flex flex-col justify-start items-center min-w-full'>
                  <div className='flex flex-row gap-2 lg:gap-x-8 md:gap-14'>
                    <button
                      id='quizTabBtn'
                      className={`border-primary-600 border font-roboto font-bold min-w-32 3xl:min-w-40 py-1 3xl:py-2 rounded-md uppercase transition lg:text-xs 2xl:text-lg 3xl:text-xl
                      ${activeTab === 'quiz' ? 'bg-primary-600 text-white' : 'text-primary-600 hover:bg-primary-600 hover:text-white'}`}
                      onClick={() => setActiveTab('quiz')}
                      disabled={isGenerating}
                    >
                      Quiz
                    </button>
                    <button
                      id='flashcardTabBtn'
                      className={`border-primary-600 border font-roboto font-bold min-w-32 3xl:min-w-40 py-1 3xl:py-2 rounded-md uppercase transition lg:text-xs 2xl:text-lg 3xl:text-xl                      ${activeTab === 'flashcard' ? 'bg-primary-600 text-white' : 'text-primary-600 hover:bg-primary-600 hover:text-white'}`}
                      onClick={() => setActiveTab('flashcard')}
                      disabled={isGenerating}
                    >
                      Flashcards
                    </button>
                  </div>

                  <div className='mt-2 2xl:mt-5 w-full max-w-xl flex flex-row gap-3 justify-center items-center'>
                    <select
                      id='itemsSelect'
                      className='w-52 3xl:w-64 border border-primary-600 text-primary-600 font-bold font-fustat rounded-md text-center lg:text-xs 2xl:text-[16px] 3xl:text-lg 2xl:mx-5 py-1 3xl:py-2 px-2'
                      aria-label='Select Number of Items'
                      value={selectItems}
                      onChange={(e) => {
                        setSelectItems(e.target.value === '' ? '' : Number(e.target.value))
                        setSuggestedMax(null)
                        setFileError('')
                      }}
                      disabled={isGenerating}
                    >
                      <option value='' disabled>Select number of items</option>
                      {items.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                      {/* Add suggested max as an option if it's not already in the list */}
                      {suggestedMax && !items.includes(suggestedMax) && (
                        <option key={`suggested-${suggestedMax}`} value={suggestedMax}>
                          {suggestedMax}
                        </option>
                      )}
                    </select>

                    <button
                      id='randomItemsBtn'
                      className='sm:w-auto  flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 transition rounded-md lg:text-xs 2xl:text-2xl 3xl:text-3xl 2xl:py-2 3xl:py-3 px-4 3xl:px-6 py-1'
                      onClick={() => {
                        setSelectItems(items[Math.floor(Math.random() * items.length)])
                        setFileError('')
                      }}
                      disabled={isGenerating}
                    >
                      <img src='/RandomIcon.png' alt='Random' className='w-6 h-6 lg:w-5 lg:h-5 3xl:w-8 3xl:h-8 object-contain select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
                      <span className='text-white uppercase text-sm 3xl:text-lg font-semibold font-roboto'>Random</span>
                    </button>
                  </div>

                  <button
                    id='generateNowBtn'
                    className={`mt-2 border font-bold font-roboto uppercase text-center lg:text-xs 2xl:text-lg 3xl:text-xl py-1 3xl:py-2 px-2 3xl:px-4 rounded-md mb-20 transition
                  ${canGenerate
                        ? 'bg-green-500 text-white hover:bg-green-400 cursor-pointer'
                        : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                  >
                    {isSubmitting
                      ? 'Submitting...'
                      : queueStatus === 'queued'
                        ? `#${queuePosition ?? '...'} in queue`
                        : queueStatus === 'processing'
                          ? 'Generating...'
                          : isCoolingDown
                            ? `Wait ${formatCountdown(cooldownSeconds)}`
                            : 'Generate Now'}
                  </button>
                </div>
              )}

            </div>
          </div>
          <button
            id='tour-btn'
            onClick={() => startTour()}
            className='hidden lg:flex fixed bottom-6 right-6 z-50
            flex-col items-center gap-1
            hover:opacity-80 active:scale-95 transition-all
            lg:bottom-8 lg:right-8'
            title='Take a Tour'
          >
            <div className='w-7 h-7 lg:w-7 lg:h-7 2xl:w-10 2xl:h-10 3xl:w-12 3xl:h-12  flex items-center justify-center text-2xl font-bold'>
              <img src="/needhelp.png" alt="?" className='w-12 block mx-auto mt-1 select-none' onContextMenu={(e) => e.preventDefault()} draggable={false} />
            </div>
            <p className='text-[8px] md:text-[8px] text-primary-800  uppercase text-center lg:text-[8px] 2xl:text-[10px] 3xl:text-[11px]
              font-inter font-semibold'>Need Help?</p>
          </button>

        </main>
      </div>
      {showCoursePicker && (
        <CoursePicker
          user={user}
          courses={courses}
          onSelect={(file) => { setUploadedFile(file); setFileError(''); setSuggestedMax(null) }}
          onClose={() => setShowCoursePicker(false)}
          onError={(msg) => { setFileError(msg); setShowCoursePicker(false) }}
        />
      )}
    </div>
  )
}

export default StudyGenerator