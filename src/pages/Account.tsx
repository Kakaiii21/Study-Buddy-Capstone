import React, { useEffect, useRef, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { uploadToCloudinary } from '../services/cloudinary'

function Account() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [profilePic, setProfilePic] = useState('/profile.png')
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  // ─── Load user data from Firestore ───────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const fetchUser = async () => {
      const docSnap = await getDoc(doc(db, 'users', user.uid))
      if (docSnap.exists()) {
        const data = docSnap.data()
        setFirstName(data.firstName || '')
        setLastName(data.lastName || '')
        setEmail(data.email || user.email || '')
        setProfilePic(data.photoURL || '/profile.png')
      }
    }
    fetchUser()
  }, [user])

  // ─── Save a single field to Firestore ────────────────────────────────────
  const handleSave = async (field: 'firstName' | 'lastName' | 'email') => {
    if (!user) return
    setSaving(field)
    try {
      const value =
        field === 'firstName' ? firstName :
        field === 'lastName'  ? lastName  : email
      await updateDoc(doc(db, 'users', user.uid), { [field]: value })
      const label = field === 'firstName' ? 'First name' : field === 'lastName' ? 'Last name' : 'Email'
      showToast(`${label} updated successfully!`)
    } catch (err) {
      console.error(`Failed to save ${field}:`, err)
      showToast('Failed to save. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  // ─── Upload profile pic via Cloudinary, save URL to Firestore ────────────
  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const result = await uploadToCloudinary(file, undefined, user.uid)
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: result.url,
        photoPublicId: result.publicId
      })
      setProfilePic(result.url)
      sessionStorage.setItem('profilePic', result.url)
      showToast('Profile picture updated successfully!')
    } catch (err) {
      console.error('Profile picture upload failed:', err)
      showToast('Failed to upload picture. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className='flex h-screen'>
      <Sidebar />

      {/* Toast */}
      {toast && (
        <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary-600 text-white px-6 py-3 rounded-xl shadow-lg font-roboto text-sm transition-all'>
          {toast}
        </div>
      )}

      <main className='flex-1 overflow-auto p-8 mt-1'>
        <div className='min-h-screen flex flex-col'>

          {/* Header */}
          <div className='flex flex-col md:flex-row lg:flex-row lg:items-center w-full gap-3 mb-6'>
            <p className='text-3xl md:text-4xl lg:text-4xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
              Account
            </p>
          </div>
          <hr className='w-full border-t border-primary-600 mb-6' />



          <div className='flex flex-col w-full h-screen justify-start items-center'>

            {/* Profile Pic */}
            <div className="relative w-fit">
              <img
                src={profilePic}
                alt="Profile"
                className="w-40 h-40 border-2 border-primary-600 rounded-full object-cover"
              />
              <input
                ref={fileInputRef}
                aria-label='img'
                type="file"
                accept="image/png, image/jpg, image/jpeg"
                className="hidden"
                onChange={handleProfilePicChange}
              />
              <button
                aria-label="add"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-primary-600 rounded-full shadow-md hover:opacity-70 disabled:opacity-40"
              >
                {uploading
                  ? <span className="w-10 h-10 flex items-center justify-center text-white text-xs">...</span>
                  : <img src="/profileAdd.png" alt="" className="w-10 h-10" />
                }
              </button>
            </div>

            <div className='w-full px-8 my-8 mt-10'>
              <div className='flex items-center gap-3'>
                <span className='lg:text-md text-sm text-primary-600 tracking-widest uppercase'>
                  Account Settings
                </span>
                <div className='flex-1 h-0.5 bg-primary-600' />
              </div>

              {/* First Name */}
              <div className='flex lg:flex-row md:flex-row flex-col gap-3 lg:gap-10 mt-6 lg:justify-start lg:items-center'>
                <p className='text-primary-600 font-bold font-roboto  lg:text-xl text-xl'>First Name:</p>
                <div className='flex flex-row gap-3 lg:gap-5'>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder='First name'
                    className='border border-primary-600 rounded-md  bg-primary-700 text-primary-600  w-[300px] lg:w-[500px] md:w-[500px] px-5'
                  />
                  <button
                    onClick={() => handleSave('firstName')}
                    disabled={saving === 'firstName'}
                    className='bg-primary-600 text-white p-2 lg:px-10 px-5 rounded-md font-roboto uppercase disabled:opacity-50'
                  >
                    {saving === 'firstName' ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
              <hr className='w-full border-t border-primary-700 mb-6 mt-5' />

              {/* Last Name */}
              <div className='flex lg:flex-row md:flex-row flex-col gap-3 lg:gap-10 mt-6 lg:justify-start lg:items-center'>
                <p className='text-primary-600 font-bold font-roboto lg:text-xl text-xl'>Last Name:</p>
                <div className='flex flex-row gap-3 lg:gap-5'>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder='Last name'
                    className='border border-primary-600 rounded-md bg-primary-700 text-primary-600 w-[300px] lg:w-[500px] md:w-[500px] px-5'
                  />
                  <button
                    onClick={() => handleSave('lastName')}
                    disabled={saving === 'lastName'}
                    className='bg-primary-600 text-white p-2 lg:px-10 px-5 rounded-md font-roboto uppercase disabled:opacity-50'
                  >
                    {saving === 'lastName' ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
              <hr className='w-full border-t border-primary-700 mb-6 mt-5' />

              {/* Email */}
              <div className='flex lg:flex-row md:flex-row flex-col gap-3 lg:gap-10 mt-6 lg:justify-start lg:items-center'>
                <p className='text-primary-600 font-bold font-roboto lg:text-xl text-xl'>Email:</p>
                <div className='flex flex-row gap-3 lg:gap-5 lg:ml-12 md:ml-12'>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='example@gmail.com'
                    className='border border-primary-600 rounded-md bg-primary-700 text-primary-600 w-[300px] lg:w-[500px] md:w-[500px] px-5'
                  />
                  <button
                    onClick={() => handleSave('email')}
                    disabled={saving === 'email'}
                    className='bg-primary-600 text-white p-2 lg:px-10 px-5 rounded-md font-roboto uppercase disabled:opacity-50'
                  >
                    {saving === 'email' ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
              <hr className='w-full border-t border-primary-700 mb-6 mt-5' />

              {/* Change Password */}
              <div className='flex flex-row justify-start items-center gap-4'>
                <div className='hover:opacity-35 flex-row flex items-center justify-start gap-4'>
                  <img src="/changePass.png" alt="forgot icon" className='w-8 h-8' />
                  <button
                    className='text-primary-600 font-bold font-roboto text-xl'
                    onClick={() => navigate('/changePassword')}
                  >
                    Change Password
                  </button>
                </div>
              </div>
              <hr className='w-full border-t border-primary-700 mb-6 mt-5' />

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Account