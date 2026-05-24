import { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCourses } from '../hooks/useCourses'
import { useCourseFiles } from '../hooks/useCourseFiles'
import type { User } from 'firebase/auth'

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
const FUNCTION_URL = import.meta.env.VITE_STUDY_GENERATOR_URL as string

// Session storage keys
export const SESSION_KEY_RESULT = 'studygen_result'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Course Picker Modal ──────────────────────────────────────────────────────

function CoursePicker({
  user,
  courses,
  onSelect,
  onClose,
  onError,
}: {
  user: User | null
  courses: { id: string; name: string }[]
  onSelect: (file: UploadedFile) => void
  onClose: () => void
  onError: (msg:string) => void 
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
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-2xl shadow-2xl w-[95%] max-w-xl flex flex-col max-h-[80vh] overflow-hidden'>
        <div className='flex items-center justify-between px-6 py-4 bg-primary-600 rounded-t-2xl'>
          <p className='text-white font-roboto font-bold text-xl uppercase'>
            {selectedCourse ? selectedCourse.name : 'Choose a Folder'}
          </p>
          <button onClick={onClose} className='text-white font-bold text-2xl hover:opacity-70'>✕</button>
        </div>

        <div className='flex-1 overflow-y-auto p-6'>
          {!selectedCourseId && (
            <>
              {courses.length === 0 ? (
                <p className='text-gray-400 font-roboto text-center py-10'>
                  No courses found. Create one in the Courses page first.
                </p>
              ) : (
                <div className='grid grid-cols-2 gap-4'>
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className='flex flex-col items-center gap-2 p-4 border-2 border-gray-100 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition group'
                    >
                      <img src='folder.png' alt='folder' className='w-16 group-hover:opacity-80' />
                      <p className='font-roboto font-bold text-primary-600 text-sm text-center truncate w-full'>{course.name}</p>
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
                className='flex items-center gap-1 text-primary-600 font-roboto font-semibold text-sm mb-4 hover:underline'
              >
                ← Back to courses
              </button>

              {loading ? (
                <p className='text-gray-400 font-roboto text-center py-10'>Loading files...</p>
              ) : files.length === 0 ? (
                <p className='text-gray-400 font-roboto text-center py-10'>No files in this folder.</p>
              ) : (
                <div className='flex flex-col gap-2'>
                  {files
                    .filter((f) => allowed.includes(f.fileType))
                    .map((file) => (
                      <button
                        key={file.id}
                        onClick={() => handlePickFile(file)}
                        className='flex items-center gap-4 px-4 py-3 border border-gray-100 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition text-left'
                      >
                        <img
                          src={
                            file.fileType === 'pdf' ? '/pdfIcon.png' :
                            ['doc', 'docx'].includes(file.fileType) ? '/docsIcon.png' :
                            ['ppt', 'pptx'].includes(file.fileType) ? '/pptIcon.png' :
                            '/txtIcon.png'
                          }
                          alt={file.fileType}
                          className='w-10 h-10 object-contain flex-shrink-0'
                        />
                        <div className='flex-1 min-w-0'>
                          <p className='font-roboto font-semibold text-primary-600 text-sm truncate'>{file.fileName}</p>
                          <p className='font-roboto text-gray-400 text-xs'>{file.fileSize}</p>
                        </div>
                        <span className='text-primary-600 font-bold text-lg'>+</span>
                      </button>
                    ))}
                </div>
              )}

              {files.length > 0 && files.filter((f) => allowed.includes(f.fileType)).length === 0 && (
                <p className='text-gray-400 font-roboto text-center py-10 text-sm'>
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
  const [isGenerating, setIsGenerating] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const items = [10, 20, 30, 40, 50]


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
  const file = fileList[0]
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    setFileError(`File type ".${ext}" is not supported. Please upload PDF, DOC, DOCX, PPT, PPTX, or TXT.`)
    return
  }

  // Add this 👇
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB in bytes
  if (file.size > MAX_SIZE) {
    setFileError('File size exceeds 10MB. Please upload a smaller file.')
    return
  }

  setUploadedFile({ name: file.name, size: formatBytes(file.size), type: ext, source: 'local', file })
}

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setFileError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!uploadedFile) { setFileError('Please upload or select a file first.'); return }
    if (!selectItems) { setFileError('Please select the number of items.'); return }
    setFileError('')
    setIsGenerating(true)

    try {
      let body: BodyInit
      const headers: Record<string, string> = {}

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

      const response = await fetch(FUNCTION_URL, { method: 'POST', headers, body })
      const data = await response.json()

      if (!response.ok) {
        setFileError(data.error || 'Something went wrong. Please try again.')
        return
      }

      // ── Save result to sessionStorage so it survives navigation ──
      const sessionData = {
        items: data.items,
        mode: activeTab,
        fileName: uploadedFile.name,
      }
      sessionStorage.setItem(SESSION_KEY_RESULT, JSON.stringify(sessionData))

      const path = activeTab === 'quiz' ? '/studyGenerator/Quiz' : '/studyGenerator/Flashcard'
      navigate(path, { state: sessionData })
    } catch (err) {
      console.error(err)
      setFileError('Network error. Please check your connection and try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const fileIconSrc = uploadedFile
    ? uploadedFile.type === 'pdf' ? '/pdfIcon.png'
      : ['doc', 'docx'].includes(uploadedFile.type) ? '/docsIcon.png'
      : ['ppt', 'pptx'].includes(uploadedFile.type) ? '/pptIcon.png'
      : '/txtIcon.png'
    : ''

  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-8 mt-1'>
        <div className='min-h-screen flex flex-col'>

          {/* Header */}
          <div className='flex flex-col md:flex-row lg:flex-row lg:items-center w-full gap-3 mb-6'>
            <p className='text-2xl lg:ml-0 md:ml-16 md:text-4xl lg:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
              Study Generator
            </p>
          </div>
          <hr className='w-full border-t border-primary-600 mb-6' />

          {/* Body */}
          <div className='h-full flex flex-col justify-start items-center'>
            <p className='mt-5 text-2xl md:text-4xl lg:text-4xl text-center text-primary-600 font-roboto font-bold'>
              Make Your Own Quiz/Flashcard Now!
            </p>
            <p className='mt-1 text-md text-center text-primary-600 font-roboto'>
              Generate your own quiz or flashcards by uploading a file.
            </p>

            {/* File Source Panel */}
            <div className='flex flex-col justify-center mt-10 gap-5 items-center w-full max-w-[800px] border-4 bg-primary-700 border-primary-600 rounded-3xl px-6 py-8'>
              <p className='lg:text-xl md:text-xl text-primary-600 font-bold font-fustat'>
                Choose where to access your files
              </p>

              <div className='flex flex-row gap-5 md:gap-16 lg:gap-16'>
                <div className='flex flex-col gap-3 justify-start items-center'>
                  <img className='w-20 md:w-32 lg:w-32' src='Localbtn.png' alt='localbtnicon' />
                  <button
                    className='bg-primary-600 text-white rounded-md text-sm md:text-xl lg:text-xl font-roboto font-bold px-3 py-1 md:px-5 md:py-2 lg:px-8 lg:py-2 hover:bg-primary-500'
                    onClick={() => { setFileError(''); fileInputRef.current?.click() }}
                    disabled={isGenerating}
                  >
                    Local Files
                  </button>
                </div>

                <p className='text-center lg:mt-16 text-primary-600 lg:text-xl md:text-xl md:mt-16 font-bold font-fustat'>or</p>

                <div className='flex flex-col gap-3 justify-start items-center'>
                  <img className='w-20 md:w-32 lg:w-32' src='Coursesbtn.png' alt='coursesbtnicon' />
                  <button
                    className='bg-primary-600 text-sm text-white rounded-md md:text-xl lg:text-xl font-roboto font-bold px-3 py-1 md:px-5 md:py-2 lg:px-8 lg:py-2 hover:bg-primary-500'
                    onClick={() => { setFileError(''); setShowCoursePicker(true) }}
                    disabled={coursesLoading || isGenerating}
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
                <div className='w-full mt-2 flex items-center gap-4 bg-white bg-opacity-90 border-2 border-primary-600 rounded-xl px-4 py-3'>
                  <img src={fileIconSrc} alt={uploadedFile.type} className='w-10 h-10 object-contain flex-shrink-0' />
                  <div className='flex-1 min-w-0'>
                    <p className='font-roboto font-bold text-primary-600 text-sm truncate'>{uploadedFile.name}</p>
                    <p className='font-roboto text-gray-400 text-xs'>
                      {uploadedFile.size} · from {uploadedFile.source === 'local' ? 'Local' : 'Courses'}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className='text-gray-400 hover:text-red-500 font-bold text-xl flex-shrink-0'
                    title='Remove file'
                    disabled={isGenerating}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {fileError && (
              <p className='mt-3 text-red-500 text-sm font-roboto text-center'>{fileError}</p>
            )}

            <p className='mt-6 text-center text-xs lg:text-sm md:text-sm text-primary-600'>
              <i><strong>Reminder:</strong> All files generated by Study Buddy may not be 100% accurate.
              Users are advised to review the generated files before proceeding. Thank you.</i>
            </p>

            {uploadedFile && (
              <div className='mt-8 flex flex-col justify-start items-center min-w-full'>
                <div className='flex flex-row gap-2 lg:gap-8 md:gap-14'>
                  <button
                    className={`border-primary-600 border-2 font-roboto font-bold min-w-44 py-2 rounded-md uppercase transition
                      ${activeTab === 'quiz' ? 'bg-primary-600 text-white' : 'text-primary-600 hover:bg-primary-600 hover:text-white'}`}
                    onClick={() => setActiveTab('quiz')}
                    disabled={isGenerating}
                  >
                    Quiz
                  </button>
                  <button
                    className={`border-2 border-primary-600 font-roboto font-bold min-w-44 py-2 rounded-md uppercase transition
                      ${activeTab === 'flashcard' ? 'bg-primary-600 text-white' : 'text-primary-600 hover:bg-primary-600 hover:text-white'}`}
                    onClick={() => setActiveTab('flashcard')}
                    disabled={isGenerating}
                  >
                    Flashcards
                  </button>
                </div>

                <div className='mt-5 w-full max-w-xl flex flex-row gap-3 justify-center items-center'>
                  <select
                    className='w-52 border-2 border-primary-600 text-primary-600 font-bold font-fustat rounded-md text-center py-3 px-2'
                    aria-label='Select Number of Items'
                    value={selectItems}
                    onChange={(e) => setSelectItems(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={isGenerating}
                  >
                    <option value='' disabled>Select number of items</option>
                    {items.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>

                  <button
                    className='sm:w-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 transition rounded-md px-4 py-3'
                    onClick={() => setSelectItems(items[Math.floor(Math.random() * items.length)])}
                    disabled={isGenerating}
                  >
                    <img src='/RandomIcon.png' alt='Random' className='w-6 h-6 object-contain' />
                    <span className='text-white uppercase text-sm font-semibold font-roboto'>Random</span>
                  </button>
                </div>

                <button
                  className={`mt-8 border font-bold font-roboto uppercase px-5 py-2 rounded-md mb-20 transition
                    ${uploadedFile && selectItems && !isGenerating
                      ? 'bg-green-500 text-white hover:bg-green-400 cursor-pointer'
                      : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}
                  onClick={handleGenerate}
                  disabled={!uploadedFile || !selectItems || isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate Now'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {showCoursePicker && (
        <CoursePicker
          user={user}
          courses={courses}
          onSelect={(file) => { setUploadedFile(file); setFileError('') }}
          onClose={() => setShowCoursePicker(false)}
          onError={(msg) => { setFileError(msg); setShowCoursePicker(false) }} 
        />
      )}
    </div>
  )
}

export default StudyGenerator