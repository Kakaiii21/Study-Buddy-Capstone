import { useEffect, useState } from 'react'
import { getAuth, sendEmailVerification, reload } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'

function VerifyEmail() {
  const auth = getAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

  // Auto-check every 5 seconds if user verified their email
  useEffect(() => {
    const interval = setInterval(async () => {
      const user = auth.currentUser
      if (!user) return

      setChecking(true)
      await reload(user) // refresh user data from Firebase

      if (user.emailVerified) {
        clearInterval(interval)
        navigate('/login')
      }
      setChecking(false)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleResend = async () => {
    const user = auth.currentUser
    if (!user) return

    try {
      setLoading(true)
      setError('')
      await sendEmailVerification(user)
      setMessage('Verification email resent! Check your inbox.')
    } catch {
      setError('Could not resend email. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-t from-primary-500 to-primary-50">
      <div className="bg-white p-8 rounded-xl shadow-md border-4 border-primary-600 max-w-md w-full text-center">

        <img src="/logo.png" alt="Study Buddy" className="w-40 mx-auto mb-6" />

        <h2 className="text-2xl font-bold text-primary-600 mb-2">Verify Your Email</h2>
        <p className="text-gray-600 mb-2">
          We sent a verification link to your email. Please check your inbox and click the link to activate your account.
        </p>

        {checking && (
          <p className="text-sm text-gray-400 mb-4">Checking verification status...</p>
        )}

        {message && <p className="text-green-500 font-semibold mb-4">{message}</p>}
        {error && <p className="text-red-500 font-semibold mb-4">{error}</p>}

        <button
          onClick={handleResend}
          disabled={loading}
          className="w-full bg-primary-600 text-white font-bold p-4 rounded-xl mb-4 disabled:opacity-50"
        >
          {loading ? 'Resending...' : 'Resend Verification Email'}
        </button>

        <button
          onClick={() => navigate('/login')}
          className="w-full border-2 border-primary-600 text-primary-600 font-bold p-4 rounded-xl"
        >
          Go to Login
        </button>

      </div>
    </div>
  )
}

export default VerifyEmail