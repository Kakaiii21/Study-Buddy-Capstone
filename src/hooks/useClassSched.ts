// hooks/useClassSched.ts
import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { type User } from 'firebase/auth'

export interface Schedule {
  id: string
  day: string
  subject: string
  timeStart: string
  timeEnd: string
  room: string
  roomType: string
  instructor: string
  uid: string
  createdAt: number
}

export function useClassSched(user: User | null) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setSchedules([])
        setLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    const schedRef = collection(db, 'users', user.uid, 'schedules')
    const q = query(schedRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Schedule[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Schedule, 'id'>),
      }))
      setSchedules(fetched)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  async function addSchedule(
    day: string,
    subject: string,
    timeStart: string,
    timeEnd: string,
    room: string,
    roomType: string,
    instructor: string
  ) {
    if (!user) return
    await addDoc(collection(db, 'users', user.uid, 'schedules'), {
      day,
      subject: subject.trim(),
      timeStart,
      timeEnd,
      room: room.trim(),
      roomType,
      instructor: instructor.trim(),
      uid: user.uid,
      createdAt: Date.now(),
    })
  }

  async function updateSchedule(
    scheduleId: string,
    fields: Partial<Pick<Schedule, 'day' | 'subject' | 'timeStart' | 'timeEnd' | 'room' | 'roomType' | 'instructor'>>
  ) {
    if (!user) return
    const schedRef = doc(db, 'users', user.uid, 'schedules', scheduleId)
    await updateDoc(schedRef, fields)
  }

  async function deleteSchedule(scheduleId: string) {
    if (!user) return
    const schedRef = doc(db, 'users', user.uid, 'schedules', scheduleId)
    await deleteDoc(schedRef)
  }

  return { schedules, loading, addSchedule, updateSchedule, deleteSchedule }
}