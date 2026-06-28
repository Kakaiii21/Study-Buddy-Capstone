import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { uploadToCloudinary } from '../services/cloudinary'
import { auth } from '../services/firebase'

function BasicInfo() {
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

  // ─── Mask email: only show first letter ──────────────────────────────────
  const maskEmail = (em: string) => {
    if (!em) return ''
    const [local, domain] = em.split('@')
    return `${local[0]}${'•'.repeat(Math.max(local.length - 1, 3))}@${domain}`
  }

  // ─── Load user data from Firestore ───────────────────────────────────────
useEffect(() => {
  if (!user) return
  const fetchUser = async () => {
    const cacheKey = `user_${user.uid}`
    const cached = sessionStorage.getItem(cacheKey)

    if (cached) {
      const data = JSON.parse(cached)
      setFirstName(data.firstName || '')
      setLastName(data.lastName || '')
      setProfilePic(data.photoURL || '/profile.png')
      setEmail(data.email || user.email || '')
      return  // ✅ use cache — no delay
    }

    await user.reload()
    const docSnap = await getDoc(doc(db, 'users', user.uid))
    if (docSnap.exists()) {
      const data = docSnap.data()
      setFirstName(data.firstName || '')
      setLastName(data.lastName || '')
      setProfilePic(data.photoURL || '/profile.png')
      const authEmail = auth.currentUser?.email
      if (data.pendingEmail && authEmail === data.pendingEmail) {
        await updateDoc(doc(db, 'users', user.uid), {
          email: data.pendingEmail,
          pendingEmail: null
        })
        const updated = { ...data, email: data.pendingEmail, pendingEmail: null }
        sessionStorage.setItem(cacheKey, JSON.stringify(updated))
        setEmail(data.pendingEmail)
        showToast('Email updated successfully!')
      } else {
        sessionStorage.setItem(cacheKey, JSON.stringify(data))
        setEmail(data.email || user.email || '')
      }
    }
  }
  fetchUser()
}, [user])

  const handleSave = async (field: 'firstName' | 'lastName') => {
    if (!user) return
    setSaving(field)
    try {
      const value = field === 'firstName' ? firstName : lastName
      await updateDoc(doc(db, 'users', user.uid), { [field]: value })

      const cacheKey = `user_${user.uid}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        sessionStorage.setItem(cacheKey, JSON.stringify({ ...JSON.parse(cached), [field]: value }))
      } 

      const label = field === 'firstName' ? 'First name' : 'Last name'
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
        const userSnap = await getDoc(doc(db, 'users', user.uid))
        const oldPublicId = userSnap.data()?.photoPublicId ?? null

        const result = await uploadToCloudinary(file, undefined, user.uid)
        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: result.url,
          photoPublicId: result.publicId
        })
        setProfilePic(result.url)
        sessionStorage.setItem('profilePic', result.url)  // ← for dashboard/sidebar
        window.dispatchEvent(new Event('profilePicUpdated'))  // ← add this

        const cacheKey = `user_${user.uid}`
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          sessionStorage.setItem(cacheKey, JSON.stringify({ ...JSON.parse(cached), photoURL: result.url, photoPublicId: result.publicId }))
        }

    // Delete old profile pic from Cloudinary if it exists
    if (oldPublicId) {
      await fetch('https://us-central1-study-buddy-cbaa8.cloudfunctions.net/deleteCloudinaryAsset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: oldPublicId, resourceType: 'image' }),
      }).catch((err) => console.warn('Old profile pic delete failed:', err))
    }

    showToast('Profile picture updated successfully!')
  } catch (err) {
    console.error('Profile picture upload failed:', err)
    showToast('Failed to upload picture. Please try again.')
  } finally {
    setUploading(false)
  }
}

const handleRemoveProfilePic = async () => {
  if (!user) return
  try {
    const userSnap = await getDoc(doc(db, 'users', user.uid))
    const oldPublicId = userSnap.data()?.photoPublicId ?? null

    await updateDoc(doc(db, 'users', user.uid), {
      photoURL: null,
      photoPublicId: null
    })

    setProfilePic('/profile.png')
    sessionStorage.setItem('profilePic', '/profile.png')
    window.dispatchEvent(new Event('profilePicUpdated'))

    const cacheKey = `user_${user.uid}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      sessionStorage.setItem(cacheKey, JSON.stringify({ ...JSON.parse(cached), photoURL: null, photoPublicId: null }))
    }

    if (oldPublicId) {
      await fetch('https://us-central1-study-buddy-cbaa8.cloudfunctions.net/deleteCloudinaryAsset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: oldPublicId, resourceType: 'image' }),
      }).catch((err) => console.warn('Old profile pic delete failed:', err))
    }

    showToast('Profile picture removed.')
  } catch (err) {
    console.error('Failed to remove profile picture:', err)
    showToast('Failed to remove picture. Please try again.')
  }
}
return (
  <>
    <style>{`
      .upload-loader {
        width: fit-content;
        font-size: 40px;
        font-family: system-ui, sans-serif;
        font-weight: bold;
        text-transform: uppercase;
        color: #0000;
        -webkit-text-stroke: 1px #fff;
        background:
          radial-gradient(0.71em at 50% 1em, #fff 99%, #0000 101%) calc(50% - 1em) 1em/2em 200% repeat-x text,
          radial-gradient(0.71em at 50% -0.5em, #0000 99%, #fff 101%) 50% 1.5em/2em 200% repeat-x text;
        animation: l10-0 .8s linear infinite alternate, l10-1 4s linear infinite;
      }
      .upload-loader:before { content: "Loading"; }
      @keyframes l10-0 { to { background-position-x: 50%, calc(50% + 1em); } }
      @keyframes l10-1 { to { background-position-y: -.5em, 0; } }
    `}</style>

    {uploading && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="upload-loader" />
      </div>
    )}

    {toast && (
      <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary-600 text-white px-6 py-3 rounded-xl shadow-lg font-inter text-sm transition-all'>
        {toast}
      </div>
    )}

    <div className='w-full px-4 md:px-16 lg:px-24 xl:px-40 py-6'>

      {/* Title */}
      <h1 className='text-primary-600 font-semibold font-inter text-xl md:text-2xl lg:text-[28px] xl:text-[30px] mb-4 md:mb-6'>Basic Info</h1>
      <p className='text-primary-600 font-inter text-sm md:text-[15px] xl:text-[16px] w-28 shrink-0'>Profile Picture</p>

      {/* Profile Picture */}
      <div className='flex flex-row items-center justify-center gap-6 mb-6'>
        <div className='flex flex-col items-center gap-1'>
          <div className='relative w-fit'>
            <button
              aria-label="change profile picture"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="relative rounded-full overflow-hidden group disabled:opacity-40"
            >
              <img
                src={profilePic}
                alt="Profile"
                className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 2xl:w-36 2xl:h-36 border-2 border-primary-600 group-hover:opacity-70 rounded-full object-cover transition-opacity ${uploading ? 'opacity-40' : 'opacity-100'}`}
              />
              <div className='absolute bottom-0 left-0 right-0 h-1/4 flex items-end justify-center pb-1 transition-opacity rounded-b-full'>
                <img src="/profileAdd.png" alt="camera" className="w-6 h-6 md:w-7 md:h-7" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              aria-label='img'
              type="file"
              accept="image/png, image/jpg, image/jpeg"
              className="hidden"
              onChange={handleProfilePicChange}
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className='text-primary-600 text-xs md:text-sm font-inter font-medium hover:underline'
          >
            Upload a new photo.
          </button>
          <button
            onClick={handleRemoveProfilePic}
            className='text-red-500 text-xs md:text-sm font-inter hover:underline'
          >
            Remove
          </button>
        </div>
      </div>

      <hr className='border-t border-gray-300 mb-4 md:mb-6' />

      {/* First Name */}
      <div className='flex flex-col gap-1 mb-3 md:mb-4'>
        <label className='text-primary-600 font-inter text-sm md:text-md'>First Name</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder='First name'
          className='border border-gray-300 rounded-md bg-gray-50 text-primary-600 w-full px-4 py-2 focus:outline-none focus:border-primary-600 text-sm md:text-base'
        />
      </div>

      {/* Last Name */}
      <div className='flex flex-col gap-1 mb-3 md:mb-4'>
        <label className='text-primary-600 font-inter text-sm md:text-md'>Last Name</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder='Last name'
          className='border border-gray-300 rounded-md bg-gray-50 text-primary-600 w-full px-4 py-2 focus:outline-none focus:border-primary-600 text-sm md:text-base'
        />
      </div>

      {/* Email */}
      <div className='flex flex-col gap-1 mb-4 md:mb-6'>
        <label className='text-primary-600 font-inter text-sm md:text-md'>Email</label>
        <input
          aria-label='Email'
          type="text"
          value={maskEmail(email)}
          readOnly
          className='border border-gray-300 rounded-md bg-gray-50 text-primary-600 w-full px-4 py-2 cursor-not-allowed opacity-70 text-sm md:text-base'
        />
      </div>

      {/* Save Changes */}
      <div className='flex justify-center'>
        <button
          onClick={() => { handleSave('firstName'); handleSave('lastName') }}
          disabled={saving !== null}
          className='w-full md:w-[400px] items-center justify-center text-black flex bg-[#E59D24] hover:bg-[#F0AD3A] transition-all duration-300 font-inter font-semibold uppercase py-3 
          disabled:opacity-50
          shadow-[0_2px_1px_rgba(0,0,0,0.35)]
          rounded-md backdrop-blur-xs
          hover:-translate-y-1 hover:shadow-[0_4px_8px_rgba(0,0,0,0.35)]'
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

    </div>
  </>
)
}

export default BasicInfo