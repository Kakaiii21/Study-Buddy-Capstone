import { useState, useRef, useEffect } from 'react'
import {
  DndContext,
  useDroppable,
  useDraggable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { useTasks, type Task, type Status } from '../hooks/useTasks'

const COLUMNS: { id: Status; label: string }[] = [
  { id: 'todo',        label: 'TO DO' },
  { id: 'in-progress', label: 'IN PROGRESS' },
  { id: 'done',        label: 'DONE' },
]

// ── Date helpers ──────────────────────────────

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getCardStyle(task: Task, today: string): string {
  if (task.status === 'done') return 'bg-green-600 lg:max-h-32 lg:max-w-62'
  if (task.deadline && task.deadline < today) return 'bg-red-600 lg:max-h-32 lg:max-w-62'
  return 'bg-primary-700 lg:max-h-32 lg:max-w-62'
}

function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function toStorageFormat(display: string): string {
  const parts = display.split('/')
  if (parts.length !== 3 || parts[2].length !== 4) return ''
  const [mm, dd, yyyy] = parts
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function toDisplayFormat(storage: string): string {
  const parts = storage.split('-')
  if (parts.length !== 3) return storage
  const [yyyy, mm, dd] = parts
  return `${mm}/${dd}/${yyyy}`
}

function isValidDate(display: string): boolean {
  if (display.length !== 10) return false
  const parts = display.split('/')
  if (parts.length !== 3) return false
  const mm = parseInt(parts[0])
  const dd = parseInt(parts[1])
  const yyyy = parseInt(parts[2])
  if (isNaN(mm) || isNaN(dd) || isNaN(yyyy)) return false
  if (yyyy < 2000 || yyyy > 2100) return false
  if (mm < 1 || mm > 12) return false
  if (dd < 1 || dd > 31) return false
  const date = new Date(yyyy, mm - 1, dd)
  if (
    date.getFullYear() !== yyyy ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ) return false
  return true
}

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// ── Soft Delete Confirm Modal ─────────────────

function SoftDeleteModal({
  taskName,
  onConfirm,
  onCancel,
}: {
  taskName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4'>
        <div className='flex items-center gap-3 mb-3'>
          <img src="/delete.png" alt="delteicon" className='w-7 h-7' />
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
          <button
            onClick={onCancel}
            className='px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors'
          >
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  )
}

// ── TaskCard ──────────────────────────────────

function TaskCard({
  task,
  onDelete,
  onEdit,
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

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  })

  const today = getToday()
  const isOverdue = task.deadline && task.deadline < today && task.status !== 'done'
  const isDone = task.status === 'done'

  const style: React.CSSProperties = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 50,
        transition: 'none',
      }
    : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        rounded-xl p-4 mb-3
        hover:shadow-md
        w-full select-none relative
        ${getCardStyle(task, today)}
      `}
    >
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        <div className='flex justify-end text-primary-600 font-normal font-roboto text-sm'>
          <p>{new Date(task.createdAt).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
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

// ── Column ────────────────────────────────────

function Column({
  id, label, tasks, onDelete, onEdit,
}: {
  id: Status
  label: string
  tasks: Task[]
  onDelete: (id: string, name: string) => void
  onEdit: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      ref={setNodeRef}
      className={`
        w-full lg:flex-1
        flex flex-col items-center p-4 sm:p-6 lg:p-10
        transition-colors duration-200
        ${collapsed ? 'min-h-0' : 'min-h-[300px]'}
        ${isOver ? 'bg-primary-50' : ''}
      `}
    >
      <div className="bg-primary-600 max-w-full w-full p-3 flex items-center justify-between">
        <p className="text-white pl-5 lg:pl-0 text-xl lg:text-center text-start font-semibold flex-1">{label}</p>
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="lg:hidden text-white ml-2 text-xl font-bold"
          aria-label={collapsed ? 'Expand column' : 'Collapse column'}
        >
          {collapsed ? <img className='w-5 h-5' src="arrowDown.png" alt="" /> : <img className='h-5 w-5' src='arrowUp.png' alt='' />}
        </button>
      </div>

      <div className={`flex flex-col items-center w-full mt-4 ${collapsed ? 'hidden lg:flex' : 'flex'}`}>
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
  )
}

// ── Task Modal (shared for Add & Edit) ────────

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
  onSave: (name: string, deadline: string) => void
  onClose: () => void
}) {
  const today = getToday()
  const calendarRef = useRef<HTMLInputElement>(null)

  const [taskName, setTaskName] = useState(initialName)
  const [taskDeadline, setTaskDeadline] = useState(
    initialDeadline ? toDisplayFormat(initialDeadline) : ''
  )
  const [dateError, setDateError] = useState('')

  function handleDeadlineChange(value: string) {
    const formatted = formatDateInput(value)
    setTaskDeadline(formatted)
    setDateError('')
    if (formatted.length === 10) {
      if (!isValidDate(formatted)) {
        setDateError('Invalid date please check month, day and year')
        return
      }
      const storage = toStorageFormat(formatted)
      if (storage <= today) {
        setDateError('Deadline cannot be in the past')
      }
    }
  }

  function handleCalendarChange(value: string) {
    if (!value) return
    setTaskDeadline(toDisplayFormat(value))
    setDateError(value <= today ? 'Deadline cannot be in the past' : '')
  }

  const deadlineIsValid = isValidDate(taskDeadline) && toStorageFormat(taskDeadline) > today
  const canSave = taskName.trim() !== '' && deadlineIsValid && !dateError

  function handleSave() {
    if (!canSave) return
    onSave(taskName.trim(), toStorageFormat(taskDeadline))
  }

  const calendarValue = isValidDate(taskDeadline) ? toStorageFormat(taskDeadline) : ''

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-12 mx-6 w-full max-w-md"
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
            {['Prepare report', 'Review', 'Study', 'Plan', 'Research', 'Advance Study', 'Read'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setTaskName(suggestion)}
                className="text-sm px-3 py-1 rounded-full border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <label className="flex text-primary-600 text-xl font-semibold pt-3 gap-1">
          Deadline
          {requireDeadline && <span className="text-red-500"></span>}
        </label>

        <div className="relative flex items-center my-3">
          <input
            className={`border-2 rounded-md w-full py-3 px-3 pr-11 font-mono
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
            ref={calendarRef}
            type="date"
            min={getTomorrow()}
            value={calendarValue}
            onChange={(e) => handleCalendarChange(e.target.value)}
            className="absolute right-0 bottom-0 opacity-0 w-0 h-0 pointer-events-none"
            tabIndex={-1}
            placeholder='mm/dd/yyyy'
          />
        </div>

        {dateError && (
          <p className="text-red-500 text-sm -mt-2 mb-2">{dateError}</p>
        )}

        <div className="flex flex-row justify-between gap-10">
          <button
            onClick={onClose}
            className="flex-1 bg-white border-2 rounded-md font-bold border-primary-600 items-center mt-5 text-primary-600 font-roboto py-2 hover:bg-primary-50"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 bg-primary-600 border-2 rounded-md font-bold border-primary-600 items-center mt-5 text-white font-roboto hover:bg-primary-50 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            SAVE
          </button>
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

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  )

  async function handleAddSave(name: string, deadline: string) {
    await addTask(name, deadline)
    setIsAddModalOpen(false)
  }

  async function handleEditSave(name: string, deadline: string) {
    if (!editingTask) return
    await updateTask(editingTask.id, { name, deadline })
    setEditingTask(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const taskId = active.id as string
    const newStatus = over.id as Status
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return
    updateTaskStatus(taskId, newStatus)
  }

  // Show the soft delete confirmation modal
  function handleDeleteClick(id: string, name: string) {
    setPendingDelete({ id, name })
  }

  // User confirmed — actually soft delete
  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await deleteTask(pendingDelete.id)
    setPendingDelete(null)
  }

  return (
    <div className="flex h-screen">
      <Sidebar />

      {/* Soft Delete Confirmation */}
      {pendingDelete && (
        <SoftDeleteModal
          taskName={pendingDelete.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <main className="flex-1 overflow-auto p-8">
        <div className="min-h-screen flex flex-col">

          <div className="w-full flex flex-col lg:flex-row justify-center lg:justify-between lg:items-start sm:items-center gap-4 p-2">
            <p className="text-3xl lg:text-4xl lg:pt-2 text-center font-bold sm:flex text-primary-600 font-roboto">TO DO LIST</p>
            <hr className='lg:hidden w-full border-t border-primary-600' />
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-green-500 text-white font-roboto font-bold mx-10 text-md py-3 px-9 rounded-md"
            >
              + New Task
            </button>
          </div>

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
            <div className="flex-1 flex items-center justify-center text-primary-400 text-xl mt-10">
              Loading your tasks...
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragEnd={handleDragEnd}
              autoScroll={{
                enabled: true,
                threshold: { x: 0, y: 0.2 },
              }}
            >
              <div className="w-full flex flex-col lg:flex-row h-auto lg:min-h-screen mt-6 lg:mt-10 border-primary-600 border-2 rounded-3xl">
                {COLUMNS.map((col) => (
                  <Column
                    key={col.id}
                    id={col.id}
                    label={col.label}
                    tasks={tasks.filter((t) => t.status === col.id)}
                    onDelete={handleDeleteClick}
                    onEdit={setEditingTask}
                  />
                ))}
              </div>
            </DndContext>
          )}

        </div>
      </main>
    </div>
  )
}

export default ToDoList