import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetPassword } from '../services/authService'

function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendLink = async () => {
    setError('')
    setSuccess('')

    if (!email) {
      setError('Please enter your email.')
      return
    }

    try {
      setLoading(true)
      await resetPassword(email) // ← changed
      setSuccess('Password reset link sent! Check your inbox.')
      setEmail('')
    } catch (err) {
      const e = err as { code: string }
      if (e.code === 'auth/user-not-found') {
        setError('No account found with this email.')
      } else if (e.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='h-screen w-full'>
      <div className='flex flex-row mt-3 ml-5'>
              <button
                title="Go Back to Account"
                onClick={() => navigate('/account')}
                className="flex flex-col items-center md:ml-16 lg:ml-16 lg:mt-10 xl:ml-16 xl:mt-10 2xl:ml-16 2xl:mt-10 px-3 py-1 rounded hover:bg-gray-100 transition"
              >
                <span className="text-5xl leading-none">←</span>
                <span className="text-sm">Back</span>
              </button>
      </div>

      <div className='flex flex-col justify-center items-center'>
        <img src="logo.png" alt="" className='w-64 h-44' />

        <div className='flex flex-col border-2 border-primary-600 rounded-xl w-[90%] lg:w-[850px] mt-10 gap-6 justify-start items-center px-5 py-10'>
          <p className='font-roboto font-bold text-primary-600 uppercase text-2xl lg:text-3xl'>
            Forgot Password
          </p>

          <p className='text-gray-500 text-sm text-center max-w-md'>
            Enter your email and we'll send you a link to reset your password.
          </p>

          {error && <p className='text-red-500 text-sm font-semibold'>{error}</p>}
          {success && <p className='text-green-500 text-sm font-semibold text-center'>{success}</p>}

          <div className='w-full max-w-sm'>
            <p className='font-roboto font-bold text-primary-600 text-md mb-1'>Email</p>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendLink()}
              placeholder='Enter your email'
              className='w-full px-3 py-2 border border-primary-600 rounded-md focus:outline-none'
            />
          </div>
        </div>

        <button
          onClick={handleSendLink}
          disabled={loading}
          className='font-roboto font-bold bg-primary-600 text-white text-md px-16 py-2 mt-10 rounded-md uppercase disabled:opacity-50'
        >
          {loading ? 'Sending...' : 'Send Link'}
        </button>
      </div>
    </div>
  )
}

export default ForgotPassword