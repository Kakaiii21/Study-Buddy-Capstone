import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import { getAuth } from 'firebase/auth'

type FieldErrors = {
  email: string
  password: string
}

type TouchedFields = {
  email: boolean
  password: boolean
}

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({ email: '', password: '' })
  const [touched, setTouched] = useState<TouchedFields>({ email: false, password: false })

  const [loading, setLoading] = useState(false)

  const validateField = (field: keyof FieldErrors, values: { email: string; password: string }): string => {
    switch (field) {
      case 'email':
        if (!values.email.trim()) return 'Email is required.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return 'Enter a valid email address.'
        return ''
      case 'password':
        if (!values.password) return 'Password is required.'
        return ''
      default:
        return ''
    }
  }

  const handleChange = (field: keyof FieldErrors, value: string) => {
    const newValues = { email, password, [field]: value }

    if (field === 'email') setEmail(value)
    if (field === 'password') setPassword(value)

    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, newValues)
    setFieldErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, { email, password })
    setFieldErrors(prev => ({ ...prev, [field]: error }))
  }

  const validateAll = (): boolean => {
    const errors: FieldErrors = {
      email: validateField('email', { email, password }),
      password: validateField('password', { email, password }),
    }
    setFieldErrors(errors)
    setTouched({ email: true, password: true })
    return Object.values(errors).every(e => e === '')
  }

  const handleLogin = async () => {
    if (!validateAll()) return

    try {
      setLoading(true)
      const user = await login(email, password)

      if (!user.emailVerified) {
        await getAuth().signOut()
        setFieldErrors(prev => ({ ...prev, email: 'Please verify your email first. Check your inbox.' }))
        return
      }

      navigate('/dashboard')
    } catch (err) {
      const firebaseError = err as { code: string }
      if (
        firebaseError.code === 'auth/invalid-credential' ||
        firebaseError.code === 'auth/user-not-found' ||
        firebaseError.code === 'auth/wrong-password'
      ) {
        setFieldErrors({ email: 'Invalid email or password.', password: 'Invalid email or password.' })
        setTouched({ email: true, password: true })
      } else {
        setFieldErrors(prev => ({ ...prev, email: 'Something went wrong. Please try again.' }))
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: keyof FieldErrors) =>
    `w-full mb-1 p-2 border rounded ${touched[field] && fieldErrors[field] ? 'border-red-500 bg-red-50' : ''}`

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

          {/* EMAIL */}
          <p className="text-primary-600 font-bold p-2">EMAIL</p>
          <input
            type="email"
            value={email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            className={inputClass('email')}
            placeholder="juandelacruz@gmail.com"
          />
          {touched.email && fieldErrors.email && (
            <p className="text-red-500 text-xs mb-2 px-1">⚠ {fieldErrors.email}</p>
          )}

          {/* PASSWORD */}
          <p className="text-primary-600 font-bold p-2">PASSWORD</p>
          <input
            type="password"
            value={password}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            className={inputClass('password')}
            placeholder="Your password"
          />
          {touched.password && fieldErrors.password && (
            <p className="text-red-500 text-xs mb-2 px-1">⚠ {fieldErrors.password}</p>
          )}

          <div className="flex justify-end">
            <button
              className="mb-8 mt-1 text-sm text-primary-600 font-bold hover:underline"
              onClick={() => navigate('/forgotPassword')}
            >
              FORGOT PASSWORD
            </button>
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