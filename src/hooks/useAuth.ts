import { useEffect, useState } from "react";
import { onAuthChange, type User } from '../services/authService'


export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [authLoading, setAuthLoading] = useState(true)


    useEffect(() => {
        const unsubscribe = onAuthChange((u) => {
            setUser(u)
            setAuthLoading(false)
        })
        return() =>unsubscribe()

    }, [])
    return{ user, authLoading}
}