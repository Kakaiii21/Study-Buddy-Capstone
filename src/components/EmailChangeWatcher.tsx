
import { useEffect, useRef, useState } from 'react'
import { signOut } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { onAuthChange, type User } from '../services/authService'

function EmailChangeWatcher() {
  const [user, setUser] = useState<User | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const originalEmailRef = useRef<string | null>(null)
  const isWatchingRef = useRef(false)

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => setUser(u))
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      isWatchingRef.current = false
      return
    }

    const startWatchingIfPending = async () => {
      if (isWatchingRef.current) return

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const pendingEmail = userDoc.data()?.pendingEmail

      if (!pendingEmail) return

      isWatchingRef.current = true
      originalEmailRef.current = user.email

      pollingRef.current = setInterval(async () => {
        try {
          await auth.currentUser?.reload()
          const refreshedEmail = auth.currentUser?.email

          if (refreshedEmail && refreshedEmail !== originalEmailRef.current) {
            clearInterval(pollingRef.current!)
            isWatchingRef.current = false

            await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
              email: refreshedEmail,
              pendingEmail: null
            })

            await signOut(auth)

            // No useNavigate needed — works outside router context too
            window.location.href = '/login?emailUpdated=true'
          }
        } catch (err) {
          console.error('Email change watcher error:', err)
        }
      }, 3000)
    }

    startWatchingIfPending()

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      isWatchingRef.current = false
    }
  }, [user])

  return null
}

export default EmailChangeWatcher