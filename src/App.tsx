import React from 'react'
import { useNavigate } from 'react-router-dom'
import Signup from './components/Signup'


function App() {
  const navigate = useNavigate()
  return (
  <>
    <section className="h-screen ">
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
          <button onClick={() => navigate('/signup')}
            className='text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg uppercase
            hover:text-white transition-all duration-300 py-1 hover:bg-primary-600 rounded-full px-4'>      
            Sign Up
          </button>
          <p className='text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg uppercase'>|</p>
          <button onClick={() => navigate('/login')}
            className='text-primary-600 font-fustat font-bold text-sm lg:text-base 2xl:text-lg uppercase
            hover:text-white transition-all duration-300 py-1 hover:bg-primary-600 rounded-full px-4'>
            Log In
          </button>
        </div>
      </nav>
      <div className='flex flex-row justify-evenly'>
        <div className='flex flex-col w-full lg:h-screen md:h-auto  xl:h-screen 2xl:h-screen  justify-start items-start 
        md:px-12 md:pt-12 
        lg:px-20 lg:pt-16 
        xl:px-32 xl:pt-20 
        2xl:px-34 2xl:pt-24'>
          <p className='text-primary-600 font-inter font-extrabold 
          md:text-[45px]
          lg:text-[55px]
          xl:text-[65px]
          2xl:text-[75px] 
          uppercase '
          >start your day by being productive.</p>
          <p className='text-primary-600 font-fustat font-medium 
          md:text-[12px] md:pr-0 md:mt-4
          lg:text-[14px] lg:pr-0 lg:mt-4
          xl:text-[16px] xl:pr-0 xl:mt-4
          2xl:text-[18px] 2xl:pr-0 '
          >Study Buddy is a web-based learning support application designed to help students manage their study time, improve focus, and enhance learning efficiency.</p>
          <button
          className='text-white  font-fustat font-bold bg-primary-600 uppercase px-8 py-2 rounded-full mb-5 md:mb-6 lg:mb-8 xl:mb-10 2xl:mb-12
          md:mt-10 md:text-md
          lg:mt-12 lg:text-lg
          xl:mt-14 xl:text-xl
          2xl:mt-16 2xl:text-2xl'
          >download</button>
        </div>
        <div className='flex flex-col w-full h-screen justify-start items-center   2xl:pt-18 '>
            <img src="./landImg.png" alt="landing img" 
            className=' w-[150px] h-[100px] 
            md:min-w-[350px] md:min-h-[380px] md:pt-12
            lg:min-w-[350px] lg:min-h-[380px] lg:pt-14
            xl:min-w-[450px] xl:min-h-[480px] xl:pt-16
            2xl:min-w-[550px] 2xl:min-h-[580px] object-center' />
        </div>

      </div>
    </section>
    {/*First*/}
    <section className='min-h-screen '>
      <div className='flex flex-col w-screen px-56 0 mb-10'>
        <p className='flex justify-center items-center font-fustat text-primary-600 text-2xl mb-20'>
          Your all-in-one study companion{' '}<b>— plan, organize,</b>{' '}and{' '}<b>{' '}learn smarter.{' '}</b>
        </p>
        <div className='flex flex-row gap-x-10'>
          <img src="./assets/sTimer.png" alt="Timergif" className='w-[250px] h-[250px]' />
          <div className='text-primary-600 font-inter'>
            <p className='font-bold text-[54px]'>Study Timer</p>
            <p className='text-[18px]'>Track how much time you actually spend studying.</p>
            <p className='text-[18px]'>Start the timer whenever you sit down to work,</p>
            <p className='text-[18px]'>and watch your study hours add up.</p>
          </div>
        </div>

        <div className='flex flex-row gap-4 justify-end '>
          <div className='text-right text-primary-600 font-inter'>
             <p className='font-bold text-[54px]'>To Do List</p>
            <p className='text-[18px]'>Keep track of everything you need to get done.</p>
            <p className='text-[18px]'>Add, check off, and manage your tasks so </p>
            <p className='text-[18px]'>nothing slips through the cracks.</p>
          </div>
          <img src="./assets/todolist.png" alt="Todo list gif" className='w-[250px] h-[250px]' />

        </div>
      </div>

    {/*Second*/}
      <div className='flex flex-col w-screen px-56  mb-10 '>
        <div className='flex flex-row gap-x-10'>
          <img src="./assets/notes.png" alt="Notesgif" className='w-[250px] h-[250px]' />
          <div className='text-primary-600 font-inter'>
            <p className='font-bold text-[54px]'>Notes</p>
            <p className='text-[18px]'>Keep all your study notes in one organized</p>
            <p className='text-[18px]'>place. Create, edit, and revisit your notes</p>
            <p className='text-[18px]'>anytime, so nothing gets lost between </p>
            <p className='text-[18px]'>subjects and deadlines.</p>

          </div>
        </div>

        <div className='flex flex-row gap-4 justify-end '>
          <div className='text-right text-primary-600 font-inter'>
             <p className='font-bold text-[54px]'>Class Schedule</p>
            <p className='text-[18px]'>See your classes and study sessions at a</p>
            <p className='text-[18px]'>glance. Plan your week and stay on top</p>
            <p className='text-[18px]'>of where you need to be and when.</p>
          </div>
          <img src="./assets/classschedule.png" alt="Class Schedgif" className='w-[250px] h-[250px]' />

        </div>
      </div>

    {/*Third*/}
      <div className='flex flex-col w-screen px-56  mb-10 '>
        <div className='flex flex-row gap-x-10'>
          <img src="./assets/courses.png" alt="coursesgif" className='w-[250px] h-[250px]' />
          <div className='text-primary-600 font-inter'>
            <p className='font-bold text-[54px]'>Course</p>
            <p className='text-[18px]'>Organize your subjects and</p>
            <p className='text-[18px]'>materials by course. Keep </p>
            <p className='text-[18px]'>everything related to each class  </p>
            <p className='text-[18px]'>neatly grouped and easy to find.</p>

          </div>
        </div>

        <div className='flex flex-row gap-4 justify-end '>
          <div className='text-right text-primary-600 font-inter'>
             <p className='font-bold text-[54px]'>Study Generator</p>
            <p className='text-[18px]'>Turn your notes and files into quizzes and</p>
            <p className='text-[18px]'>flashcards in seconds. A smarter, faster way</p>
            <p className='text-[18px]'>to review and test what you've learned.</p>
          </div>
          <img src="./assets/classschedule.png" alt="Class Schedgif" className='w-[250px] h-[250px]' />

        </div>
      </div>

    </section>
    <section className="min-h-screen bg-primary-600">
      <div >
        <Signup />

      </div>
    </section>
  </>


    

  )
}

export default App