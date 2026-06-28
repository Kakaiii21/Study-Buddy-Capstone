import Sidebar from '../components/Sidebar'
import BasicInfo from '../components/BasicInfo'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'

function Account() {
  const [activeTab, setActiveTab] = useState('basicinfo')
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  return (
    <div className='flex h-screen'>
      <div className='hidden lg:flex xl:flex 2xl:flex bg-gray-600 h-screen w-16'></div>
      <Sidebar />

      <div className='flex-1 flex flex-col overflow-hidden'>

        {/* Two column layout */}
        <div className='flex flex-1 overflow-hidden'>
          

          {/* Left — nav menu */}
          <div className='flex-1 overflow-auto pt-0 border-r border-gray-200'>
            <h1 className='font-roboto font-bold uppercase '>Account</h1>
            <p className='text-sm font-inter font-medium text-primary-600  tracking-widest mb-3'>Account Settings</p>
            <nav className='flex flex-col'>
              <button
                onClick={() => setActiveTab('basicinfo')}
                className={`flex items-center justify-between w-full  pr-3 py-1 text-left font-medium transition ${activeTab === 'basicinfo' ? 'bg-primary-700 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className='flex items-center gap-3  pl-10'>
                  <img src='/basicInfo.png' alt='Profleicon' className='w-9 h-9 object-cover border' />
                  <span className='font-inter text-lg font-medium text-primary-600' >Basic Info</span>
                </div>
                <img src="./arrowA.png" alt="nextArrow " className='w-2' />              
              </button>
            <hr className=' border-t border-gray-400  ml-10' />

              <button
                onClick={() => navigate('/changePassword')}
                className={`flex items-center justify-between w-full  pr-3 py-1 text-left font-medium transition ${activeTab === 'basicinfo' ? 'bg-white text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              
                <div className='flex items-center gap-3  pl-10'>
                  <img src='/passIcon.png' alt='Profleicon' className='w-9 h-9 object-cover border'  />
                  <span className='font-inter text-lg font-medium text-primary-600' >Password</span>
                </div>
               <img src="./arrowA.png" alt="nextArrow " className='w-2' />              
              </button>
            <hr className=' border-t border-gray-400 mb-6 ml-10' />

              <button
                onClick={() => navigate('/terms')}
                className='flex items-center justify-between px-4 py-3 rounded-lg text-left font-medium text-gray-600 hover:bg-gray-50 transition'
              >
                <div className='flex items-center gap-3'>
                  <img src='/terms.png'  alt='Profleicon' className='w-5 h-5' />
                  <span>Terms of Service</span>
                </div>
                <span>›</span>
              </button>

              <button
                onClick={() => navigate('/privacy')}
                className='flex items-center justify-between px-4 py-3 rounded-lg text-left font-medium text-gray-600 hover:bg-gray-50 transition'
              >
                <div className='flex items-center gap-3'>
                  <img src='/privacy.png' alt='Profleicon' className='w-5 h-5' />
                  <span>Privacy Policy</span>
                </div>
                <span>›</span>
              </button>

              <button
                onClick={handleLogout}
                className='flex items-center justify-between px-4 py-3 rounded-lg text-left font-medium text-red-500 hover:bg-red-50 transition mt-2'
              >
                <div className='flex items-center gap-3'>
                  <img src='/logout.png' alt='Profleicon' className='w-5 h-5' />
                  <span>Log out</span>
                </div>
                <span>›</span>
              </button>
            </nav>
          </div>

          {/* Right — BasicInfo */}
          <div className='flex-[3] overflow-auto p-8 pt-0'>
            <BasicInfo />
          </div>

        </div>
      </div>
    </div>
  )
}

export default Account