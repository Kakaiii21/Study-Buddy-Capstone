import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { type User } from 'firebase/auth'
import { softDelete } from '../services/recentlyDeletedService'

export type Status = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  name: string
  deadline: string
  status: Status
  uid: string
  createdAt: number
}

export function useTasks(user: User | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setTasks([])
        setLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    const tasksRef = collection(db, 'users', user.uid, 'tasks')
    const q = query(tasksRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Task[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Task, 'id'>),
      }))
      setTasks(fetched)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

     function addTask(name: string, deadline: string) {
      if (!user || !name.trim()) return
      // don't await — write is queued locally, Firebase syncs when online
      addDoc(collection(db, 'users', user.uid, 'tasks'), {
        name: name.trim(),
        deadline,
        status: 'todo' as Status,
        uid: user.uid,
        createdAt: Date.now(),
      })
    }

     function updateTask(taskId: string, fields: Partial<Pick<Task, 'name' | 'deadline'>>) {
      if (!user) return
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId)
      // don't await — same reason
      updateDoc(taskRef, fields)
    }
    function updateTaskStatus(taskId: string, newStatus: Status) {
      if (!user) return
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId)
      updateDoc(taskRef, { status: newStatus })
    }

  async function deleteTask(taskId: string) {
    if (!user) return
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    await softDelete(user.uid, {
      name: task.name,
      type: 'To Do',
      originalCollection: `users/${user.uid}/tasks`,
      originalDocId: taskId,
      data: { ...task },
    })
  }

  return { tasks, loading, addTask, updateTask, updateTaskStatus, deleteTask }
}