// src/components/AuthGate.tsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthChange, type User } from '../services/authService'
import SplashScreen from './SplashScreen'

interface AuthGateProps {
  children: React.ReactNode
}

export default function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser)
      setCheckingAuth(false)
    })
    return () => unsubscribe()
  }, [])

  if (checkingAuth) {
    return <SplashScreen />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}