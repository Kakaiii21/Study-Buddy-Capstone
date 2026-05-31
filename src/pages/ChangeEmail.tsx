import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  signOut,
} from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../services/firebase'

function ChangeEmail() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [password, setPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [waitingForVerification, setWaitingForVerification] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const originalEmailRef = useRef<string | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Poll auth state — when Firebase detects the email changed, sign out and redirect to login
  useEffect(() => {
    if (!waitingForVerification) return

    pollingRef.current = setInterval(async () => {
      try {
        await auth.currentUser?.reload()
        const refreshedEmail = auth.currentUser?.email

        if (refreshedEmail && refreshedEmail !== originalEmailRef.current) {
          clearInterval(pollingRef.current!)
          await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
            email: refreshedEmail,
            pendingEmail: null
          })
          await signOut(auth)
          navigate('/login', { 
            state: { message: 'Email updated successfully! Please sign in with your new email.' } 
          })
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 3000) // check every 3 seconds

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [waitingForVerification, navigate])

  const handleChangeEmail = async () => {
    if (!user || !user.email) return

    if (!password || !newEmail || !confirmEmail) {
      showToast('Please fill in all fields.', 'error')
      return
    }
    if (newEmail !== confirmEmail) {
      showToast('Emails do not match.', 'error')
      return
    }
    if (newEmail === user.email) {
      showToast('New email must be different from your current email.', 'error')
      return
    }

    setLoading(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)
      await verifyBeforeUpdateEmail(user, newEmail)
      await updateDoc(doc(db, 'users', user.uid), { pendingEmail: newEmail })

      originalEmailRef.current = user.email // snapshot original email for comparison
      setWaitingForVerification(true)       // start polling

      showToast('Verification link sent! Waiting for you to confirm in your new email...', 'success')
      setPassword('')
      setNewEmail('')
      setConfirmEmail('')
    } catch (err) {
      const error = err as { code?: string; message?: string }
      console.error('Change email error:', err)

      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showToast('Incorrect password. Please try again.', 'error')
      } else if (error.code === 'auth/email-already-in-use') {
        showToast('This email is already in use by another account.', 'error')
      } else if (error.code === 'auth/invalid-email') {
        showToast('Invalid email address.', 'error')
      } else if (error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        showToast('Request blocked. Please disable your ad blocker and try again.', 'error')
      } else {
        showToast('Something went wrong. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex h-screen'>
      <Sidebar />

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-roboto text-sm transition-all text-white ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-primary-600'
        }`}>
          {toast.message}
        </div>
      )}

      <main className='flex-1 overflow-auto p-8 mt-1'>
        <div className='min-h-screen flex flex-col'>

          <div className='flex flex-col md:flex-row lg:flex-row md:items-center lg:items-center w-full gap-3 mb-6'>
            <p className='text-3xl md:ml-16 lg:ml-0  md:text-4xl lg:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
              Change Email
            </p>
          </div>
          <hr className='w-full border-t border-primary-600 mb-6' />

          {/* Waiting state UI */}
          {waitingForVerification ? (
            <div className='flex flex-col items-center justify-center mt-20 gap-4 text-center'>
              <div className='w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin' />
              <p className='text-primary-600 font-roboto text-lg font-semibold'>
                Waiting for email verification...
              </p>
              <p className='text-primary-600 font-roboto text-sm opacity-70'>
                Click the link in your new email. You'll be signed out and redirected to login automatically.
              </p>
            </div>
          ) : (
            <div className='flex flex-col w-full h-screen justify-start items-center'>
              <div className='w-full my-8 mt-10'>

                <div className='flex lg:flex-row md:flex-row flex-col gap-3 lg:gap-10 mt-6 lg:justify-start lg:items-center'>
                  <p className='text-primary-600 font-bold font-roboto lg:text-xl text-xl'>Current Password:</p>
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Enter current password'
                    autoComplete="new-password"
                    className='border border-primary-600 rounded-md bg-primary-700 text-primary-600 w-[300px] lg:w-[500px] md:w-[500px] px-5 py-2'
                    />
                </div>
                <hr className='w-full border-t border-primary-700 mb-6 mt-5' />

                <div className='flex lg:flex-row md:flex-row flex-col gap-3 lg:gap-10 mt-6 lg:justify-start lg:items-center'>
                  <p className='text-primary-600 font-bold font-roboto lg:text-xl text-xl'>New Email:</p>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder='Enter new email'
                    className='border border-primary-600 rounded-md bg-primary-700 text-primary-600 w-[300px] lg:w-[500px] md:w-[500px] px-5 py-2'
                  />
                </div>
                <hr className='w-full border-t border-primary-700 mb-6 mt-5' />

                <div className='flex lg:flex-row md:flex-row flex-col gap-3 lg:gap-10 mt-6 lg:justify-start lg:items-center'>
                  <p className='text-primary-600 font-bold font-roboto lg:text-xl text-xl'>Confirm Email:</p>
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder='Confirm new email'
                    className='border border-primary-600 rounded-md bg-primary-700 text-primary-600 w-[300px] lg:w-[500px] md:w-[500px] px-5 py-2'
                  />
                </div>
                <hr className='w-full border-t border-primary-700 mb-6 mt-5' />

                <div className='flex flex-row gap-4 mt-4'>
                  <button
                    onClick={() => navigate('/account')}
                    className='border border-primary-600 text-primary-600 p-2 px-8 rounded-md font-roboto uppercase'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangeEmail}
                    disabled={loading}
                    className='bg-primary-600 text-white p-2 px-8 rounded-md font-roboto uppercase disabled:opacity-50'
                  >
                    {loading ? 'Sending...' : 'Send Verification'}
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ChangeEmail