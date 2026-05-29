import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from './services/authService'
import './index.css'

type FieldErrors = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

type TouchedFields = {
  firstName: boolean
  lastName: boolean
  email: boolean
  password: boolean
  confirmPassword: boolean
}

function App() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('signup')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [touched, setTouched] = useState<TouchedFields>({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  })

  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const touch = (field: keyof TouchedFields) =>
    setTouched(prev => ({ ...prev, [field]: true }))

  const validateField = (field: keyof FieldErrors, values: {
    firstName: string
    lastName: string
    email: string
    password: string
    confirmPassword: string
  }): string => {
    switch (field) {
      case 'firstName':
        return !values.firstName.trim() ? 'First name is required.' : ''
      case 'lastName':
        return !values.lastName.trim() ? 'Last name is required.' : ''
      case 'email':
        if (!values.email.trim()) return 'Email is required.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return 'Enter a valid email address.'
        return ''
      case 'password':
        if (!values.password) return 'Password is required.'
        if (values.password.length < 8) return 'Must be at least 8 characters.'
        if (!/[A-Z]/.test(values.password)) return 'Must include an uppercase letter.'
        if (!/[a-z]/.test(values.password)) return 'Must include a lowercase letter.'
        if (!/[0-9]/.test(values.password)) return 'Must include a number.'
        if (!/[!@#$%^&*()_+=;'"|,.<>?@-]/.test(values.password)) return 'Must include a special character.'
        return ''
      case 'confirmPassword':
        if (!values.confirmPassword) return 'Please confirm your password.'
        if (values.confirmPassword !== values.password) return 'Passwords do not match.'
        return ''
      default:
        return ''
    }
  }

  const currentValues = { firstName, lastName, email, password, confirmPassword }

  const handleChange = (field: keyof FieldErrors, value: string) => {
    const newValues = { ...currentValues, [field]: value }

    // Update the state value
    const setters = {
      firstName: setFirstName,
      lastName: setLastName,
      email: setEmail,
      password: setPassword,
      confirmPassword: setConfirmPassword,
    }
    setters[field](value)

    // Mark as touched and validate immediately
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, newValues)
    setFieldErrors(prev => ({ ...prev, [field]: error }))

    // Also re-validate confirmPassword live when password changes
    if (field === 'password') {
      const confirmError = validateField('confirmPassword', newValues)
      setFieldErrors(prev => ({ ...prev, confirmPassword: touched.confirmPassword ? confirmError : prev.confirmPassword }))
    }
  }

  const handleBlur = (field: keyof FieldErrors) => {
    touch(field)
    const error = validateField(field, currentValues)
    setFieldErrors(prev => ({ ...prev, [field]: error }))
  }

  const validateAll = (): boolean => {
    const fields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'] as (keyof FieldErrors)[]
    const errors = {} as FieldErrors
    fields.forEach(f => { errors[f] = validateField(f, currentValues) })
    setFieldErrors(errors)
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true })
    return Object.values(errors).every(e => e === '')
  }

  const handleSignup = async () => {
    setSuccess('')
    if (!validateAll()) return

    try {
      setLoading(true)
      await signup(firstName, lastName, email, password)
      setLoading(false)
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setFieldErrors({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
      setTouched({ firstName: false, lastName: false, email: false, password: false, confirmPassword: false })
      setSuccess('✅ Account created successfully! Redirecting to login...')
      setTimeout(() => navigate('/verify-email'), 2000)
    } catch (err) {
      setLoading(false)
      const firebaseError = err as { code: string }
      if (firebaseError.code === 'auth/email-already-in-use') {
        setFieldErrors(prev => ({ ...prev, email: 'Email is already in use.' }))
      } else {
        setFieldErrors(prev => ({ ...prev, email: 'Something went wrong. Please try again.' }))
      }
    }
  }

  const inputClass = (field: keyof FieldErrors) =>
    `w-full mb-1 p-2 border rounded ${touched[field] && fieldErrors[field] ? 'border-red-500 bg-red-50' : ''}`

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
                activeTab === 'signup' ? 'bg-primary-600 text-white' : 'bg-white text-primary-600'
              }`}
            >
              SIGN UP
            </button>
            <button
              onClick={() => { setActiveTab('login'); navigate('/login') }}
              className={`text-md font-bold border-2 border-primary-600 py-4 rounded-md w-[190px] ${
                activeTab === 'login' ? 'bg-primary-500 text-primary-100' : 'bg-white text-primary-600'
              }`}
            >
              LOG IN
            </button>
          </div>

          {/* SUCCESS MESSAGE */}
          {success && (
            <p className="text-green-500 text-sm text-center mb-4 font-semibold">{success}</p>
          )}

          {/* FIRST NAME */}
          <p className="text-primary-600 font-bold p-2">FIRST NAME</p>
          <input
            type="text"
            value={firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            onBlur={() => handleBlur('firstName')}
            className={inputClass('firstName')}
            placeholder="ex. Juan"
          />
          {touched.firstName && fieldErrors.firstName && (
            <p className="text-red-500 text-xs mb-2 px-1">⚠ {fieldErrors.firstName}</p>
          )}

          {/* LAST NAME */}
          <p className="text-primary-600 font-bold p-2">LAST NAME</p>
          <input
            type="text"
            value={lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onBlur={() => handleBlur('lastName')}
            className={inputClass('lastName')}
            placeholder="ex. Dela Cruz"
          />
          {touched.lastName && fieldErrors.lastName && (
            <p className="text-red-500 text-xs mb-2 px-1">⚠ {fieldErrors.lastName}</p>
          )}

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
            placeholder="ex. Ju1an_delaCruz"
          />
          {touched.password && fieldErrors.password && (
            <p className="text-red-500 text-xs mb-2 px-1">⚠ {fieldErrors.password}</p>
          )}

          {/* CONFIRM PASSWORD */}
          <p className="text-primary-600 font-bold p-2">CONFIRM PASSWORD</p>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            className={`w-full mb-2 p-2 border rounded ${touched.confirmPassword && fieldErrors.confirmPassword ? 'border-red-500 bg-red-50' : ''}`}
            placeholder="ex. Ju1an_delaCruz"
          />
          {touched.confirmPassword && fieldErrors.confirmPassword && (
            <p className="text-red-500 text-xs mb-4 px-1">⚠ {fieldErrors.confirmPassword}</p>
          )}

          <div className="mb-4" />

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