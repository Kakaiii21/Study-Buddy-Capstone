import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { onAuthChange, type User } from '../services/authService'
import SplashScreen from './SplashScreen'

interface AuthGateProps {
  children: React.ReactNode
}

export default function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const location = useLocation()

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

  // Skip the auto-redirect when we were explicitly sent here to show the
  // login form (e.g. right after verifying an email) — otherwise a
  // verified user gets bounced straight to /dashboard before they can
  // log in.
  const forceShowLogin = Boolean(location.state?.showLogin)

  if (user && user.emailVerified && !forceShowLogin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}