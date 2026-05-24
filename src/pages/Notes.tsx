import { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useNotes, type Note } from '../hooks/useNotes'
import { useClassSched } from '../hooks/useClassSched'


function Notes() {
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const { user } = useAuth()
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes(user)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const [deleteSubjectConfirm, setDeleteSubjectConfirm] = useState<string | null>(null)

  const [confirmDownload, setConfirmDownload] = useState<Note | null>(null)

async function handleSubjectDelete(subject: string) {
  // Reset all notes with this subject to 'All Subject' in Firestore
  const affectedNotes = notes.filter((n) => n.subject === subject)
  await Promise.all(
    affectedNotes.map((n) => updateNote(n.id, { subject: 'All Subject' }))
  )

  setSubjects((prev) => prev.filter((s) => s !== subject))
  if (selectedSubject === subject) setSelectedSubject('All Subject')
  setDeleteSubjectConfirm(null)

}
function handleCloseAttempt() {
  if (modalMode === 'edit') {
    setShowDiscardConfirm(true)
  } else {
    closeNoteModal()
  }
}
  const { schedules } = useClassSched(user)   
  // ── Subject & filter state ──
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false)
  const [subjectName, setSubjectName] = useState('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [selectedSubject, setSelectedSubject] = useState('All Subject')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Note modal state ──
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>('create')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteSubject, setNoteSubject] = useState('All Subject')
  const [noteContent, setNoteContent] = useState('')
  const [modalTime, setModalTime] = useState({ date: '', time: '' })

// ── 3-dot menu state ──
const [openMenuId, setOpenMenuId] = useState<string | null>(null)

// ── Close dropdowns on outside click ──
useEffect(() => {
  if (notes.length === 0) return
  const schedSubjects = schedules.map((s) => s.subject)
  const fromNotes = notes
    .map((n) => n.subject)
    .filter((s) => s !== 'All Subject' && !schedSubjects.includes(s))
  setSubjects((prev) => Array.from(new Set([...prev, ...fromNotes])))
}, [notes])

// ── Close dropdowns on outside click ──
useEffect(() => {
  function handleOutsideClick(e: MouseEvent) {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsDropdownOpen(false)
    }
    const clickedInsideMenu = Array.from(
      document.querySelectorAll('[data-note-menu]')
    ).some((el) => el.contains(e.target as Node))
    if (!clickedInsideMenu) {
      setOpenMenuId(null)
    }
  }
  document.addEventListener('mousedown', handleOutsideClick)
  return () => document.removeEventListener('mousedown', handleOutsideClick)
}, [])

  // ── Subject handlers ──
  function handleSubjectSave() {
    if (subjectName.trim() === '') return
    setSubjects((prev) => [...prev, subjectName.trim()])
    setSubjectName('')
    setIsSubjectModalOpen(false)
    setIsDropdownOpen(true)
  }

  // ── Modal open helpers ──
  function openNoteModal() {
    setSelectedNote(null)
    setModalMode('create')
    const now = new Date()
    setModalTime({
      date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    })
    setNoteTitle('')
    setNoteSubject(selectedSubject !== 'All Subject' ? selectedSubject : 'All Subject')
    setNoteContent('')
    setIsNoteModalOpen(true)
  }

  function openViewModal(note: Note) {
    setSelectedNote(note)
    setModalMode('view')
    setModalTime({
      date: new Date(note.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: new Date(note.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    })
    setIsNoteModalOpen(true)
  }

  function openEditModal(note: Note) {
    setSelectedNote(note)
    setModalMode('edit')
    setModalTime({
      date: new Date(note.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: new Date(note.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    })
    setNoteTitle(note.title)
    setNoteSubject(note.subject)
    setNoteContent(note.content)
    setIsNoteModalOpen(true)
  }

  function closeNoteModal() {
    setIsNoteModalOpen(false)
    setSelectedNote(null)
  }

  // ── Note CRUD handlers ──
  async function handleNoteSave() {
    if (noteTitle.trim() === '' || noteContent.trim() === '') return
    await addNote(noteTitle, noteSubject, noteContent)
    setNoteTitle('')
    setNoteSubject('All Subject')
    setNoteContent('')
    setIsNoteModalOpen(false)
  }

  async function handleNoteUpdate() {
    if (!selectedNote || noteTitle.trim() === '') return
    await updateNote(selectedNote.id, {
      title: noteTitle.trim(),
      subject: noteSubject,
      content: noteContent.trim(),
    })
    closeNoteModal()
  }

  // ── Download as .txt ──
  function downloadNote(note: Note) {
    const text = [
      `Title: ${note.title}`,
      `Subject: ${note.subject}`,
      `Date: ${new Date(note.createdAt).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })}`,
      '',
      note.content,
    ].join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Filtered notes ──
  const filteredNotes = notes
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((n) => selectedSubject === 'All Subject' || n.subject === selectedSubject)
    .filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()))

  // ── Derived modal display values ──
  const displayTitle   = modalMode === 'view' ? (selectedNote?.title   ?? '') : noteTitle
  const displaySubject = modalMode === 'view' ? (selectedNote?.subject ?? 'All Subject') : noteSubject
  const displayContent = modalMode === 'view' ? (selectedNote?.content ?? '') : noteContent
  const isReadOnly     = modalMode === 'view'

  // ── Merge local subjects + subjects already used in saved notes ──
  // Ensures a note's subject always appears in the <select> even after page refresh
  const allSubjects = Array.from(
    new Set([
      ...subjects,
      ...notes.map((n) => n.subject).filter((s) => s !== 'All Subject'),
      ...schedules.map((s) => s.subject), // ← pulls class sched subjects automatically
    ])
  )

  // paste this ONCE anywhere above your return()
function SoftDeleteModal({ itemName, onConfirm, onCancel }: { itemName: string; onConfirm: () => void; onCancel: () => void }) {
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
        <p className='text-xs text-gray-400 mb-6'>
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

// inside your page component:
async function handleConfirmDelete() {
  if (!pendingDelete) return
  await deleteNote(pendingDelete.id)  // ← change to your delete function
  setPendingDelete(null)
}

  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-8'>
        <div className='min-h-screen flex flex-col'>

          {/* ── Header ── */}
          <div className='flex flex-col lg:flex-row lg:items-center w-full gap-3 mb-6'>
            <p className='text-3xl lg:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
              Notes
            </p>

            <div className='flex items-center gap-2 lg:gap-4 lg:ml-auto'>
              {/* + Subject Button */}
              <button
                onClick={() => setIsSubjectModalOpen(true)}
                className='flex-shrink-0 flex items-center justify-center text-2xl h-8 w-8 leading-none bg-primary-600 text-white font-bold border rounded-full'
              >
                +
              </button>

              {/* Subject Dropdown */}
              <div className='relative' ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className='flex justify-between items-center border-primary-600 w-36 lg:w-52 border-2 shadow-md text-primary-600 px-3 lg:px-5 py-2 rounded-md text-sm lg:text-md font-bold'
                >
                  <span className='truncate'>{selectedSubject}</span>
                  <span className='ml-1'>▼</span>
                </button>

                {isDropdownOpen && (
                  <div className='absolute top-full left-0 mt-2 w-36 lg:w-52 bg-white border rounded-md shadow-md z-50'>
                    <button
                      className={`block w-full text-left px-3 py-2 hover:bg-gray-100 text-xs lg:text-sm font-semibold
                        ${selectedSubject === 'All Subject' ? 'bg-primary-50 text-primary-600' : 'text-primary-600'}`}
                      onClick={() => { setSelectedSubject('All Subject'); setIsDropdownOpen(false) }}
                    >
                      All Subject
                    </button>
                      {allSubjects.map((subject, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100
                            ${selectedSubject === subject ? 'bg-primary-50' : ''}`}
                        >
                          <button
                            className={`flex-1 text-left text-xs lg:text-sm truncate font-semibold text-primary-600`}
                            onClick={() => { setSelectedSubject(subject); setIsDropdownOpen(false) }}
                          >
                            {subject}
                          </button>

                          {/* Only show ✕ for manually added subjects, not class sched ones */}
                          {subjects.includes(subject) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteSubjectConfirm(subject) }}
                              className='ml-2 text-primary-600 hover:text-red-500 font-bold text-xs flex-shrink-0'
                              aria-label={`Delete ${subject}`}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Search Bar */}
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Search...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-32 lg:w-72 border-2 border-primary-600 rounded-full px-4 py-2 text-primary-600 focus:outline-none'
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 font-bold'
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <hr className='w-full border-t border-primary-600 mb-6' />

          {/* ── Notes Area ── */}
          {loading ? (
            <div className='flex-1 flex items-center justify-center text-primary-400 text-xl'>
              Loading notes...
            </div>
          ) : (
              <div className='grid grid-cols-2 lg:flex lg:flex-row lg:flex-wrap lg:justify-start lg:items-start gap-4 lg:p-5'>
              {/* Mobile new note button */}
                <button
                  onClick={openNoteModal}
                  className='col-span-2 lg:hidden hover:bg-green-200 hover:text-green-500 border mx-14 md:mx-72 md:items-ce  py-2 rounded-md bg-green-500 font-bold font-roboto text-md text-white'
                >
                + New Note
              </button>

              {/* Desktop new note button */}
              <button
                onClick={openNoteModal}
                className='hidden lg:flex items-center justify-center border px-12 py-16 rounded-xl bg-green-500 font-bold font-roboto text-7xl text-white'
              >
                +
              </button>

              {/* ── Note Cards ── */}
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => openViewModal(note)}
                  className='relative bg-primary-700 border-2 border-primary-600 rounded-xl p-5 w-full lg:w-64 flex flex-col shadow-sm cursor-pointer hover:shadow-md transition-shadow'
                >
                  {/* ── Top: Title + 3-dot menu ── */}
                  <div className='flex justify-between items-center'>
                    <p className='font-bold text-primary-600 text-sm lg:text-md truncate flex-1'>{note.title}</p>

                    {/* 3-dot menu wrapper */}
                    <div
                      className='relative ml-2'
                      data-note-menu
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                      title='More Options'
                        onClick={() => setOpenMenuId(openMenuId === note.id ? null : note.id)}
                        className='text-primary-600 hover:text-primary-600 font-bold text-xl px-1 leading-none select-none'
                        aria-label='Note options'
                      >
                        ⋮
                      </button>

                      {openMenuId === note.id && (
                        <div className='absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-36 py-1'>
                          <button
                            onClick={() => { openEditModal(note); setOpenMenuId(null) }}
                            className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                          >
                            <img className='w-5 h-5' src="edit.png" alt="edit icon" />Edit
                          </button>
                          <hr className='my-1 border-gray-100' />
                          <button
                            onClick={() => { setConfirmDownload(note); setOpenMenuId(null) }}
                            className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
                          >
                            <img className='w-5 h-5' src="download.png" alt="download icon" />Download
                          </button>
                          <hr className='my-1 border-gray-100' />
                          <button
                            onClick={() => setPendingDelete({ id: note.id, name: note.title })}
                            className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-red-50 font-semibold'
                          >
                                  {pendingDelete && (
<SoftDeleteModal
    itemName={pendingDelete.name}
    onConfirm={handleConfirmDelete}
    onCancel={() => setPendingDelete(null)}
  />
)}
                            <img src="delete.png" alt="delete icon" className='w-5 h-5' />Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Divider line under title ── */}
                  <hr className='border-t border-primary-600 my-2' />

                  {/* ── Bottom: content preview ── */}
                  <p className='text-sm text-gray-600 line-clamp-3 flex-1'>{note.content}</p>

                  {/* ── Footer: subject + date ── */}
                  <div className='flex justify-between items-center mt-3'>
                    <p className='text-xs text-primary-400 font-semibold truncate'>{note.subject}</p>
                    <p className='text-xs text-gray-400 shrink-0 ml-2'>
                      {new Date(note.createdAt).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              </div>
          )}
          {/* ── Download Confirmation Modal ── */}
          {confirmDownload && (
            <div
              className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'
              onClick={() => setConfirmDownload(null)}
            >
              <div
                className='bg-white rounded-2xl p-8 w-full max-w-sm mx-6 flex flex-col items-center gap-4'
                onClick={(e) => e.stopPropagation()}
              >
                <p className='text-xl font-bold text-primary-600 uppercase text-center'>
                  are you sure you want to download?
                </p>
                <p className='text-sm text-gray-500 text-justify'>
                  <span className='font-semibold text-primary-600'>"{confirmDownload.title}"</span> will be downloaded as .txt file.
                </p>
                <div className='flex gap-4 w-full mt-2'>
                  <button
                    onClick={() => setConfirmDownload(null)}
                    className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50'
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => { downloadNote(confirmDownload); setConfirmDownload(null) }}
                    className='flex-1 bg-primary-600 text-white font-bold py-2 rounded-md hover:bg-primary-700'
                  >
                    CONTINUE
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Add Subject Modal ── */}
          {isSubjectModalOpen && (
            <div
              className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'
              onClick={() => setIsSubjectModalOpen(false)}
            >
              <div
                className='bg-white rounded-2xl p-10 w-full max-w-md mx-6'
                onClick={(e) => e.stopPropagation()}
              >
                <p className='text-2xl font-bold uppercase text-primary-600 text-center mb-6'>
                  Add A Subject Name
                </p>
                <input
                  className='w-full border-2 border-primary-600 rounded-md px-3 py-3 mb-4'
                  type='text'
                  placeholder='ex. Araling Panlipunan'
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubjectSave()}
                  autoFocus
                />
                <div className='flex gap-4 mt-4'>
                  <button
                    onClick={() => setIsSubjectModalOpen(false)}
                    className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50'
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSubjectSave}
                    disabled={subjectName.trim() === ''}
                    className='flex-1 bg-primary-600 text-white font-bold py-2 rounded-md hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed'
                  >
                    SAVE
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Delete Subject Confirmation Modal ── */}
          {deleteSubjectConfirm && (
            <div
              className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'
              onClick={() => setDeleteSubjectConfirm(null)}
            >
              <div
                className='bg-white rounded-2xl p-8 w-full max-w-sm mx-6 flex flex-col items-center gap-4'
                onClick={(e) => e.stopPropagation()}
              >
                <p className='text-xl font-bold text-primary-600 uppercase text-center'>
                  Remove Subject?
                </p>
                  <p className='text-sm text-gray-500 text-center'>
                    <span className='font-semibold text-primary-600'>"{deleteSubjectConfirm}"</span> will be removed. Notes tagged with this subject will be moved to <span className='font-semibold'>All Subject</span>.
                  </p>
                <div className='flex gap-4 w-full mt-2'>
                  <button
                    onClick={() => setDeleteSubjectConfirm(null)}
                    className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50'
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => handleSubjectDelete(deleteSubjectConfirm)}
                    className='flex-1 bg-red-500 text-white font-bold py-2 rounded-md hover:bg-red-600'
                  >
                    REMOVE
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ── Note Modal (create / view / edit) ── */}
          {isNoteModalOpen && (
            <div
              className='fixed inset-0 bg-black bg-opacity-50 flex justify-end lg:justify-center items-end lg:items-center z-50'
              onClick={handleCloseAttempt}

            >
              <div
              className='bg-white w-full h-screen lg:rounded-2xl lg:h-[85vh] lg:max-w-4xl lg:mx-6 flex flex-col overflow-y-auto'

                onClick={(e) => e.stopPropagation()}
              >

                {/* ── MOBILE layout ── */}
                <div className='lg:hidden flex flex-col flex-1 p-6 '>

                {isReadOnly ? (
                  <p className='w-32 ml-auto text-1xl text-right  text-primary-600  '>{displaySubject}</p>
                ) : (
                  <select
                    aria-label='Select subject'
                    value={displaySubject}
                    onChange={(e) => setNoteSubject(e.target.value)}
                    className='w-64 ml-auto border-2 border-primary-600 rounded-md px-3 py-2 mb-4 text-primary-600 font-semibold'
                  >
                    <option value='All Subject'>All Subject</option>
                    {allSubjects.map((subject, index) => (
                      <option key={index} value={subject}>{subject}</option>
                    ))}
                  </select>
                )}

                  <input
                    className='w-full text-primary-600 text-2xl font-bold placeholder:text-gray-300 border-b-2 border-primary-200 px-1 py-2 mb-2 focus:outline-none read-only:cursor-default'
                    type='text'
                    placeholder='UNTITLED'
                    value={displayTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    readOnly={isReadOnly}
                    autoFocus={!isReadOnly}
                  />

                  <p className='text-sm text-gray-400 mb-4'>{modalTime.date} — {modalTime.time}</p>

                  <textarea
                    className='w-full flex-1 min-h-[300px] px-3 py-2 mb-4 pb-16 resize-none read-only:cursor-default'
                    placeholder='Write your notes here...'
                    value={displayContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    readOnly={isReadOnly}
                  />

                  <div className='flex gap-4 mt-auto'>
                  {modalMode === 'view' && (
                    <>
                      <button
                        onClick={handleCloseAttempt}
                          className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50'
                      >
                        CLOSE
                      </button>

                      <button
                        onClick={() => { if (selectedNote) openEditModal(selectedNote)} }
                          className='flex-1 bg-primary-600 text-white font-bold py-2 rounded-md hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed'
                      >
                        EDIT
                      </button>
                      </>
                  )}
                    {modalMode === 'edit' && (
                      <>
                        <button
                          onClick={handleCloseAttempt}
                          className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50'
                        >
                          CANCEL
                        </button>
                        <button
                          onClick={handleNoteUpdate}
                          disabled={noteTitle.trim() === ''}
                          className='flex-1 border-2 border-primary-600 bg-primary-600 text-white font-bold py-2 rounded-md hover:bg-primary-50'
                        >
                          SAVE
                        </button>
                      </>
                    )}
                    {modalMode === 'create' && (
                      <>
                        <button
                          onClick={handleCloseAttempt}
                          className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50'
                        >
                          CANCEL
                        </button>
                        <button
                          onClick={handleNoteSave}
                          disabled={noteTitle.trim() === '' || noteContent.trim() === ''
                          }
                          className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50'
                        >
                          SAVE
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* ── DESKTOP layout ── */}
                <div className='hidden lg:flex flex-col flex-1 py-10 px-5 relative'>

                  <div className='flex justify-between items-center gap-1 mb-2 '>
                    <input
                      className='min-w-20   py-2 text-primary-600 text-2xl font-bold placeholder:text-primary-600 focus:outline-none read-only:cursor-default'
                      type='text'
                      placeholder='UNTITLED'
                      value={displayTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      readOnly={isReadOnly}
                      autoFocus={!isReadOnly}
                    />
                    {isReadOnly ? (
                    <p className=' text-primary-600 font-bold text-xl px-2 py-2'>{displaySubject}</p>
                  ) : (
                    <select
                      aria-label='Select subject'
                      value={displaySubject}
                      onChange={(e) => setNoteSubject(e.target.value)}
                      className='max-w-52 border-2 mr-2  border-primary-600 rounded-md px-6 py-2 text-primary-600 font-semibold'
                    >
                      <option value='All Subject'>All Subject</option>
                      {allSubjects.map((subject, index) => (
                        <option key={index} value={subject}>{subject}</option>
                      ))}
                    </select>
                  )}
                  </div>

                  <p className='text-sm text-primary-600 mb-2'>{modalTime.date} — {modalTime.time}</p>
                  <hr className='w-full border-t border-primary-600 mb-6' />

                  <textarea
                    className='w-full flex-1 min-h-[400px] rounded-md px-3 py-2 pb-16 mb-4 resize-none read-only:cursor-default'
                    placeholder='Write your notes here...'
                    value={displayContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    readOnly={isReadOnly}
                  />

                  <div className='flex gap-4 mt-auto'>
                  {modalMode === 'view' && (
                    <div className=' bottom-4 right-4 flex gap-2 ml-auto'>
                      <button
                        onClick={closeNoteModal}
                        className='border  border-primary-600 text-primary-600 text-xs font-bold py-2 px-10 rounded-md hover:bg-primary-50'
                      >
                        CLOSE
                      </button>

                      <button
                        onClick={() => { if (selectedNote) openEditModal(selectedNote)} }
                        className='uppercase bg-primary-600 border border-primary-600 text-white text-xs font-bold py-1 px-10 rounded-md hover:bg-primary-700'
                      >
                        EDIT
                      </button>
                    </div>
                  )}
                    {modalMode === 'edit' && (
                      <div className='bottom-4 right-4 flex gap-2 ml-auto'>
                        <button
                          onClick={handleCloseAttempt}
                        className='border  border-primary-600 text-primary-600 text-xs font-bold py-2 px-10 rounded-md hover:bg-primary-50'
                        >
                          CANCEL
                        </button>
                        <button
                          onClick={handleNoteUpdate}
                          disabled={noteTitle.trim() === ''}
                        className='uppercase bg-primary-600 border border-primary-600 text-white text-xs font-bold py-1 px-10 rounded-md hover:bg-primary-700'
                        >
                          save
                        </button>
                      </div>
                    )}
                    {modalMode === 'create' && (
                      <div className='bottom-4 right-4 flex gap-2 ml-auto'>
                        <button
                          onClick={closeNoteModal}
                        className='border  border-primary-600 text-primary-600 text-xs font-bold py-2 px-10 rounded-md hover:bg-primary-50'
                        >
                          CANCEL
                        </button>
                        <button
                          onClick={handleNoteSave}
                          disabled={noteTitle.trim() === ''}
                        className='uppercase bg-primary-600 border border-primary-600 text-white text-xs font-bold py-1 px-10 rounded-md hover:bg-primary-700'
                        >
                          SAVE
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
        
      </main>

      
      {/* ── Discard Changes Confirmation Modal ── */}
{showDiscardConfirm && (
  <div
    className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60]'
    onClick={() => setShowDiscardConfirm(false)}
  >
    <div
      className='bg-white rounded-2xl p-8 w-full max-w-sm mx-6 flex flex-col items-center gap-4'
      onClick={(e) => e.stopPropagation()}
    >
      <p className='text-xl font-bold text-primary-600 uppercase text-center'>
        Discard Changes?
      </p>
      <p className='text-sm text-gray-500 text-center'>
        You have unsaved changes. Are you sure you want to discard them?
      </p>
      <div className='flex gap-4 w-full mt-2'>
        <button
          onClick={() => setShowDiscardConfirm(false)}
          className='flex-1 border-2 border-primary-600 text-primary-600 font-bold py-2 rounded-md hover:bg-primary-50'
        >
          KEEP EDITING
        </button>
        <button
          onClick={() => { setShowDiscardConfirm(false); closeNoteModal() }}
          className='flex-1 bg-red-500 text-white font-bold py-2 rounded-md hover:bg-red-600'
        >
          DISCARD
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}

export default Notes