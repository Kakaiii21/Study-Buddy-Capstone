import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { onAuthChange } from '../services/authService'
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

  // wait for Firebase to check session
  if (loading) {
    return <div className="text-center mt-10">Loading...</div>
  }

  // not logged in → redirect
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // logged in → allow access
  return children
}

export default ProtectedRoute