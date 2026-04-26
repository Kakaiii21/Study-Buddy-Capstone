import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from './services/authService'
import './index.css'

function App() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('signup')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setError('')
    setSuccess('')

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('All fields are required.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.')
      return
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter.')
      return
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.')
      return
    }

    if (!/[!@#$%^&*()_+=;'"|,.<>?@-]/.test(password)) {
      setError('Password must contain at least one special character.')
      return
    }
    try {
      setLoading(true)
      await signup(firstName, lastName, email, password)
      setLoading(false)
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setSuccess('✅ Account created successfully! Redirecting to login...')

      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (err) {
      setLoading(false)
      const firebaseError = err as { code: string }
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('Email is already in use.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-t from-primary-500 to-primary-50">

      {/* FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 order-2 lg:order-1">
        <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md border-4 border-primary-600">

          {/* TABS */}
          <div className="flex justify-center space-x-12 mb-5">
            <button
              onClick={() => setActiveTab('signup')}
              className={`text-md font-bold border-2 border-primary-600 py-4 rounded-md w-[190px] ${
                activeTab === 'signup'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-primary-600'
              }`}
            >
              SIGN UP
            </button>

            <button
              onClick={() => {
                setActiveTab('login')
                navigate('/login')
              }}
              className={`text-md font-bold border-2 border-primary-600 py-4 rounded-md w-[190px] ${
                activeTab === 'login'
                  ? 'bg-primary-500 text-primary-100'
                  : 'bg-white text-primary-600'
              }`}
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

          {/* SUCCESS MESSAGE */}
          {success && (
            <p className="text-green-500 text-sm text-center mb-4 font-semibold">
              {success}
            </p>
          )}

          {/* FORM FIELDS */}
          <p className="text-primary-600 font-bold p-2">FIRST NAME</p>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full mb-1 p-2 border rounded"
            placeholder="ex. Juan"
          />

          <p className="text-primary-600 font-bold p-2">LAST NAME</p>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full mb-1 p-2 border rounded"
            placeholder="ex. Dela Cruz"
          />

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
            className="w-full mb-1 p-2 border rounded"
            placeholder="ex. Ju1an_delaCruz"
          />

          <p className="text-primary-600 font-bold p-2">CONFIRM PASSWORD</p>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mb-8 p-2 border rounded"
            placeholder="ex. Ju1an_delaCruz"
          />

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-primary-600 font-bold text-white p-6 border rounded-xl disabled:opacity-50"
          >
            {loading ? 'SIGNING UP...' : 'SIGN UP'}
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

export default App