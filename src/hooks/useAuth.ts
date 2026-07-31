import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { onAuthChange, type User } from '../services/authService'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [status, setStatus] = useState<'active' | 'deactivated' | null>(null)
    const [authLoading, setAuthLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthChange(async (u) => {
            setUser(u)
            if (u) {
                try {
                    const snap = await getDoc(doc(db, 'users', u.uid))
                    setStatus(snap.data()?.status ?? 'active')
                } catch {
                    setStatus('active') // fail open on read error, don't lock the user out unnecessarily
                }
            } else {
                setStatus(null)
            }
            setAuthLoading(false)
        })
        return () => unsubscribe()
    }, [])

    return { user, status, authLoading }
}