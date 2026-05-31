import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  type User
} from 'firebase/auth'
import { doc, setDoc,  getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
// In services/authService.ts — add these imports and function

import { 
  GoogleAuthProvider, 
  signInWithPopup,
} from 'firebase/auth'



export const googleLogin = async () => {
  const googleProvider = new GoogleAuthProvider()
  googleProvider.setCustomParameters({ prompt: 'select_account' }) // ← forces account picker every time

  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user

  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    const [firstName, ...lastParts] = (user.displayName ?? 'User').split(' ')
    await setDoc(userRef, {
      firstName,
      lastName: lastParts.join(' ') || '',
      email: user.email,
      createdAt: new Date(),
    })
  }

  return user
}


// SIGNUP
export const signup = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  await updateProfile(user, {
    displayName: `${firstName} ${lastName}`
  })

  // Send verification email
  await sendEmailVerification(user)

  try {
    await setDoc(doc(db, 'users', user.uid), {
      firstName,
      lastName,
      email,
      createdAt: new Date()
    })

    // ─── Register email for duplicate checking ────────────────────────────
    await setDoc(doc(db, 'emails', email), { uid: user.uid })
  } catch {
    console.warn('Firestore save failed — possibly blocked by ad blocker.')
  }

  return user
}

// LOGIN
export const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

// LOGOUT
export const logout = async () => {
  await signOut(auth)
}

// GET CURRENT LOGGED IN USER
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}



export type { User }