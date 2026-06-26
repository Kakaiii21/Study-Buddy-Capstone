import { useRef, useState } from 'react'
import Signup from './components/Signup'
import Login from './components/Login'
import { useInstallPWA } from './hooks/useInstallPWA'



function App() {
  const [activeForm, setActiveForm] = useState<'signup' | 'login'>('signup')

  const signupRef = useRef<HTMLDivElement>(null)


  const { isInstallable, installApp, isMacSafari} = useInstallPWA();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showMacModal, setShowMacModal] = useState(false);

  const downloadRef = useRef<HTMLElement>(null)

  return (
  <>
    <section className="h-screen w-screen">
      <nav className=" px-6 py-2 flex items-center justify-between ">
        {/* LOGO */}
        <img src="./logo.png" alt="logo" className="pl-5 h-16 w-auto" />

        {/* NAV LINKS */}
        <div className="flex items-center gap-4 md:gap-4 lg:gap-5 xl:gap-6 2xl:gap-20  
        md:mr-18
        lg:mr-20
        xl:mr-20
        2xl:mr-20">
          <button className='text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg px-4  uppercase
          hover:text-white transition-all duration-300 py-1 hover:bg-primary-600 rounded-full'>
            Policies
          </button>
          <button className='text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg uppercase
          hover:text-white transition-all duration-300 py-1 hover:bg-primary-600 rounded-full px-4'>
            About Us
          </button>
          <button onClick={() => {
              setActiveForm('signup')
              setTimeout(() => {
                signupRef.current?.scrollIntoView({ behavior: 'smooth' })
              }, 50)
            }}
            className='text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg uppercase
            hover:text-white transition-all duration-300 py-1 hover:bg-primary-600 rounded-full px-4'>      
            Sign Up
          </button>
          <p className='text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg uppercase'>|</p>
          <button 
                onClick={() => {
                  setActiveForm('login')
                  setTimeout(() => {
                    signupRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }, 0)
                }}
            className='text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg uppercase
            hover:text-white transition-all duration-300 py-1 hover:bg-primary-600 rounded-full px-4'>
            Log In
          </button>
        </div>
      </nav>
      <div className='flex px-0 xl:px-18 2xl:px-32  flex-row justify-evenly'>
        <div className='flex flex-col w-full lg:h-screen md:h-auto  xl:h-screen 2xl:h-screen  justify-start items-start 
        md:px-12 md:pt-12 
        lg:px-20 lg:pt-16 
        xl:px-32 xl:pt-20 
        2xl:px-34 2xl:pt-24'>
          <p className='text-primary-600 font-inter font-extrabold 
          md:text-[35px]
          lg:text-[45px]
          xl:text-[55px]
          2xl:text-[65px] 
          uppercase '
          >start your day by being productive.</p>
          <p className='text-primary-600 font-fustat font-medium 
          md:text-[10px] md:pr-0 md:mt-4
          lg:text-[12px] lg:pr-0 lg:mt-4
          xl:text-[14px] xl:pr-0 xl:mt-4
          2xl:text-[18px] 2xl:pr-0 '
          >Study Buddy is a web-based learning support application designed to help students manage their study time, improve focus, and enhance learning efficiency.</p>
          <button 
          onClick={() => downloadRef.current?.scrollIntoView({ behavior: 'smooth'})}
          className='flex flex-row mt-5 justify-center items-center gap-4 py-3 px-5 text-white uppercase font-fustat font-bold text-xl bg-primary-600 rounded-full 
          hover:opacity-90   
          backdrop-blur-xs
          hover:-translate-y-1 hover:shadow-[0_8px_10px_rgba(0,0,0,0.5)]
          transition-all duration-300'>
            Download
            <img src="./downA.png" alt="Download" className='w-4 h-6' />
          </button>

        </div>
        <div className='flex flex-col w-full h-screen justify-start items-center   2xl:pt-18 '>
            <img src="./landImg.png" alt="landing img" 
            className=' w-[150px] h-[100px] 
            md:min-w-[350px] md:min-h-[380px] md:pt-12
            lg:min-w-[350px] lg:min-h-[380px] lg:pt-14
            xl:min-w-[400px] xl:min-h-[450px] xl:pt-16
            2xl:min-w-[550px] 2xl:min-h-[580px] object-center' />
        </div>

      </div>
    </section>
    {/*First*/}
    <section className='min-h-screen  '>
      <div className='flex flex-col  md:px-10 px-56 xl:px-[180px]  2xl:px-[250px] 0 mb-10'>
        <p className='flex justify-center items-center font-fustat text-primary-600  text-2xl md:text-lg 2xl:text-2xl mb-20'>
          Your all-in-one study companion{' '}<b>— plan, organize,</b>{' '}and{' '}<b>{' '}learn smarter.{' '}</b>
        </p>
        <div className='flex flex-row gap-x-10 justify-start items-center lg:bg-pink-600 xl:bg-blue-600 2xl:bg-green-600'>
          <img src="./assets/sTimer.png" alt="Timergif" className='w-[250px] h-[250px] md:w-[150px] md:h-[150px] 
          xl:w-[130px] xl:h-[130px] 
          2xl:w-[250px] 2xl:h-[250px]' />
          <div className='text-primary-600 font-inter'>
            <p className='font-bold text-[54px] md:text-[34px] 2xl:text-[54px] '>Study Timer</p>
            <p className='text-[18px] md:text-[14px] 2xl:text-[18px]'>Track how much time you actually spend studying.</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px] '>Start the timer whenever you sit down to work,</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px] '>and watch your study hours add up.</p>
          </div>
        </div>

        <div className='flex flex-row gap-4 justify-end items-center  '>
          <div className='text-right text-primary-600 font-inter'>
             <p className='font-bold text-[54px] md:text-[34px] 2xl:text-[54px]'>To Do List</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>Keep track of everything you need to get done.</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>Add, check off, and manage your tasks so </p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>nothing slips through the cracks.</p>
          </div>
          <img src="./assets/todolist.png" alt="Todo list gif" className='w-[250px] h-[250px] md:w-[150px] md:h-[150px] 
          xl:w-[140px] xl:h-[140px] 
          2xl:w-[250px] 2xl:h-[250px]' />

        </div>
      </div>

    {/*Second*/}
      <div className='flex flex-col  md:px-10 px-56 xl:px-[180px] 2xl:px-[250px] 0 mb-10'>
        <div className='flex flex-row gap-x-10 justify-start items-center'>
          <img src="./assets/notes.png" alt="Notesgif" className='w-[250px] h-[250px] 
          md:w-[150px] md:h-[150px] 
          xl:w-[130px] xl:h-[130px] 
          2xl:w-[250px] 2xl:h-[250px] ' />
          <div className='text-primary-600 font-inter'>
            <p className='font-bold text-[54px] md:text-[34px] 2xl:text-[54px]'>Notes</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>Keep all your study notes in one organized</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>place. Create, edit, and revisit your notes</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>anytime, so nothing gets lost between </p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>subjects and deadlines.</p>

          </div>
        </div>

        <div className='flex flex-row gap-4 justify-end items-center'>
          <div className='text-right text-primary-600 font-inter'>
             <p className='font-bold text-[54px] md:text-[34px] 2xl:text-[54px]'>Class Schedule</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>See your classes and study sessions at a</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>glance. Plan your week and stay on top</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>of where you need to be and when.</p>
          </div>
          <img src="./assets/classschedule.png" alt="Class Schedgif" className='w-[250px] h-[250px] md:w-[150px] md:h-[150px]  
          xl:w-[130px] xl:h-[130px] 
          2xl:w-[250px] 2xl:h-[250px]' />

        </div>
      </div>

    {/*Third*/}
      <div className='flex flex-col  md:px-10 px-56 xl:px-[180px]  2xl:px-[250px] 0 mb-10'>
        <div className='flex flex-row gap-x-10 justify-start items-center'>
          <img src="./assets/courses.png" alt="coursesgif" className='w-[250px] h-[250px] md:w-[150px] md:h-[150px]  
          xl:w-[130px] xl:h-[130px] 
          2xl:w-[250px] 2xl:h-[250px]' />
          <div className='text-primary-600 font-inter'>
            <p className='font-bold text-[54px] md:text-[34px] 2xl:text-[54px]'>Course</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>Organize your subjects and</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>materials by course. Keep </p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>everything related to each class  </p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>neatly grouped and easy to find.</p>

          </div>
        </div>

        <div className='flex flex-row gap-4 justify-end items-center'>
          <div className='text-right text-primary-600 font-inter'>
             <p className='font-bold text-[54px] md:text-[34px] 2xl:text-[54px]'>Study Generator</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>Turn your notes and files into quizzes and</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>flashcards in seconds. A smarter, faster way</p>
            <p className='text-[18px]  md:text-[14px] 2xl:text-[18px]'>to review and test what you've learned.</p>
          </div>
          <img src="./assets/classschedule.png" alt="Class Schedgif" className='w-[250px] h-[250px] md:w-[150px] md:h-[150px] 2xl:w-[250px] 
          xl:w-[130px] xl:h-[130px] 
          2xl:h-[250px]' />

        </div>
      </div>

    </section>
    <section ref={signupRef} className="min-h-screen bg-primary-600">
      {activeForm === 'signup'
        ? <Signup onSwitchToLogin={() => setActiveForm('login')} />
        : <Login onSwitchToSignup={() => setActiveForm('signup')} />
      }
    </section>
    {/* Download Section */}
    <section ref={downloadRef} className="py-10">
      <div className='flex flex-col mt-10 gap-10 justify-start items-center'>
        <p className='text-center font-fustat text-2xl font-medium text-primary-600 uppercase'>download study buddy</p>
        <p className='text-center font-fustat text-lg font-normal text-primary-600'>Get Study Buddy on any device:</p>
        <div className='flex flex-row gap-5 mt-10'>

          {/* Android */}
          <button
            className={`flex flex-col justify-start items-center group ${!isInstallable ? 'opacity-40 cursor-not-allowed' : ''}`}
            onClick={isInstallable ? installApp : undefined}
          >
            <div className='relative border rounded-2xl border-black group-hover:bg-black p-3 w-52 h-52'>
              <div className='flex items-center justify-center h-full'>
                <img src="./android.png" alt="android icon" className='w-32 mb-8 group-hover:hidden' />
                <img src="./androidH.png" alt="android icon hover" className='w-32 mb-8 hidden group-hover:block' />
              </div>
              <img src="./dlBtn.png" alt="downloadicon" className='absolute bottom-2 right-2 w-10 group-hover:hidden' />
              <img src="./dlBtnH.png" alt="downloadicon hover" className='absolute bottom-2 right-2 w-10 hidden group-hover:block' />
            </div>
            <p className='mt-3 font-fustat font-bold text-primary-600'>Android</p>
          </button>

          {/* iOS */}
          <button
            className='flex flex-col justify-start items-center group'
            onClick={() => setShowIOSModal(true)}
          >
            <div className='relative border rounded-2xl border-black group-hover:bg-black p-3 w-52 h-52'>
              <div className='flex items-center justify-center h-full'>
                <img src="./iphone.png" alt="iphone icon" className='w-24 mb-5 group-hover:hidden' />
                <img src="./iphoneH.png" alt="iphone icon hover" className='w-24 mb-5 hidden group-hover:block' />
              </div>
              <img src="./dlBtn.png" alt="downloadicon" className='absolute bottom-2 right-2 w-10 group-hover:hidden' />
              <img src="./dlBtnH.png" alt="downloadicon hover" className='absolute bottom-2 right-2 w-10 hidden group-hover:block' />
            </div>
            <p className='mt-3 font-fustat font-bold text-primary-600'>iOS</p>
          </button>

          {/* Windows */}
          <button
            className={`flex flex-col justify-start items-center group ${!isInstallable ? 'opacity-40 cursor-not-allowed' : ''}`}
            onClick={isInstallable ? installApp : undefined}
          >
            <div className='relative border rounded-2xl border-black group-hover:bg-black p-3 w-52 h-52'>
              <div className='flex items-center justify-center h-full'>
                <img src="./windows.png" alt="windows icon" className='w-24 mb-5 group-hover:hidden' />
                <img src="./windowsH.png" alt="windows icon hover" className='w-24 mb-5 hidden group-hover:block' />
              </div>
              <img src="./dlBtn.png" alt="downloadicon" className='absolute bottom-2 right-2 w-10 group-hover:hidden' />
              <img src="./dlBtnH.png" alt="downloadicon hover" className='absolute bottom-2 right-2 w-10 hidden group-hover:block' />
            </div>
            <p className='mt-3 font-fustat font-bold text-primary-600'>Windows</p>
          </button>

          {/* Mac */}
          <button
            className={`flex flex-col justify-start items-center group ${!isMacSafari && !isInstallable ? 'opacity-40 cursor-not-allowed' : ''}`}
            onClick={isMacSafari ? () => setShowMacModal(true) : isInstallable ? installApp : undefined}
          >
            <div className='relative border rounded-2xl border-black group-hover:bg-black p-3 w-52 h-52'>
              <div className='flex items-center justify-center h-full'>
                <img src="./mac.png" alt="mac icon" className='w-28 mb-5 group-hover:hidden' />
                <img src="./macH.png" alt="mac icon hover" className='w-28 mb-5 hidden group-hover:block' />
              </div>
              <img src="./dlBtn.png" alt="downloadicon" className='absolute bottom-2 right-2 w-10 group-hover:hidden' />
              <img src="./dlBtnH.png" alt="downloadicon hover" className='absolute bottom-2 right-2 w-10 hidden group-hover:block' />
            </div>
            <p className='mt-3 font-fustat font-bold text-primary-600'>MacOS</p>
          </button>

        </div>
      </div>
    </section>

    {/* iOS Modal */}
    {showIOSModal && (
      <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center' onClick={() => setShowIOSModal(false)}>
        <div className='bg-white rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-4' onClick={e => e.stopPropagation()}>
          <img src="./iphone.png" alt="iOS" className='w-16' />
          <p className='font-fustat font-bold text-primary-600 text-xl text-center'>Install on iOS</p>
          <ol className='text-primary-600 font-fustat text-sm flex flex-col gap-2 list-decimal list-inside'>
            <li>Open <strong>studybuddyph.site</strong> in Safari</li>
            <li>Tap the <strong>Share</strong> button (box with arrow)</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
            <li>Tap <strong>Add</strong> to confirm</li>
          </ol>
          <button onClick={() => setShowIOSModal(false)} className='mt-2 bg-primary-600 text-white font-fustat font-bold px-6 py-2 rounded-xl'>Got it</button>
        </div>
      </div>
    )}

    {/* Mac Safari Modal */}
    {showMacModal && (
      <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center' onClick={() => setShowMacModal(false)}>
        <div className='bg-white rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-4' onClick={e => e.stopPropagation()}>
          <img src="./mac.png" alt="macOS" className='w-16' />
          <p className='font-fustat font-bold text-primary-600 text-xl text-center'>Install on macOS Safari</p>
          <ol className='text-primary-600 font-fustat text-sm flex flex-col gap-2 list-decimal list-inside'>
            <li>Open <strong>studybuddyph.site</strong> in Safari</li>
            <li>Click <strong>File</strong> in the menu bar</li>
            <li>Select <strong>Add to Dock</strong></li>
            <li>Click <strong>Add</strong> to confirm</li>
          </ol>
          <button onClick={() => setShowMacModal(false)} className='mt-2 bg-primary-600 text-white font-fustat font-bold px-6 py-2 rounded-xl'>Got it</button>
        </div>
      </div>
    )}
    {/*Developers Section*/}
    <section className="py-10  ">
      <div className='flex flex-col mt-10 gap-2 justify-start items-start '>
        <h1 className='  text-primary-600  px-[320px] md:px-[50px] xl:px-[180px] 2xl:px-[250px] w-full font-inter font-extrabold '>Developers</h1>
        <p className='text-primary-600 font-inter px-[320px] md:px-[50px]  xl:px-[180px] 2xl:px-[250px] mb-10 font-medium'>Meet the developers of Study Buddy.</p>
        {/*Proponents*/}
        <div className='flex flex-col mt-2 gap-10 px-[500px] md:px-[50px] xl:px-[200px] 2xl:px-[450px] w-full'>
          {/*Programmer & Project Manager*/}
          <div className='flex flex-row justify-between w-full'>
            <div className='flex flex-row gap-5'>
              <img src="./profile.png" alt="Programmer" className='w-32 border border-primary-600 rounded-full'/>
              <div className='flex flex-col justify-center items-start'>
                <p className='text-primary-600 text-lg font-fustat font-extrabold uppercase'>Programmer</p>
                <p className='text-primary-600 text-md font-fustat font-medium'>Casey P. Dellamas</p>
                <p className='text-primary-600 text-md font-fustat font-medium'>dellamascasey@gmail.com</p>
              </div>
            </div>
            <div className='flex flex-row gap-5'>
              <img src="./profile.png" alt="Project Manager" className='w-32 border border-primary-600 rounded-full'/>
              <div className='flex flex-col justify-center items-start'>
                <p className='text-primary-600 text-lg font-fustat font-extrabold uppercase'>Project Manager</p>
                <p className='text-primary-600 text-md font-fustat font-medium'>Eunice Jayce F. De Vero</p>
                <p className='text-primary-600 text-md font-fustat font-medium'>eunicejayce03@gmail.com</p>
              </div>
            </div>
          </div>

          {/*QA Tester & UI designer*/}
          <div className='flex flex-row justify-between w-full'>
            <div className='flex flex-row gap-5'>
              <img src="./profile.png" alt="QA Tester" className='w-32 border border-primary-600 rounded-full'/>
              <div className='flex flex-col justify-center items-start'>
                <p className='text-primary-600 text-lg font-fustat font-extrabold uppercase'>QA Tester</p>
                <p className='text-primary-600 text-md font-fustat font-medium'>Casey P. Dellamas</p>
                <p className='text-primary-600 text-md font-fustat font-medium'>dellamascasey@gmail.com</p>
              </div>
            </div>
            <div className='flex flex-row gap-5'>
              <img src="./profile.png" alt="UI Designer" className='w-32 border border-primary-600 rounded-full'/>
              <div className='flex flex-col justify-center items-start'>
                <p className='text-primary-600 text-lg font-fustat font-extrabold uppercase'>UI Designer</p>
                <p className='text-primary-600 text-md font-fustat font-medium'>Eunice Jayce F. De Vero</p>
                <p className='text-primary-600 text-md font-fustat font-medium'>eunicejayce03@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    {/*Contact Us Section*/}
    <section className='py-10 w-screen'>
      <div className='flex flex-col items-start mt-10 gap-2 justify-start '>
        <h1 className='text-primary-600 px-[320px] md:px-[50px] xl:px-[180px] 2xl:px-[250px] w-full font-inter font-extrabold'>Contact Us!</h1>
        <p className='text-primary-600  font-inter px-[320px] md:px-[50px]  xl:px-[180px] 2xl:px-[250px] mb-10 font-medium'>
          Have questions about StudyBuddy? We'd love to hear from you — reach us at:
        </p>
        <div className='flex flex-row w-full justify-center items-center gap-20 2xl:gap-52'>
          {/*MAIL*/}
          <div className='flex flex-row justify-center items-center gap-5'>
            <div className='bg-primary-600 rounded-full border border-primary-600  w-20 h-20 
            xl:w-16 xl:h-16 items-center justify-center flex'>
              <img src="./mail.png" alt="mail icon" className='w-12 h-12 xl:w-10 xl:h-10' />
            </div>
            <p className='text-lg text-primary-600 font-fustat font-medium'>support@studybuddyph.site</p>
          </div>
          {/*Facebook*/}
          <div className='flex flex-row justify-center items-center gap-5'>
            <img src="./fb.png" alt="" className='w-[80px] h-[80px] xl:w-[65px] xl:h-[65px]  ' />
            <p className='text-lg text-primary-600 font-fustat font-medium'>support@studybuddyph.site</p>
          </div>
        </div>
      </div>
    </section>
    {/*Footer Section*/}
    <section className='bg-primary-600 mt-16'>
      <div className='flex flex-row justify-center items-center gap-52 md:gap-32 2xl:gap-x-72 px-20 md:px-6 h-[150px] md:h-auto md:py-6'>

        <div className='flex flex-col justify-center items-center gap-1'>
          <img src="./logoF.png" alt="logo" className='h-20 md:h-14' />
          <p className='text-[10px] text-white opacity-75 font-fustat font-light md:text-[8px]'>@2026 Dominican College of Tarlac, Inc.</p>
        </div>

        <div className='flex flex-col justify-center items-start gap-3'>
          <button className='hover:opacity-75 text-sm uppercase text-white font-fustat font-normal'>policies</button>
          <button className='hover:opacity-75 text-md md:text-[13px] text-white font-fustat font-medium'>Terms & Conditions</button>
          <button className='hover:opacity-75 text-md md:text-[13px] text-white font-fustat font-medium'>Privacy Policy</button>
        </div>

        <div className='flex flex-col justify-center items-start gap-3'>
          <button className='hover:opacity-75 text-sm uppercase text-white font-fustat font-normal'>DOWNLOAD</button>
          <button className='hover:opacity-75 text-md md:text-[13px] text-white font-fustat font-medium'>iOS & Android</button>
          <button className='hover:opacity-75 text-md md:text-[13px] text-white font-fustat font-medium'>Mac & Windows</button>
        </div>

        <div className='flex flex-col justify-center items-start gap-3'>
          <button className='hover:opacity-75 text-sm uppercase text-white font-fustat font-normal'>About us</button>
          <button className='hover:opacity-75 text-md md:text-[13px] text-white font-fustat font-medium'>Developers</button>
          <button className='hover:opacity-75 text-md md:text-[13px] text-white font-fustat font-medium'>Contact Us</button>
        </div>

      </div>
    </section>


  </>


    

  )
}

export default App