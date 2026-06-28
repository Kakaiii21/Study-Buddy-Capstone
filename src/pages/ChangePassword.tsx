import { useState } from 'react'
import { getAuth } from 'firebase/auth'
import { resetPassword } from '../services/authService'

function ChangePassword() {
  const auth = getAuth()
  const currentEmail = auth.currentUser?.email || ''

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendLink = async () => {
    setError('')
    setSuccess('')

    if (!currentEmail) {
      setError('No account email found. Please log in again.')
      return
    }

    try {
      setLoading(true)
      await resetPassword(currentEmail) // ← changed
      setSuccess(`Reset link sent to ${currentEmail}. Check your inbox.`)
    } catch (err) {
      const e = err as { code: string }
      if (e.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment and try again.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }


return (
  <div className='w-full px-4 md:px-16 lg:px-24 xl:px-40 py-6'>
    <h1 className='text-primary-600 font-semibold font-inter text-xl md:text-2xl lg:text-[28px] xl:text-[30px] 2xl:text-[32px] mb-4 md:mb-6'>Password</h1>
    <h1 className='text-primary-600 font-semibold font-inter mt-5 md:mt-12 lg:mt-14 xl:mt-16 2xl:mt-20 text-center text-xl md:text-2xl lg:text-[28px] xl:text-[30px] uppercase 2xl:text-[28px] mb-4 md:mb-6'>Change Password</h1>
    <p className='text-primary-600 text-sm text-center font-inter font-normal mb-6'>
      We'll send a password reset link to your registered email.
    </p>

    {error && <p className='text-red-500 text-center text-sm font-semibold mb-4'>{error}</p>}
    {success && <p className='text-green-500 text-center text-sm font-semibold mb-4'>{success}</p>}

    {/* Email */}
    <div className='flex flex-col gap-1 mb-6 mt-5 md:mt-12 lg:mt-14 xl:mt-16 2xl:mt-20'>
      <label className='text-primary-600 font-inter text-sm  md:text-md lg:text-lg xl:text-lg 2xl:text-lg'>Email</label>
      <input
        aria-label='email'
        type="email"
        value={currentEmail}
        readOnly
        className='border border-gray-300 rounded-md bg-gray-50 text-primary-600 w-full px-4 py-2 cursor-not-allowed opacity-70 text-sm md:text-base'
      />
    </div>

    {/* Send Link Button */}
    <div className='flex justify-center'>
      <button
        onClick={handleSendLink}
        disabled={loading}
        className='w-full md:w-[400px] flex items-center justify-center bg-[#E59D24] hover:bg-[#F0AD3A] transition-all duration-300 text-black font-inter font-semibold uppercase py-2 lg:py-3  xl:py-3 2xl:py-3
        disabled:opacity-50
        shadow-[0_2px_1px_rgba(0,0,0,0.35)]
        rounded-md
        hover:-translate-y-1 hover:shadow-[0_4px_8px_rgba(0,0,0,0.35)]'
      >
        {loading ? 'Sending...' : 'Send Link'}
      </button>
    </div>
  </div>
)
}

export default ChangePassword