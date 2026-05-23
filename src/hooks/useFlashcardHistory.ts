import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { User } from 'firebase/auth'

export interface FlashcardHistoryItem {
  id: string
  fileName: string
  total: number
  dateSaved: Date
  items: { term: string; definition: string }[]
}

interface FlashcardHistoryState {
  flashcardHistory: FlashcardHistoryItem[]
  loading: boolean
}

export function useFlashcardHistory(user: User | null) {
  const [state, setState] = useState<FlashcardHistoryState>({
    flashcardHistory: [],
    loading: user !== null, // ✅ true only if there's a user to fetch for
  })

  useEffect(() => {
    if (!user) return // ✅ No synchronous setState here

    const q = query(
      collection(db, 'users', user.uid, 'flashcardHistory'),
      orderBy('dateSaved', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // ✅ setState inside an async callback — allowed by React
      const flashcardHistory = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        dateSaved: d.data().dateSaved?.toDate?.() ?? new Date(),
      })) as FlashcardHistoryItem[]

      setState({ flashcardHistory, loading: false })
    })

    return unsubscribe
  }, [user])

  const deleteFlashcard = async (id: string) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'flashcardHistory', id))
  }

  return { ...state, deleteFlashcard }
}