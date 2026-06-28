import Sidebar from '../components/Sidebar'
import BasicInfo from '../components/BasicInfo'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'
import Terms from '../terms'
import Privacy from '../privacy'
import ChangePassword from './ChangePassword'

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
            <h1 className='font-roboto font-bold uppercase pl-7 '>Account</h1>
            <p className='text-sm font-inter font-medium text-primary-600 pl-10  tracking-widest mb-5'>Account Settings</p>
            <nav className='flex flex-col'>
              <button
                onClick={() => setActiveTab('basicinfo')}
                className={`flex items-center justify-between w-full  pr-3 py-3 text-left font-medium transition ${activeTab === 'basicinfo' ? 'bg-primary-700 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className='flex items-center gap-3  pl-10'>
                  <img src='/basicInfo.png' alt='Profleicon' className='w-10 h-10 object-cover ' />
                  <span className='font-inter text-lg font-medium text-primary-600' >Basic Info</span>
                </div>
                <img src="./arrowA.png" alt="nextArrow " className='w-2' />              
              </button>
            <hr className=' border-t border-gray-400  ml-10' />

              <button
                onClick={() => setActiveTab('password')}
                className={`flex items-center justify-between w-full  pr-3 py-3 text-left font-medium transition ${activeTab === 'password' ? 'bg-primary-700 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              
                <div className='flex items-center gap-3  pl-10'>
                  <img src='/passIcon.png' alt='Profleicon' className='w-9 h-9 object-cover '  />
                  <span className='font-inter text-lg font-medium text-primary-600' >Password</span>
                </div>
               <img src="./arrowA.png" alt="nextArrow " className='w-2' />              
              </button>
            <hr className=' border-t border-gray-400  ml-10' />

            <button
              onClick={() => setActiveTab('terms')}
              className={`flex items-center justify-between w-full pr-3 py-3 text-left font-medium transition ${activeTab === 'terms' ? 'bg-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <div className='flex items-center gap-3 pl-10'>
                <img src='/tos.png' alt='Termsicon' className='w-8 h-8 object-cover ' />
                <span className='font-inter text-lg font-medium text-primary-600'>Terms of Service</span>
              </div>
              <img src="./arrowA.png" alt="nextArrow" className='w-2' />
            </button>
            <hr className='border-t border-gray-400 ml-10' />

            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center justify-between w-full pr-3 py-3 text-left font-medium transition ${activeTab === 'privacy' ? 'bg-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <div className='flex items-center gap-3 pl-10'>
                <img src='/pp.png' alt='Privacyicon' className='w-8 h-8 object-cover ' />
                <span className='font-inter text-lg font-medium text-primary-600'>Privacy Policy</span>
              </div>
              <img src="./arrowA.png" alt="nextArrow" className='w-2' />
            </button>
            <hr className='border-t border-gray-400 ml-10' />

            <button
              onClick={handleLogout}
              className='flex items-center justify-between w-full pr-3 py-3 text-left font-medium transition text-gray-600 hover:bg-red-50 mt-2'>
              <div className='flex items-center gap-3 pl-10'>
                <img src='/logoutIcon.png' alt='Logouticon' className='w-9 h-9 object-cover ' />
                <span className='font-inter text-lg font-medium text-red-500'>Log out</span>
              </div>
              <img src="./arrowA.png" alt="nextArrow" className='w-2' />
            </button>
            </nav>
          </div>

          {/* Right Panel */}
          <div className='flex-[3] overflow-auto p-8 pt-0'>
            {activeTab === 'basicinfo' && <BasicInfo />}
            {activeTab === 'password' && <ChangePassword />}
            {activeTab === 'terms' && <Terms />}
            {activeTab === 'privacy' && <Privacy />}
          </div>

        </div>
      </div>
    </div>
  )
}

export default Account