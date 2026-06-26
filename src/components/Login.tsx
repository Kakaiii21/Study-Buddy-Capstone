import { useState, useEffect } from 'react'
import { onAuthChange } from '../services/authService'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import { getAuth } from 'firebase/auth'
import { googleLogin } from '../services/authService'

type FieldErrors = {
  email: string
  password: string
}

type TouchedFields = {
  email: boolean
  password: boolean
}

function Login({ onSwitchToSignup} : {onSwitchToSignup?: () => void}) {
  const navigate = useNavigate()
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user && user.emailVerified) {   //  only redirect verified users
        navigate('/dashboard', { replace: true })
      }
    })
    return () => unsubscribe()
  }, [])

  const [emailUpdated] = useState(() => {
    const val = new URLSearchParams(window.location.search).get('emailUpdated')
    if (val) window.history.replaceState({}, '', '/login')
    return val
  })
  const [cancelResult] = useState(() => {
  const val = new URLSearchParams(window.location.search).get('cancelResult')
  if (val) window.history.replaceState({}, '', '/login')
  return val
})

const [passwordUpdated] = useState<boolean>(() => {
  const fromQuery = new URLSearchParams(window.location.search).get('passwordUpdated') === 'true'
  if (fromQuery) window.history.replaceState({}, '', '/login')
  return fromQuery
})
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

    const handleGoogleLogin = async () => {
      try {
        setLoading(true)
        await googleLogin()
        navigate('/dashboard')
      } catch (err: unknown) {
        if (
          typeof err === 'object' && err !== null && 'code' in err &&
          (err as { code: string }).code === 'auth/popup-closed-by-user'
        ) return
        setFieldErrors(prev => ({ ...prev, email: 'Google sign-in failed. Please try again.' }))
      } finally {
        setLoading(false)
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
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'code' in err) {
          const code = (err as { code: string }).code
          if (
            code === 'auth/invalid-credential' ||
            code === 'auth/user-not-found' ||
            code === 'auth/wrong-password'
          ) {
            setFieldErrors({ email: 'Invalid email or password.', password: 'Invalid email or password.' })
            setTouched({ email: true, password: true })
          } else {
            setFieldErrors(prev => ({ ...prev, email: 'Something went wrong. Please try again.' }))
          }
        }
      } finally {
            setLoading(false)
          }
        }

  const inputClass = (field: keyof FieldErrors) =>
    `w-full mb-1 xl:text-sm p-2 border border-primary-600 ${touched[field] && fieldErrors[field] ? 'border-red-500 bg-red-50' : ''}`

  return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-primary-600">



{/* LEFT PANEL */}
    <div className="hidden lg:flex lg:w-1/2 bg-primary-600 items-center justify-center px-16">

      <div className="max-w-xl">

        <h1 className="text-white font-inter font-extrabold text-6xl xl:text-5xl 2xl:text-6xl ">
            Welcome Back,
          <br />
            Buddy!
        </h1>

        <div className="mt-12 space-y-10 xl:space-y-5">

          <p className="text-white  text-2xl xl:text-lg 2xl:text-2xl font-fustat max-w-md">
            Continue your learning journey and stay on track with your goals.
          </p>

          <p className="text-white  text-2xl xl:text-lg 2xl:text-2xl font-fustat max-w-md">
            Log in to access your notes, quizzes, and personalized learning tools.
          </p>

          <div>
            <p className="text-white  text-2xl xl:text-lg 2xl:text-2xl mb-5 font-fustat">
             Don’t have an account?
            </p>

            <button
              onClick={() => onSwitchToSignup  ? onSwitchToSignup() : navigate('/signup')}
              className="
                bg-white
                text-primary-600
                px-10 py-3
                xl:px-8 xl:py-2
                rounded-full
                font-bold
                text-xl
                font-fustat
                flex items-center
                gap-6
                shadow-lg
                hover:-translate-y-1
                transition-all
                uppercase
              "
            >
             Sign Up
              <img src="./Arrow.png" alt="arrow" className='w-8 xl:w-6' />
            </button>
          </div>

        </div>

      </div>

    </div>

      {/* FORM */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-2 pb-8 lg:pb-28 xl:pb-28 2xl:pb-28 pt-1 order-2 lg:order-1 ">
        <div className="w-full lg:w-[400px] xl:w-[400px] lg:mt-5 xl:mt-5 2xl:mt-0 2xl:w-full max-w-md bg-white p-6 lg:py-4 xl:py-4 2xl:py-6 rounded-xl shadow-md border-4 border-primary-600">

          <p className='text-primary-600 mb-12 font-inter font-extrabold uppercase text-center text-sm lg:text-lg xl:text-xl 2xl:text-2xl'>Log In</p>


          {emailUpdated && (
            <div className="bg-primary-600 text-white px-4 py-3 rounded-md text-sm font-roboto text-center mb-4">
               Email updated! Please sign in with your new email.
            </div>
          )}
          {passwordUpdated && (
            <div className="bg-primary-600 text-white px-4 py-3 rounded-md text-sm font-roboto text-center mb-4">
              Password updated! Please sign in with your new password.
            </div>
          )}

          {/* ✅ ADD THESE */}
          {cancelResult === 'success' && (
            <div className="bg-green-600 text-white px-4 py-3 rounded-md text-sm font-roboto text-center mb-4">
              Email change cancelled. Your account email remains unchanged.
            </div>
          )}
          {cancelResult === 'expired' && (
            <div className="bg-red-500 text-white px-4 py-3 rounded-md text-sm font-roboto text-center mb-4">
              This undo link has expired. Contact support if you need help recovering your account.
            </div>
          )}
          {cancelResult === 'already-used' && (
            <div className="bg-yellow-500 text-white px-4 py-3 rounded-md text-sm font-roboto text-center mb-4">
              This link has already been used.
            </div>
          )}

          {/* EMAIL */}
          <p className="text-primary-600 font-inter font-normal p-2 lg:p-1 xl:p-1 2xl:pl-2
          xl:text-[13px]
          ">EMAIL</p>
          <input
            type="email"
            value={email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            className={inputClass('email')}
            placeholder="Enter Your Email"
          />
          {touched.email && fieldErrors.email && (
            <p className="text-red-500 text-xs mb-2 px-1">⚠ {fieldErrors.email}</p>
          )}

          {/* PASSWORD */}
          <p className="text-primary-600 font-inter mt-4 font-normal p-2 lg:p-1 xl:p-1 2xl:pl-2
          xl:text-[13px]
          ">PASSWORD</p>
          <input
            type="password"
            value={password}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            className={inputClass('password')}
            placeholder="Enter Your password"
          />
          {touched.password && fieldErrors.password && (
            <p className="text-red-500 text-xs mb-2 px-1">⚠ {fieldErrors.password}</p>
          )}

          <div className="flex justify-end">
            <button
              className="mb-8 mt-2 text-sm text-primary-600 font-inter font-semibold hover:underline"
              onClick={() => navigate('/forgotPassword')}
            >
              FORGOT PASSWORD
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary-600 
              hover:opacity-90   
               backdrop-blur-xs
               hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)]
               transition-all duration-300
            font-normal font-inter text-white p-6 lg:p-3 xl:p-3 2xl:p-4 rounded-full border disabled:opacity-50"
          >
            {loading ? 'LOGGING IN...' : 'LOG IN'}
          </button>
          <p className='text-center pt-5 font-inter text-primary-600 xl:text-[12px] '>OR</p>

        <div className="flex justify-center">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
                className="
                flex items-center gap-4
                m-2 mt-3
                px-10 py-3
                rounded-full
                font-bold uppercase
                text-primary-600
                disabled:opacity-50

                hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)]

                hover:-translate-y-1.5
                active:translate-y-0

                transition-all duration-300
                ">
            <img src="/google.png" alt="Google Logo" className="w-8 h-8 lg:h-6 lg:w-6 xl:h-6 xl:w-6 2xl:h-8 2xl:w-8" />
            
          </button>
        </div>

        </div>
      </div>


    </div>
  )
}

export default Login