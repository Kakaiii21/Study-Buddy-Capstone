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

export interface Course {
  id: string
  name: string
  uid: string
  createdAt: number
}

export function useCourses(user: User | null) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setCourses([])
        setLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    const coursesRef = collection(db, 'users', user.uid, 'courses')
    const q = query(coursesRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Course[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Course, 'id'>),
      }))
      setCourses(fetched)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  async function addCourse(name: string) {
    if (!user || !name.trim()) return
    await addDoc(collection(db, 'users', user.uid, 'courses'), {
      name: name.trim(),
      uid: user.uid,
      createdAt: Date.now(),
    })
  }

  async function updateCourse(courseId: string, name: string) {
    if (!user || !name.trim()) return
    const courseRef = doc(db, 'users', user.uid, 'courses', courseId)
    await updateDoc(courseRef, { name: name.trim() })
  }

  async function deleteCourse(courseId: string) {
    if (!user) return
    const courseRef = doc(db, 'users', user.uid, 'courses', courseId)
    await deleteDoc(courseRef)
  }

  return { courses, loading, addCourse, updateCourse, deleteCourse }
}