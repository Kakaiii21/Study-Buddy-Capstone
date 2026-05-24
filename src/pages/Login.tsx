import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import { getAuth } from 'firebase/auth'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

const handleLogin = async () => {
  setError('')

  if (!email || !password) {
    setError('All fields are required.')
    return
  }

  try {
    setLoading(true)
    const user = await login(email, password) // ← capture returned user

    // Block unverified users
    if (!user.emailVerified) {
      await getAuth().signOut()
      setError('Please verify your email first. Check your inbox.')
      return
    }

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-t from-primary-500 to-primary-50">

      {/* FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 order-2 lg:order-1">
        <div className="w-full max-w-md h-[600px] bg-white p-6 rounded-xl shadow-md border-4 border-primary-600">

          {/* TABS */}
          <div className="flex justify-center space-x-12 mb-5">
            <button
              onClick={() => navigate('/')}
              className="text-md font-bold border-2 border-primary-600 py-4 rounded-md w-[190px] bg-white text-primary-600"
            >
              SIGN UP
            </button>

            <button
              className="text-md font-bold border-2 border-primary-600 py-4 rounded-md w-[190px] bg-primary-600 text-white"
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
          <p className="text-primary-600 font-bold p-2">EMAIL</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-1 p-2 border rounded"
            placeholder="juandelacruz@gmail.com"
          />

          <p className="text-primary-600 font-bold p-2">PASSWORD</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
            placeholder="Your password"
          />

          <div className='flex justify-end'>
            <button className='mb-8 text-sm text-primary-600 font-bold hover:underline'>FORGOT PASSWORD</button>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary-600 font-bold text-white p-6 border rounded-xl disabled:opacity-50"
          >
            {loading ? 'LOGGING IN...' : 'LOG IN'}
          </button>

          <div className="flex justify-center">
            <button className="flex items-center gap-4 m-2 mt-6 bg-white px-10 py-3 border-2 border-primary-600 rounded-xl font-bold uppercase text-primary-600">
              <img src="/google.png" alt="Google Logo" className="w-8 h-8" />
              Google
            </button>
          </div>

          

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