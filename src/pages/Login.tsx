import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/authService'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError('')

    // check if fields are filled
    if (!email || !password) {
      setError('All fields are required.')
      return
    }

  try {
      setLoading(true)
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      const error = err as { code: string }
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email.')
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-t from-primary-50 to-primary-100">

      {/* FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 order-2 lg:order-1">
        <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md border-4 border-primary-500">

          {/* TABS */}
          <div className="flex justify-center space-x-12 mb-5">
            <button
              onClick={() => navigate('/')}
              className="text-md font-bold border-2 border-primary-500 py-4 rounded-md w-[190px] bg-white text-primary-500"
            >
              SIGN UP
            </button>

            <button
              className="text-md font-bold border-2 border-primary-500 py-4 rounded-md w-[190px] bg-primary-500 text-primary-100"
            >
              LOG IN
            </button>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <p className="text-red-500 text-sm text-center mb-4 font-semibold">
              {error}
            </p>
          )}

          {/* FORM FIELDS */}
          <p className="text-primary-500 font-bold p-2">EMAIL</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-1 p-2 border rounded"
            placeholder="juandelacruz@gmail.com"
          />

          <p className="text-primary-500 font-bold p-2">PASSWORD</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
            placeholder="Your password"
          />

          <div className='flex justify-end'>
            <button className='mb-10 text-sm text-primary-500 font-bold hover:underline'>FORGOT PASSWORD</button>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary-500 font-bold text-white p-6 border rounded-xl disabled:opacity-50"
          >
            {loading ? 'LOGGING IN...' : 'LOG IN'}
          </button>

          

        </div>
      </div>

      {/* LOGO + TEXT */}
      <div className="w-full lg:w-1/2 p-10 flex flex-col items-center justify-center order-1 lg:order-2 text-center pr-20">
        <img src="/logo.png" alt="Study Buddy logo" className="w-[500px] lg:w-[600px] h-auto mb-6" />
        <p className="text-[#132442] text-lg max-w-xl">
          Study Buddy is a web-based learning support application designed to help students manage their study time, improve focus, and enhance learning efficiency.
        </p>
        <img src="/read.png" alt="Reading" className="hidden lg:block w-[200px] lg:w-[300px] h-auto mb-6" />
      </div>

    </div>
  )
}

export default Login