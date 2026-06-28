import Sidebar from '../components/Sidebar'
import BasicInfo from '../components/BasicInfo'
import { useState } from 'react'
import Terms from '../terms'
import Privacy from '../privacy'
import ChangeEmail from './ChangeEmail' 
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
  <h1 className='font-roboto font-bold uppercase text-[32px] xl:text-[36px] 2xl:text-[40px] pl-6 xl:pl-7 2xl:pl-8'>
    Account
  </h1>
  <p className='text-xs xl:text-sm 2xl:text-base font-inter font-medium text-primary-600 pl-9 xl:pl-10 2xl:pl-11 tracking-widest mb-4 xl:mb-5 2xl:mb-6'>
    Account Settings
  </p>

  <nav className='flex flex-col'>
    <button
      onClick={() => setActiveTab('basicinfo')}
      className={`flex items-center justify-between w-full pr-3 py-2.5 xl:py-3 2xl:py-4 text-left font-medium transition ${(activeTab === 'basicinfo' || activeTab === 'changeEmail') ? 'bg-primary-700 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
      <div className='flex items-center gap-2.5 xl:gap-3 2xl:gap-4 pl-9 xl:pl-10 2xl:pl-11'>
        <img src='/basicInfo.png' alt='Profleicon' className='w-8 h-8 xl:w-10 xl:h-10 2xl:w-11 2xl:h-11 object-cover' />
        <span className='font-inter text-base xl:text-lg 2xl:text-xl font-medium text-primary-600'>Basic Info</span>
      </div>
      <img src="./arrowA.png" alt="nextArrow" className='w-2 xl:w-2.5 2xl:w-3' />
    </button>
    <hr className='border-t border-gray-400 ml-9 xl:ml-10 2xl:ml-11' />

    <button
      onClick={() => setActiveTab('password')}
      className={`flex items-center justify-between w-full pr-3 py-2.5 xl:py-3 2xl:py-4 text-left font-medium transition ${activeTab === 'password' ? 'bg-primary-700 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
      <div className='flex items-center gap-2.5 xl:gap-3 2xl:gap-4 pl-9 xl:pl-10 2xl:pl-11'>
        <img src='/passIcon.png' alt='Profleicon' className='w-7 h-7 xl:w-9 xl:h-9 2xl:w-10 2xl:h-10 object-cover' />
        <span className='font-inter text-base xl:text-lg 2xl:text-xl font-medium text-primary-600'>Password</span>
      </div>
      <img src="./arrowA.png" alt="nextArrow" className='w-2 xl:w-2.5 2xl:w-3' />
    </button>
    <div className="relative ml-9 xl:ml-10 2xl:ml-11 h-px bg-gray-400">
      <div className="absolute right-0 top-1/2 h-2 w-10 -translate-y-1/2 bg-gray-400 blur-md opacity-50"></div>
    </div>

<button
  onClick={() => setActiveTab('terms')}
  className={`flex items-center justify-between w-full pr-3 py-2.5 xl:py-3 2xl:py-4 text-left font-medium transition ${activeTab === 'terms' ? 'bg-primary-700 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
  <div className='flex items-center gap-2.5 xl:gap-3 2xl:gap-4 pl-9 xl:pl-10 2xl:pl-11'>
    <img src='/tos.png' alt='Termsicon' className='w-6 h-6 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9 object-cover' />
    <span className='font-inter text-base xl:text-lg 2xl:text-xl font-medium text-primary-600'>Terms of Service</span>
  </div>
  <img src="./arrowA.png" alt="nextArrow" className='w-2 xl:w-2.5 2xl:w-3' />
</button>
<hr className='border-t border-gray-400 ml-9 xl:ml-10 2xl:ml-11' />

<button
  onClick={() => setActiveTab('privacy')}
  className={`flex items-center justify-between w-full pr-3 py-2.5 xl:py-3 2xl:py-4 text-left font-medium transition ${activeTab === 'privacy' ? 'bg-primary-700 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
  <div className='flex items-center gap-2.5 xl:gap-3 2xl:gap-4 pl-9 xl:pl-10 2xl:pl-11'>
    <img src='/pp.png' alt='Privacyicon' className='w-6 h-6 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9 object-cover' />
    <span className='font-inter text-base xl:text-lg 2xl:text-xl font-medium text-primary-600'>Privacy Policy</span>
  </div>
  <img src="./arrowA.png" alt="nextArrow" className='w-2 xl:w-2.5 2xl:w-3' />
</button>
<hr className='border-t border-gray-400 ml-9 xl:ml-10 2xl:ml-11' />
  </nav>
</div>
          {/* Right Panel */}
          <div className='flex-1 lg:flex-[3] overflow-auto mt-16 lg:mt-0 xl:mt-0 2xl:mt-0 p-4 lg:p-8 pt-0 pb-20 lg:pb-0'>
            {activeTab === 'basicinfo' && <BasicInfo setActiveTab={setActiveTab} />}
            {activeTab === 'changeEmail' && <ChangeEmail setActiveTab={setActiveTab} />}
            {activeTab === 'password' && <ChangePassword />}
              {activeTab === 'terms' && <Terms hideButton={true} />}
              {activeTab === 'privacy' && <Privacy hideButton={true} />}
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
      <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 ${(activeTab === 'basicinfo' || activeTab === 'changeEmail') ? 'bg-primary-0' : ''}`}>
        <img src='/basicInfo.png' alt='Basic Info' className={`w-7 h-7 object-contain transition-opacity duration-200 ${(activeTab === 'basicinfo' || activeTab === 'changeEmail') ? 'opacity-100' : 'opacity-40'}`} />
      </div>
      <span className={`text-[10px] font-inter leading-none transition-colors duration-200 ${(activeTab === 'basicinfo' || activeTab === 'changeEmail') ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
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