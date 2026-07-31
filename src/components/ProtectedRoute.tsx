import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { onAuthChange } from '../services/authService'
import EmailChangeWatcher from './EmailChangeWatcher'

type Props = {
  children: React.ReactNode
}

function ProtectedRoute({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<'active' | 'deactivated' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user)
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid))
          setStatus(snap.data()?.status ?? 'active')
        } catch {
          setStatus('active') // fail open, don't lock the user out on a read error
        }
      } else {
        setStatus(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (status === 'deactivated') {
    return <Navigate to="/reactivate" replace />
  }

  return (
    <>
      <EmailChangeWatcher />
      {children}
    </>
  )
}

export default ProtectedRoute