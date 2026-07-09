import Sidebar from '../components/Sidebar'
import { useState ,useEffect , useRef} from 'react'
import BasicInfo from '../components/BasicInfo'
import Terms from '../terms'
import Privacy from '../privacy'
import ChangeEmail from './ChangeEmail' 
import ChangePassword from './ChangePassword'
import { Player, } from '@lordicon/react'


import { useAuth } from '../hooks/useAuth'
import { useTour } from '../hooks/useTour'

function Account() {
  const { user } = useAuth()
  const [tourActive, setTourActive] = useState(false)

const { startTour } = useTour(
  'account',
  false,
  () => {}, () => {}, () => {}, () => {},
  user,
  () => setTourActive(false)
)
  const [activeTab, setActiveTab] = useState('basicinfo')
  const playerRef = useRef<Player>(null);
  const [iconData, setIconData] = useState<object | null>(null);


  useEffect(() => {
    fetch('/assets/icons/profile.json')
      .then(res => res.json())
      .then(setIconData);
  }, []);


  return (
    <div className='flex h-screen'>
      <div className='p-3 '>
      <Sidebar />        
      </div>

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
    id='navBasicInfo'
      onMouseEnter={() => {
      playerRef.current?.playFromBeginning();
      }}
      onClick={() => setActiveTab('basicinfo')}
      className={`flex items-center justify-between w-full pr-3 py-2.5 xl:py-3 2xl:py-4 text-left font-medium transition ${(activeTab === 'basicinfo' || activeTab === 'changeEmail') ? 'bg-primary-700 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
      <div className='flex items-center gap-2.5 xl:gap-3 2xl:gap-4 pl-9 xl:pl-10 2xl:pl-11'>
      <div className='flex md:hidden'>
        {iconData && (
          <Player
            ref={playerRef}
            icon={iconData}
            size={30}
          />
        )}
      </div>
      <div className='flex md:flex lg:flex xl:flex 2xl:flex'>
        {iconData && (
          <Player
            ref={playerRef}
            icon={iconData}
            size={45}
          />
        )}
      </div>
        <span className='font-inter text-base xl:text-lg 2xl:text-xl font-medium text-primary-600'>Basic Info</span>
      </div>
      <img src="./arrowA.png" alt="nextArrow" className='w-2 xl:w-2.5 2xl:w-3' />
    </button>
    <hr className='border-t border-gray-400 ml-9 xl:ml-10 2xl:ml-11' />

    <button
    id='navPassword'
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
    id='navTerms'
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
    id='navPrivacy'
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
          <div  className='flex-1 lg:flex-[3] overflow-auto mt-16 lg:mt-0 xl:mt-0 2xl:mt-0 p-4 lg:p-8 pt-0 pb-20 lg:pb-0'>
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
    id='mobileNavBasicInfo'
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
    id='mobileNavPassword'
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
    id='mobileNavTerms'
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
   id='mobileNavPrivacy'
      onClick={() => setActiveTab('privacy')}
      className='flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-xl transition-colors duration-200'
    >
      <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 ${activeTab === 'privacy' ? 'bg-primary-0' : ''}`}>
        <img   src='/pp.png' alt='Privacy' className={`w-7 h-7 object-contain transition-opacity duration-200 ${activeTab === 'privacy' ? 'opacity-100' : 'opacity-40'}`} />
      </div>
      <span className={`text-[10px] font-inter leading-none transition-colors duration-200 ${activeTab === 'privacy' ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
        Privacy
      </span>
    </button>

  </div>
</div>
<button
  id='tour-btn'
  onClick={() => { setTourActive(true); startTour() }}
  className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-6 z-50 flex flex-col items-center gap-1 hover:opacity-80 active:scale-95 transition-all lg:bottom-8 lg:right-8 ${tourActive ? 'hidden' : ''}`}
  title='Take a Tour'
>
  <div className='bg-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl font-bold'>
    <img src="/needhelp.png" alt="?" className='w-12 block mx-auto mt-1' />
  </div>
  <p className='text-xs text-primary-600 font-inter font-medium'>Need Help?</p>
</button>
    </div>
  )
}

export default Account