import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { onAuthChange } from '../services/authService'
import EmailChangeWatcher from './EmailChangeWatcher'  // ← add this

type Props = {
  children: React.ReactNode
}

function ProtectedRoute({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
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

  // ↓ wrap children with the watcher
  return (
    <>
      <EmailChangeWatcher />
      {children}
    </>
  )
}

export default ProtectedRoute