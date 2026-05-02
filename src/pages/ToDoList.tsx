import { useState } from 'react'
import {
  DndContext,
  useDroppable,
  useDraggable,
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

function getToday(): string {
  return new Date().toISOString().split('T')[0]  // YYYY-MM-DD for comparisons
}

function getCardStyle(task: Task, today: string): string {
  if (task.status === 'done') return 'bg-green-50 border-green-300'
  if (task.deadline && task.deadline < today) return 'bg-red-50 border-red-300'
  return 'bg-white border-primary-200'
}

// ── Date helpers ──────────────────────────────

// Auto-formats digits into MM/DD/YYYY as the user types
function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)  // only digits, max 8
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

// Converts MM/DD/YYYY → YYYY-MM-DD for Firestore and comparisons
function toStorageFormat(display: string): string {
  const parts = display.split('/')
  if (parts.length !== 3 || parts[2].length !== 4) return ''
  const [mm, dd, yyyy] = parts
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

// Converts YYYY-MM-DD → MM/DD/YYYY for display on task cards
function toDisplayFormat(storage: string): string {
  const parts = storage.split('-')
  if (parts.length !== 3) return storage
  const [yyyy, mm, dd] = parts
  return `${mm}/${dd}/${yyyy}`
}

// Full date validation — checks real calendar values
function isValidDate(display: string): boolean {
  if (display.length !== 10) return false       // must be MM/DD/YYYY = 10 chars

  const parts = display.split('/')
  if (parts.length !== 3) return false

  const mm = parseInt(parts[0])
  const dd = parseInt(parts[1])
  const yyyy = parseInt(parts[2])

  if (isNaN(mm) || isNaN(dd) || isNaN(yyyy)) return false
  if (yyyy < 2000 || yyyy > 2100) return false  // sensible year range
  if (mm < 1 || mm > 12) return false           // valid month
  if (dd < 1 || dd > 31) return false           // basic day check

  // Use JS Date to catch impossible dates like Feb 30, Apr 31, etc.
  const date = new Date(yyyy, mm - 1, dd)
  if (
    date.getFullYear() !== yyyy ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ) return false

  return true
}

// ── TaskCard ──────────────────────────────────
function TaskCard({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) {
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
      {...listeners}
      className={`
        border-2 rounded-xl p-4 mb-3
        cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md
        w-full select-none
        ${getCardStyle(task, today)}
      `}
    >
      <div className="flex justify-between items-start">
        <p className={`font-semibold font-roboto ${isDone ? 'text-green-700 line-through' : isOverdue ? 'text-red-700' : 'text-primary-700'}`}>
          {task.name}
        </p>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(task.id)}
          className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none ml-2"
        >
          ×
        </button>
      </div>

      {task.deadline && (
        <p className={`text-sm mt-1 ${isDone ? 'text-green-500' : isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
          {isOverdue ? '⚠️ Overdue · ' : '📅 '}
          {toDisplayFormat(task.deadline)}
        </p>
      )}

      {isDone && (
        <span className="mt-2 inline-block text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
          ✓ Done
        </span>
      )}
      {isOverdue && (
        <span className="mt-2 inline-block text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
          Past deadline
        </span>
      )}
    </div>
  )
}

// ── Column ────────────────────────────────────
function Column({
  id, label, tasks, onDelete,
}: {
  id: Status
  label: string
  tasks: Task[]
  onDelete: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-h-full flex flex-col items-center p-10 transition-colors duration-200
        ${isOver ? 'bg-primary-50' : ''}`}
    >
      <div className="bg-primary-600 max-w-64 w-full p-3">
        <p className="text-white text-xl text-center font-semibold">{label}</p>
      </div>

      <div className="flex flex-col items-center w-full mt-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onDelete={onDelete} />
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

// ── Main Page ─────────────────────────────────
function ToDoList() {
  const { user } = useAuth()
  const { tasks, loading, addTask, updateTaskStatus, deleteTask } = useTasks(user)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [taskDeadline, setTaskDeadline] = useState('')  // stored as MM/DD/YYYY while typing
  const [dateError, setDateError] = useState('')

  const today = getToday()  // YYYY-MM-DD

  // Auto-formats input and validates as user types
  function handleDeadlineChange(value: string) {
    const formatted = formatDateInput(value)
    setTaskDeadline(formatted)
    setDateError('')  // clear error while typing

    // Only validate once fully typed
    if (formatted.length === 10) {
      if (!isValidDate(formatted)) {
        setDateError('Invalid date — please check month, day and year')
        return
      }
      const storage = toStorageFormat(formatted)
      if (storage < today) {
        setDateError('Deadline cannot be in the past')
      }
    }
  }

  // Checks if the deadline is ready to save
  const deadlineIsValid =
    taskDeadline === '' ||                                    // no deadline = optional
    (isValidDate(taskDeadline) && toStorageFormat(taskDeadline) >= today)

  async function handleSave() {
    if (!taskName.trim()) return
    if (!deadlineIsValid) return

    // Convert MM/DD/YYYY → YYYY-MM-DD before saving to Firestore
    const storageDeadline = taskDeadline ? toStorageFormat(taskDeadline) : ''

    await addTask(taskName, storageDeadline)
    setTaskName('')
    setTaskDeadline('')
    setDateError('')
    setIsModalOpen(false)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setTaskName('')
    setTaskDeadline('')
    setDateError('')
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

  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex-1 overflow-auto p-8 mt-16 lg:mt-0'>
        <div className='min-h-screen flex flex-col'>

          <div className='min-w-screen flex flex-row justify-between items-center p-2'>
            <p className='text-5xl font-bold text-primary-600 font-roboto'>TO DO LIST</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className='bg-green-500 text-white font-roboto font-bold text-md py-3 px-9 rounded-md'
            >
              + New Task
            </button>
          </div>

          {isModalOpen && (
            <div
              className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'
              onClick={handleCloseModal}
            >
              <div
                className='bg-white rounded-2xl p-12 mx-6 w-full max-w-md'
                onClick={(e) => e.stopPropagation()}
              >
                <p className='text-center font-bold text-primary-600 text-3xl p-4 pt-1'>ADD A TASK</p>

                <label className='flex font-semibold text-primary-600 text-xl py-2'>Task</label>
                <input
                  className='flex border-2 rounded-md border-primary-600 min-w-full my-2 py-3 px-3'
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  type="text"
                  placeholder="Enter Task Name"
                  autoFocus
                />

                <div className="flex flex-col gap-1">
                  <label className='flex text-primary-600 font-semibold text-xl py-3'>Suggested Tasks:</label>
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

                <label className='flex text-primary-600 text-xl font-semibold pt-3'>Deadline <span className='text-gray-400 text-sm font-normal ml-2'>(optional)</span></label>

                {/* Text input — full control over format and validation */}
                <input
                  className={`flex border-2 rounded-md min-w-full my-3 p-3 font-mono
                    ${dateError ? 'border-red-400 bg-red-50' : 'border-primary-600'}`}
                  value={taskDeadline}
                  onChange={(e) => handleDeadlineChange(e.target.value)}
                  type="text"
                  placeholder="MM/DD/YYYY"
                  maxLength={10}
                />

                {/* Validation error */}
                {dateError && (
                  <p className="text-red-500 text-sm -mt-2 mb-2">⚠️ {dateError}</p>
                )}

                <div className='flex flex-row justify-between gap-10'>
                  <button
                    onClick={handleCloseModal}
                    className='flex-1 bg-white border-2 rounded-md font-bold border-primary-600 items-center mt-5 text-primary-600 font-roboto py-2 hover:bg-primary-50'
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!taskName.trim() || !deadlineIsValid || !!dateError}
                    className='flex-1 bg-primary-600 border-2 rounded-md font-bold border-primary-600 items-center mt-5 text-white font-roboto hover:bg-primary-50 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed'
                  >
                    SAVE
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-primary-400 text-xl mt-10">
              Loading your tasks...
            </div>
          ) : (
            <DndContext onDragEnd={handleDragEnd}>
              <div className='min-w-screen flex flex-row h-screen justify-start items-start mt-10 border-primary-600 border-2 rounded-3xl'>
                {COLUMNS.map((col) => (
                  <Column
                    key={col.id}
                    id={col.id}
                    label={col.label}
                    tasks={tasks.filter((t) => t.status === col.id)}
                    onDelete={deleteTask}
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