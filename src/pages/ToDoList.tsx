import { useState, useRef, useEffect } from 'react'
import { useTour } from '../hooks/useTour'
import {
  DndContext,
  useDroppable,
  useDraggable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useTasks, type Task, type Status } from '../hooks/useTasks'
import { useTaskNotifications } from '../hooks/useTaskNotification'

const COLUMNS: { id: Status; label: string }[] = [
  { id: 'todo',        label: 'TO DO' },
  { id: 'in-progress', label: 'IN PROGRESS' },
  { id: 'done',        label: 'DONE' },
]

// ── Date/time helpers ─────────────────────────

function getNowISO(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}


/** "YYYY-MM-DDTHH:MM"  →  "MM/DD/YYYY H:MM AM/PM" */
function toDisplayFormat(storage: string): string {
  if (!storage) return ''
  const [datePart, timePart] = storage.split('T')
  const [yyyy, mm, dd] = datePart.split('-')
  if (!timePart) return `${mm}/${dd}/${yyyy}`
  const [hStr, mStr] = timePart.split(':')
  let h = parseInt(hStr)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${mm}/${dd}/${yyyy} ${h}:${mStr} ${ampm}`
}

/** "MM/DD/YYYY" → "YYYY-MM-DD" */
function toStorageDateOnly(display: string): string {
  const parts = display.split('/')
  if (parts.length !== 3 || parts[2].length !== 4) return ''
  const [mm, dd, yyyy] = parts
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function isValidDate(display: string): boolean {
  if (display.length !== 10) return false
  const parts = display.split('/')
  if (parts.length !== 3) return false
  const mm = parseInt(parts[0]), dd = parseInt(parts[1]), yyyy = parseInt(parts[2])
  if (isNaN(mm) || isNaN(dd) || isNaN(yyyy)) return false
  if (yyyy < 2000 || yyyy > 2100) return false
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false
  const date = new Date(yyyy, mm - 1, dd)
  return date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd
}

/** "MM/DD/YYYY" + "HH:MM" → "YYYY-MM-DDTHH:MM" */
function buildStorageValue(dateDisplay: string, time: string): string {
  const datePart = toStorageDateOnly(dateDisplay)
  if (!datePart) return ''
  return time ? `${datePart}T${time}` : datePart
}

function getCardStyle(task: Task, nowISO: string): string {
  if (task.status === 'done') return 'bg-green-600 lg:max-h-32 lg:max-w-62 drop-shadow-[0_6px_2px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)] transition-all duration-300'
  if (task.deadline && task.deadline < nowISO) return 'bg-red-600 lg:max-h-32 lg:max-w-62 drop-shadow-[0_6px_2px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)] transition-all duration-300'

  if (task.deadline) {
    const msUntil = new Date(task.deadline).getTime() - Date.now()
    if (msUntil > 0 && msUntil <= 60 * 60 * 1000) {
      return 'bg-amber-300 lg:max-h-32 lg:max-w-62 drop-shadow-[0_6px_2px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)] transition-all duration-300'
    }
  }

  return 'bg-primary-700 lg:max-h-32 lg:max-w-62 drop-shadow-[0_6px_2px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)] transition-all duration-300'
}

// ── Task Modal ────────────────────────────────

function TaskModal({
  title,
  initialName,
  initialDeadline,
  requireDeadline = false,
  onSave,
  onClose,
}: {
  title: string
  initialName: string
  initialDeadline: string
  requireDeadline?: boolean
  saving?: boolean
  onSave: (name: string, deadline: string) => void
  onClose: () => void
}) {
  const nowISO = getNowISO()
  const todayDate = nowISO.split('T')[0]
  const calendarRef = useRef<HTMLInputElement>(null)

  const [initialDateDisplay, initialTime] = (() => {
    if (!initialDeadline) return ['', '09:00']
    const [datePart, timePart] = initialDeadline.split('T')
    const [yyyy, mm, dd] = datePart.split('-')
    return [`${mm}/${dd}/${yyyy}`, timePart ?? '09:00']
  })()

  const [taskName, setTaskName] = useState(initialName)
  const [taskDeadline, setTaskDeadline] = useState(initialDateDisplay)
  const [taskTime, setTaskTime] = useState(initialTime)
  const [dateError, setDateError] = useState('')

  function handleDeadlineChange(value: string) {
    const formatted = formatDateInput(value)
    setTaskDeadline(formatted)
    setDateError('')
    if (formatted.length === 10) {
      if (!isValidDate(formatted)) {
        setDateError('Invalid date — please check month, day and year')
        return
      }
      const storage = buildStorageValue(formatted, taskTime)
      if (storage <= nowISO) setDateError('Deadline must be in the future')
    }
  }

  function handleTimeChange(value: string) {
    setTaskTime(value)
    setDateError('')
    if (taskDeadline.length === 10 && isValidDate(taskDeadline)) {
      const storage = buildStorageValue(taskDeadline, value)
      if (storage <= nowISO) setDateError('Deadline must be in the future')
    }
  }

  function handleCalendarChange(value: string) {
    if (!value) return
    const [yyyy, mm, dd] = value.split('-')
    setTaskDeadline(`${mm}/${dd}/${yyyy}`)
    const storage = buildStorageValue(`${mm}/${dd}/${yyyy}`, taskTime)
    setDateError(storage <= nowISO ? 'Deadline must be in the future' : '')
  }

  const deadlineStorageValue = buildStorageValue(taskDeadline, taskTime)
  const deadlineIsValid =
    isValidDate(taskDeadline) &&
    taskTime.length === 5 &&
    deadlineStorageValue > nowISO

  const canSave = taskName.trim() !== '' && deadlineIsValid && !dateError

  function handleSave() {
    if (!canSave) return
    onSave(taskName.trim(), deadlineStorageValue)
  }

  const calendarValue = isValidDate(taskDeadline) ? toStorageDateOnly(taskDeadline) : ''


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
    >
      <div
        className="bg-white rounded-2xl p-7 mx-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center font-bold text-primary-600 text-3xl p-4 pt-1">{title}</p>

        <label className="flex font-semibold text-primary-600 text-xl py-2">Task</label>
        <input
          className="flex border-2 rounded-md border-primary-600 min-w-full my-2 py-3 px-3"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          type="text"
          placeholder="Enter Task Name"
          autoFocus
          maxLength={40}
        />

        <div className="flex flex-col gap-1">
          <label className="flex text-primary-600 font-semibold text-xl py-3">Suggested Tasks:</label>
          <div className="flex flex-wrap gap-2">
            {['Prepare report', 'Review', 'Study', 'Plan', 'Research', 'Advance Study', 'Read'].map((s) => (
              <button
                key={s}
                onClick={() => setTaskName(s)}
                className="text-sm px-3 py-1 rounded-full border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <label className="flex text-primary-600 text-xl font-semibold pt-3 gap-1">
          Deadline
          {requireDeadline && <span className="text-red-500">*</span>}
        </label>

        <div className="flex gap-3 my-3">
          <div className="relative flex items-center flex-1">
            <input
              className={`border-2 rounded-md w-full py-3 text-sm px-3 pr-11 font-mono
                ${dateError ? 'border-red-400 bg-red-50' : 'border-primary-600'}`}
              value={taskDeadline}
              onChange={(e) => handleDeadlineChange(e.target.value)}
              type="text"
              placeholder="MM/DD/YYYY"
              maxLength={10}
            />
            <button
              type="button"
              onClick={() => calendarRef.current?.showPicker()}
              className="absolute right-3 text-primary-600 hover:text-primary-800 transition-colors"
              tabIndex={-1}
              title="Pick a date"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
            <input
              aria-label="cal"
              ref={calendarRef}
              type="date"
              min={todayDate}
              value={calendarValue}
              onChange={(e) => handleCalendarChange(e.target.value)}
              className="absolute right-0 bottom-0 opacity-0 w-0 h-0 pointer-events-none"
              tabIndex={-1}
            />
          </div>

          <input
            aria-label="time"
            type="time"
            value={taskTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            className={`border-2 rounded-md py-3 px-3 w-36 font-mono
              ${dateError ? 'border-red-400 bg-red-50' : 'border-primary-600'}`}
          />
        </div>

        {dateError && <p className="text-red-500 text-sm -mt-2 mb-2">{dateError}</p>}

        <div className="flex flex-row justify-between gap-10">
          <button
            onClick={onClose}
            className="flex-1 bg-white border-2 rounded-md font-bold border-primary-600 items-center mt-5 text-primary-600 font-roboto py-2 hover:bg-primary-50"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave }
            className="flex-1 bg-primary-600 border-2 rounded-md font-bold border-primary-600 items-center mt-5 text-white font-roboto hover:bg-primary-50 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Soft Delete Modal ─────────────────────────
function SoftDeleteModal({ taskName, onConfirm, onCancel }: { 
  taskName: string
  onConfirm: () => void
  onCancel: () => void 
})
 {
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = () => {
    if (confirming) return
    setConfirming(true)
    onConfirm()
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
        <div className='flex items-center gap-3 mb-3'>
          <img src="/delete.png" alt="deleteicon" className='w-7 h-7' />
          <h2 className='text-lg font-bold text-gray-800'>Move to Recently Deleted?</h2>
        </div>
        <p className='text-sm text-gray-500 mb-1'>
          <span className='font-semibold text-gray-700'>"{taskName}"</span> will be moved to{' '}
          <span className='font-semibold text-primary-600'>Recently Deleted</span>.
        </p>
        <p className='text-xs text-gray-400 mb-6'>
          You can restore it anytime within <span className='font-semibold text-red-400'>30 days</span>, after which it will be permanently deleted.
        </p>
        <div className='flex gap-3 justify-end'>
          <button onClick={onCancel} disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40'>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={confirming}
            className='px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60'>
            {confirming ? 'Deleting...' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  )
}
// ── TaskCard ──────────────────────────────────

function TaskCard({
  task, onDelete, onEdit,
}: {
  task: Task
  onDelete: (id: string, name: string) => void
  onEdit: (task: Task) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showMenu) return
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showMenu])

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

  const nowISO = getNowISO()
  const isOverdue = task.deadline && task.deadline < nowISO && task.status !== 'done'
  const isDone = task.status === 'done'

  const style: React.CSSProperties = transform
    ? {
        opacity: 0.4,
        transition: 'none',
      }
    : {}

  return (
    <div
    id='taskCard'
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        rounded-xl p-4 mb-3
        hover:shadow-md
      
        w-full select-none relative
        ${getCardStyle(task, nowISO)}
        ${isDragging ? 'cursor-grabbing' : ''}
        ${showMenu ? 'z-30' : 'z-0'}
      `}
    >
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        <div className='flex justify-end text-primary-600 font-normal font-roboto text-sm'>
          <p>{new Date(task.createdAt).toLocaleDateString('en-US', {
            month: '2-digit', day: '2-digit', year: 'numeric',
          })}</p>
        </div>
        <div className="flex justify-between items-start">
          <p className={`font-semibold font-roboto overflow-hidden text-ellipsis ${isDone ? 'text-green-700 line-through' : isOverdue ? 'text-primary-50' : 'text-primary-600'}`}>
            {task.name}
          </p>
        </div>
        {task.deadline && (
          <p className={`text-sm mt-1 ${isDone ? 'text-primary-600' : isOverdue ? 'text-primary-50 font-semibold' : 'text-primary-600'}`}>
            {isOverdue ? 'Past Deadline: ' : 'Deadline: '}
            {toDisplayFormat(task.deadline)}
          </p>
        )}
      </div>

      <div className="absolute bottom-3 right-3">
        <button
        id='taskOptionsBtn'
          title='More Options'
          onClick={() => setShowMenu((prev) => !prev)}
          className="text-primary-600 hover:text-primary-800 text-lg"
        >
          ⋮
        </button>
        {showMenu && (
          <div ref={menuRef} className='absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-36 py-1'>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => { onEdit(task); setShowMenu(false) }}
              className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-semibold'
            >
              <img className='w-5 h-5' src="edit.png" alt="edit icon" />Edit
            </button>
            <hr className='my-1 border-gray-100' />
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => { onDelete(task.id, task.name); setShowMenu(false) }}
              className='flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-red-50 font-semibold'
            >
              <img src="delete.png" alt="delete icon" className='w-5 h-5' />Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Drag Overlay Card (rendered above everything) ──

function DragCard({ task }: { task: Task }) {
  const nowISO = getNowISO()
  const isOverdue = task.deadline && task.deadline < nowISO && task.status !== 'done'
  const isDone = task.status === 'done'

  return (
    <div className={`rounded-xl p-4 w-full select-none relative shadow-2xl rotate-1 scale-105 ${getCardStyle(task, nowISO)}`}>
      <div className='flex justify-end text-primary-600 font-normal font-roboto text-sm'>
        <p>{new Date(task.createdAt).toLocaleDateString('en-US', {
          month: '2-digit', day: '2-digit', year: 'numeric',
        })}</p>
      </div>
      <p className={`font-semibold font-roboto overflow-hidden text-ellipsis ${isDone ? 'text-green-700 line-through' : isOverdue ? 'text-primary-50' : 'text-primary-600'}`}>
        {task.name}
      </p>
      {task.deadline && (
        <p className={`text-sm mt-1 ${isDone ? 'text-primary-600' : isOverdue ? 'text-primary-50 font-semibold' : 'text-primary-600'}`}>
          {isOverdue ? 'Past Deadline: ' : 'Deadline: '}
          {toDisplayFormat(task.deadline)}
        </p>
      )}
    </div>
  )
}

// ── Column ────────────────────────────────────

function Column({
  id, label, tasks, onDelete, onEdit, collapsed, onToggleCollapse,
}: {
  id: Status
  label: string
  tasks: Task[]
  onDelete: (id: string, name: string) => void
  onEdit: (task: Task) => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`
        w-full lg:flex-1
        md:px-20 
        flex flex-col items-center p-4 sm:p-6 lg:p-10 rounded-3xl
        transition-colors duration-200
        ${collapsed ? 'min-h-0' : 'min-h-[300px]'}
        ${isOver ? 'bg-primary-50' : ''}
      `}
    >
      <div className="bg-primary-600 
      shadow-[0_0px_5px_rgba(0,0,0,.3)]
      max-w-full w-full p-3 flex items-center justify-between">
        <p className="text-white pl-5 lg:pl-0 text-xl lg:text-center text-start font-semibold flex-1">{label}</p>
        <button
          onClick={onToggleCollapse}
          className="lg:hidden text-white ml-2 text-xl font-bold"
          aria-label={collapsed ? 'Expand column' : 'Collapse column'}
        >
          {collapsed
            ? <img className='w-5 h-5' src="arrowDown.png" alt="" />
            : <img className='h-5 w-5' src='arrowUp.png' alt='' />}
        </button>
      </div>

      {/* Smooth collapse using grid-rows trick — no overflow-hidden on outer so dragged cards aren't clipped */}
      <div

        style={{ gridTemplateRows: collapsed ? '0fr' : '1fr' }}
        className="grid transition-all lg:px-0 md:px-24 duration-300 ease-in-out lg:!grid-rows-[1fr] w-full"
      >
        <div className={`min-h-0 flex flex-col items-center w-full mt-4 transition-opacity duration-300
          ${collapsed ? 'opacity-0 lg:opacity-100' : 'opacity-100'}`}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} onEdit={onEdit} />
          ))}
          {tasks.length === 0 && (
            <div className={`w-full border-2 border-dashed rounded-xl p-6 mt-2 text-center
              transition-colors duration-200
              ${isOver ? 'border-primary-400 text-primary-400' : 'border-gray-200 text-gray-300'}`}
            >
              {isOver ? 'Drop here' : 'No tasks yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────

function ToDoList() {
  const { user } = useAuth()
  const { tasks, loading, addTask, updateTask, updateTaskStatus, deleteTask } = useTasks(user)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  useTaskNotifications(tasks)

  const [collapsedCols, setCollapsedCols] = useState<Record<Status, boolean>>({
    'todo': false,
    'in-progress': false,
    'done': false,
  })

  const { startTour } = useTour(
    'todolist',
    false,
    () => {},   // no-op
    () => {},   // no-op
    () => {},   // no-op — don't need to open the sidebar
    () => {},   // no-op — don't need to close the sidebar
    user
)

  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 60 * 1000)
    return () => clearInterval(interval)
  }, [])



  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  )

  function handleToggleCollapse(id: Status) {
    setCollapsedCols((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(event.active.id as string)
  }

  function handleDragOver(event: DragEndEvent) {
    const { over } = event
    if (!over) return
    const overId = over.id as Status
    if (window.innerWidth < 1024 && collapsedCols[overId]) {
      setCollapsedCols((prev) => ({ ...prev, [overId]: false }))
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null)
    const { active, over } = event
    if (!over) return
    const taskId = active.id as string
    const newStatus = over.id as Status
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return
    updateTaskStatus(taskId, newStatus)
  }

  async function handleAddSave(name: string, deadline: string) {
    setIsAddModalOpen(false)  // close immediately
    addTask(name, deadline)   // fire and forget
  }

  async function handleEditSave(name: string, deadline: string) {
    if (!editingTask) return
    setEditingTask(null)      // close immediately
    updateTask(editingTask.id, { name, deadline })  // fire and forget
  }

  function handleDeleteClick(id: string, name: string) {
    setPendingDelete({ id, name })
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await deleteTask(pendingDelete.id)
    setPendingDelete(null)
  }

  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null

  return (
    <div className="flex h-screen">

      <Sidebar />

      {pendingDelete && (
        <SoftDeleteModal
          taskName={pendingDelete.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <main className="flex-1 w-full overflow-auto p-8  pt-7">
        <div className="min-h-screen w-full flex flex-col">

          <div className="w-full flex flex-col lg:flex-row md:flex-row justify-center lg:justify-between lg:items-start md:justify-between md:items-start sm:items-center gap-4 p-2">
            <p className="text-3xl lg:text-4xl lg:pt-2 lg:ml-0 md:ml-10 text-center font-bold sm:flex   text-primary-600 font-roboto">TO DO LIST</p>
            <hr className='lg:hidden md:hidden w-full border-t border-primary-600' />
            <button
            id='newTaskBtn'
              onClick={() => setIsAddModalOpen(true)}
              className="bg-green-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] text-white font-roboto font-bold mx-10
               text-md py-3 px-9 rounded-md
               hover:opacity-90
               backdrop-blur-xs
               hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)]
               transition-all duration-300'"
            >
              + New Task
            </button>
          </div>
          <hr className='hidden md:flex mt-3 w-full border-t border-primary-600' />


          {isAddModalOpen && (
            <TaskModal
              title="ADD A TASK"
              initialName=""
              initialDeadline=""
              requireDeadline
              onSave={handleAddSave}
              onClose={() => setIsAddModalOpen(false)}
            />
          )}

          {editingTask && (
            <TaskModal
              title="EDIT TASK"
              initialName={editingTask.name}
              initialDeadline={editingTask.deadline ?? ''}
              requireDeadline
              onSave={handleEditSave}
              onClose={() => setEditingTask(null)}
            />
          )}

          {loading ? (
            <div className="flex-1 flex items-center  justify-center text-primary-400 text-xl mt-10">
              Loading your tasks...
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              autoScroll={{ enabled: true, threshold: { x: 0, y: 0.2 } }}
            >
              <div 
              id='todoColumns'
              className="w-full  flex flex-col lg:flex-row h-auto lg:min-h-screen mt-6 lg:mt-2  rounded-3xl">
                {COLUMNS.map((col) => (
                  <Column
                    key={col.id}
                    id={col.id}
                    label={col.label}
                    tasks={tasks.filter((t) => t.status === col.id)}
                    onDelete={handleDeleteClick}
                    onEdit={setEditingTask}
                    collapsed={collapsedCols[col.id]}
                    onToggleCollapse={() => handleToggleCollapse(col.id)}
                  />
                ))}
              </div>

              {/* Renders the dragged card in a portal above everything */}
              <DragOverlay dropAnimation={null}>
                {activeTask ? (
                  <DragCard task={activeTask} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
            <button
            id='tour-btn'
              onClick={() => startTour()}
              className='fixed bottom-6 right-6 z-50
                flex flex-col items-center gap-1
                hover:opacity-80 active:scale-95 transition-all
                lg:bottom-8 lg:right-8'
              title='Take a Tour'
            >
              <div className='bg-white  w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl font-bold'>
              <img src="/needhelp.png" alt="?" className='w-12 block mx-auto mt-1' />
              </div>
              <p className='text-xs text-primary-600 lg:text-primary-600 md:text-primary-600 xl:text-primary-600 2xl:text-primary-600 font-inter font-medium '>Need Help?</p>
            </button>
        </div>

      </main>
    </div>
  )
}

export default ToDoList