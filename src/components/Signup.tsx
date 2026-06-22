import { useEffect ,useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthChange } from '../services/authService'
import { signup } from '../services/authService'
import { googleLogin } from '../services/authService'

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
function PasswordRequirements({ password }: { password: string }) {
  
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character (!@#$...)', met: /[!@#$%^&*()_+=;'"|,.<>?@-]/.test(password) },
  ]

  return (
    <div className='bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2'>
      <p className='text-xs font-semibold text-primary-600 mb-1'>Password requirements:</p>
      <ul className='space-y-0.5'>
        {requirements.map((req) => (
          <li key={req.label} className='flex items-center gap-2 text-xs'>
            <span className={req.met ? 'text-green-500' : 'text-gray-400'}>
              {req.met ? '✓' : '○'}
            </span>
            <span className={req.met ? 'text-green-600 line-through' : 'text-gray-500'}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
function Signup() {
    const navigate = useNavigate()

    useEffect(() => {
      const unsubscribe = onAuthChange((user) => {
        if (user) {
          if (user.emailVerified) {
            navigate('/dashboard', { replace: true })
          } else {
            navigate('/verify-email', { replace: true })
          }
        }
      })
      return () => unsubscribe()
    }, [])


  const [activeTab, setActiveTab] = useState('signup')
  const [passwordFocused, setPasswordFocused] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // ✅ Terms agreement state
  const [agreed, setAgreed] = useState(false)
  const [agreedTouched, setAgreedTouched] = useState(false)

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

  const handleGoogleSignup = async () => {
    try {
      setLoading(true)
      await googleLogin()
      navigate('/dashboard')   // Google users are always verified ✓
    } catch (err) {
      const firebaseError = err as { code: string }
      if (firebaseError.code === 'auth/popup-closed-by-user') return
      setFieldErrors(prev => ({ ...prev, email: 'Google sign-in failed. Please try again.' }))
    } finally {
      setLoading(false)
    }
  }

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
    setAgreedTouched(true)
    return Object.values(errors).every(e => e === '') && agreed
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
      setAgreed(false)
      setAgreedTouched(false)
      setFieldErrors({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
      setTouched({ firstName: false, lastName: false, email: false, password: false, confirmPassword: false })
      setSuccess(' Redirecting to Verify Email...')
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
        <div className="w-full lg:w-1/2 flex items-center justify-center px-2 pb-8 lg:pb-28 xl:pb-28 2xl:pb-28 pt-1 order-2 lg:order-1 ">
        <div className="w-full lg:w-[400px] xl:w-[400px] lg:mt-5 xl:mt-5 2xl:mt-0 2xl:w-full max-w-md bg-white p-6 lg:py-4 xl:py-4 2xl:py-6 rounded-xl shadow-md border-4 border-primary-600">

          {/* TABS */}
          <div className="flex justify-center space-x-12 mb-5 lg:mb-3 xl:mb-3 2xl:mb-5">
            <button
              onClick={() => setActiveTab('signup')}
              className={`text-md font-bold border-2 border-primary-600 py-4 rounded-md w-[190px] lg:py-1 xl:py-1 2xl:py-4 ${
                activeTab === 'signup' ? 'bg-primary-600 text-white' : 'bg-white text-primary-600'
              }`}
            >
              SIGN UP
            </button>
            <button
              onClick={() => { setActiveTab('login'); navigate('/login') }}
              className={`text-md font-bold border-2 border-primary-600 py-4 rounded-md w-[190px] lg:py-1 xl:py-1 2xl:py-4 ${
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
          <p className="text-primary-600 font-bold  p-2 lg:p-1 xl:p-1 2xl:pl-2">FIRST NAME</p>
          <input
            type="text"
            value={firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            onBlur={() => handleBlur('firstName')}
            className={inputClass('firstName')}
            placeholder="Enter Your Name"
          />
          {touched.firstName && fieldErrors.firstName && (
            <p className="text-red-500 text-xs mb-2 px-1">⚠ {fieldErrors.firstName}</p>
          )}

          {/* LAST NAME */}
          <p className="text-primary-600 font-bold p-2 lg:p-1 xl:p-1 2xl:pl-2">LAST NAME</p>
          <input
            type="text"
            value={lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onBlur={() => handleBlur('lastName')}
            className={inputClass('lastName')}
            placeholder="Enter Your Last Name"
          />
          {touched.lastName && fieldErrors.lastName && (
            <p className="text-red-500 text-xs mb-2 px-1">⚠ {fieldErrors.lastName}</p>
          )}

          {/* EMAIL */}
          <p className="text-primary-600 font-bold p-2 lg:p-1 xl:p-1 2xl:pl-2">EMAIL</p>
          <input
            type="email"
            value={email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            className={inputClass('email')}
            placeholder="Enter Your Email Address"
          />
          {touched.email && fieldErrors.email && (
            <p className="text-red-500 text-xs mb-2 px-1">⚠ {fieldErrors.email}</p>
          )}

          {/* PASSWORD */}
          <p className="text-primary-600 font-bold p-2 lg:p-1 xl:p-1 2xl:pl-2">PASSWORD</p>
          <input
            type="password"
            value={password}
            onChange={(e) => handleChange('password', e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => {
              setPasswordFocused(false)
              handleBlur('password')
            }}            
            className={inputClass('password')}
            placeholder="Enter Your Password"
          />

          {/* Show checklist ONLY while focused */}
          {passwordFocused && (
            <PasswordRequirements password={password} />
          )}
          {/* Show single error ONLY when blurred and invalid */}
          {!passwordFocused && touched.password && fieldErrors.password && (
            <p className="text-red-500 text-xs mb-2 px-1">⚠ {fieldErrors.password}</p>
          )}

          {/* CONFIRM PASSWORD */}
          <p className="text-primary-600 font-bold p-2 lg:p-1 xl:p-1 2xl:pl-2">CONFIRM PASSWORD</p>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            className={`w-full mb-2 p-2 border rounded ${touched.confirmPassword && fieldErrors.confirmPassword ? 'border-red-500 bg-red-50' : ''}`}
            placeholder="Enter Your Password"
          />
          {touched.confirmPassword && fieldErrors.confirmPassword && (
            <p className="text-red-500 text-xs mb-4 px-1">⚠ {fieldErrors.confirmPassword}</p>
          )}

          {/* ✅ TERMS & PRIVACY CHECKBOX */}
          <div className="mb-4 mt-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked)
                  setAgreedTouched(true)
                }}
                className="mt-1 accent-primary-600"
              />
              <span className="text-xs text-gray-600">
                I have read and agree to the{' '}
                <span
                  onClick={() => navigate('/terms')}
                  className="text-primary-600 font-semibold cursor-pointer hover:underline"
                >
                  Terms of Service
                </span>{' '}
                and{' '}
                <span
                  onClick={() => navigate('/privacy')}
                  className="text-primary-600 font-semibold cursor-pointer hover:underline"
                >
                  Privacy Policy
                </span>
                .
              </span>
            </label>
            {/* ✅ Show error if they try to sign up without checking */}
            {agreedTouched && !agreed && (
              <p className="text-red-500 text-xs mt-1 px-1">⚠ You must agree to the Terms of Service and Privacy Policy.</p>
            )}
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-primary-600 font-bold text-white p-6 lg:p-3 xl:p-3 2xl:p-6 border rounded-xl disabled:opacity-50"
          >
            {loading ? 'SIGNING UP...' : 'SIGN UP'}
          </button>

          <div className="flex justify-center">
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="flex items-center gap-4 m-2 mt-6 bg-white px-10 py-3 lg:py-1 xl:py-1 2xl:py-3 lg:mt-3 xl:mt-3 2xl:mt-6 border-2 border-primary-600 rounded-xl font-bold uppercase text-primary-600 disabled:opacity-50"
            >
              <img src="/google.png" alt="Google Logo" className="w-8 h-8 lg:h-6 lg:w-6 xl:h-6 xl:w-6 2xl:h-8 2xl:w-8" />
              Google
            </button>
          </div>

        </div>
      </div>

      {/* LOGO + TEXT */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-start order-1 lg:order-2 text-center lg:gap-1 xl:gap-1 2xl:gap-3 lg:pr-20 xl:pr-10 2xl:pr-60 px-6 py-10">
        <img src="/logo.png" alt="Study Buddy logo" className="w-[500px] lg:w-[400px] xl:w-[400px] 2xl:min-w-[500px] h-auto mb-6" />
        <p className="text-[#132442] text-center text-lg lg:text-sm xl:text-sm 2xl:text-lg max-w-xl ">
          Study Buddy is a web-based learning support application designed to help students manage their study time, improve focus, and enhance learning efficiency.
        </p>
        <img src="/read.png" alt="Reading" className="hidden lg:block w-[200px] lg:w-[200px] xl:w-[200px] 2xl:min-w-[250px] h-auto mb-6" />
      </div>

    </div>
  )
}

export default Signup