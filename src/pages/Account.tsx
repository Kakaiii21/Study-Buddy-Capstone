import Sidebar from '../components/Sidebar'
import BasicInfo from '../components/BasicInfo'
import { useState } from 'react'
import Terms from '../terms'
import Privacy from '../privacy'
import ChangePassword from './ChangePassword'

function Account() {
  const [activeTab, setActiveTab] = useState('basicinfo')

  return (
    <div className='flex h-screen'>
      <div className='hidden lg:flex bg-gray-600 h-screen w-16'></div>
      <Sidebar />

      <div className='flex-1 flex flex-col overflow-hidden'>

        <div className='flex flex-1 overflow-hidden flex-col lg:flex-row'>

          {/* Left — nav menu, HIDDEN on mobile/tablet */}
          <div className='hidden lg:flex lg:flex-1 flex-col overflow-auto pt-0 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.15)] relative z-10'>
            <h1 className='font-roboto font-bold uppercase text-[40px] pl-7'>Account</h1>
            <p className='text-sm font-inter font-medium text-primary-600 pl-10 tracking-widest mb-5'>Account Settings</p>

            <nav className='flex flex-col'>
              <button
                onClick={() => setActiveTab('basicinfo')}
                className={`flex items-center justify-between w-full pr-3 py-3 text-left font-medium transition ${activeTab === 'basicinfo' ? 'bg-primary-700 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className='flex items-center gap-3 pl-10'>
                  <img src='/basicInfo.png' alt='Profleicon' className='w-10 h-10 object-cover' />
                  <span className='font-inter text-lg font-medium text-primary-600'>Basic Info</span>
                </div>
                <img src="./arrowA.png" alt="nextArrow" className='w-2' />
              </button>
              <hr className='border-t border-gray-400 ml-10' />

              <button
                onClick={() => setActiveTab('password')}
                className={`flex items-center justify-between w-full pr-3 py-3 text-left font-medium transition ${activeTab === 'password' ? 'bg-primary-700 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className='flex items-center gap-3 pl-10'>
                  <img src='/passIcon.png' alt='Profleicon' className='w-9 h-9 object-cover' />
                  <span className='font-inter text-lg font-medium text-primary-600'>Password</span>
                </div>
                <img src="./arrowA.png" alt="nextArrow" className='w-2' />
              </button>
              <div className="relative ml-10 h-px bg-gray-400">
                <div className="absolute right-0 top-1/2 h-2 w-10 -translate-y-1/2 bg-gray-400 blur-md opacity-50"></div>
              </div>

              <button
                onClick={() => setActiveTab('terms')}
                className={`flex items-center justify-between w-full pr-3 py-3 text-left font-medium transition ${activeTab === 'terms' ? 'bg-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className='flex items-center gap-3 pl-10'>
                  <img src='/tos.png' alt='Termsicon' className='w-8 h-8 object-cover' />
                  <span className='font-inter text-lg font-medium text-primary-600'>Terms of Service</span>
                </div>
                <img src="./arrowA.png" alt="nextArrow" className='w-2' />
              </button>
              <hr className='border-t border-gray-400 ml-10' />

              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center justify-between w-full pr-3 py-3 text-left font-medium transition ${activeTab === 'privacy' ? 'bg-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className='flex items-center gap-3 pl-10'>
                  <img src='/pp.png' alt='Privacyicon' className='w-8 h-8 object-cover' />
                  <span className='font-inter text-lg font-medium text-primary-600'>Privacy Policy</span>
                </div>
                <img src="./arrowA.png" alt="nextArrow" className='w-2' />
              </button>
              <hr className='border-t border-gray-400 ml-10' />
            </nav>
          </div>

          {/* Right Panel */}
          <div className='flex-1 lg:flex-[3] overflow-auto mt-16 lg:mt-0 xl:mt-0 2xl:mt-0 p-4 lg:p-8 pt-0 pb-20 lg:pb-0'>
            {activeTab === 'basicinfo' && <BasicInfo />}
            {activeTab === 'password' && <ChangePassword />}
            {activeTab === 'terms' && <Terms />}
            {activeTab === 'privacy' && <Privacy />}
          </div>

        </div>
      </div>

      {/* Bottom nav — ONLY on mobile/tablet */}
<div className='lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.08)] z-20'>
    <div className='flex items-stretch justify-around px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]'>

    <button
      onClick={() => setActiveTab('basicinfo')}
      className='flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-xl transition-colors duration-200'
    >
      <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 ${activeTab === 'basicinfo' ? 'bg-primary-0' : ''}`}>
        <img src='/basicInfo.png' alt='Basic Info' className={`w-7 h-7 object-contain transition-opacity duration-200 ${activeTab === 'basicinfo' ? 'opacity-100' : 'opacity-40'}`} />
      </div>
      <span className={`text-[10px] font-inter leading-none transition-colors duration-200 ${activeTab === 'basicinfo' ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
        Basic Info
      </span>
    </button>

    <button
      onClick={() => setActiveTab('password')}
      className='flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-xl transition-colors duration-200'
    >
      <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 ${activeTab === 'password' ? 'bg-primary-0' : ''}`}>
        <img src='/passIcon.png' alt='Password' className={`w-7 h-7 object-contain transition-opacity duration-200 ${activeTab === 'password' ? 'opacity-100' : 'opacity-40'}`} />
      </div>
      <span className={`text-[10px] font-inter leading-none transition-colors duration-200 ${activeTab === 'password' ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
        Password
      </span>
    </button>

    <button
      onClick={() => setActiveTab('terms')}
      className='flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-xl transition-colors duration-200'
    >
      <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 ${activeTab === 'terms' ? 'bg-primary-0' : ''}`}>
        <img src='/tos.png' alt='Terms' className={`w-7 h-7 object-contain transition-opacity duration-200 ${activeTab === 'terms' ? 'opacity-100' : 'opacity-40'}`} />
      </div>
      <span className={`text-[10px] font-inter leading-none transition-colors duration-200 ${activeTab === 'terms' ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
        Terms
      </span>
    </button>

    <button
      onClick={() => setActiveTab('privacy')}
      className='flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-xl transition-colors duration-200'
    >
      <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 ${activeTab === 'privacy' ? 'bg-primary-0' : ''}`}>
        <img src='/pp.png' alt='Privacy' className={`w-7 h-7 object-contain transition-opacity duration-200 ${activeTab === 'privacy' ? 'opacity-100' : 'opacity-40'}`} />
      </div>
      <span className={`text-[10px] font-inter leading-none transition-colors duration-200 ${activeTab === 'privacy' ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
        Privacy
      </span>
    </button>

  </div>
</div>
    </div>
  )
}

export default Account