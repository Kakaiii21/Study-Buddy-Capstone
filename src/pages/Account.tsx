import React from 'react'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'

function Account() {
  const navigate = useNavigate()
  return (
    <div className='flex h-screen'>
      <Sidebar />

      <main className='flex-1 overflow-auto  md:p-8 mt-1 lg:mt-0'>
        <div className='min-h-screen flex flex-col'>

          {/* Header */}
          <div className='flex flex-col md:flex-row lg:flex-row lg:items-center w-full gap-3 mb-6 lg:mt-0 mt-4 px-5'>
            <p className='mt-4 lg:mt-0 lg:text-4xl text-3xl font-bold text-primary-600 uppercase font-roboto text-center lg:text-start'>
              ACCOUNT
            </p>
                      <hr className='w-full border-t border-primary-600 mb-6  px-10'  />

          </div>



          <div className='flex  flex-col w-full h-screen justify-start items-center'>
              {/*Profile Pic*/}
                <div className="relative w-fit">
                  <img
                    src="/profile.png"
                    alt="Profile"
                    className="w-40 h-40 border-2 border-primary-600 rounded-full p-3"
                  />

                  <button
                    aria-label="add"
                    className="absolute bottom-2 right-2 bg-primary-600 rounded-full shadow-md hover:opacity-30"
                  >
                    <img
                      src="/profileAdd.png"
                      alt=""
                      className="w-10 h-10"
                    />
                  </button>
                </div>
                <div className='w-full px-8 my-8 mt-10 '>
                  <div className='flex items-center gap-3'>
                  <span className='lg:text-md text-sm  text-primary-600 tracking-widest uppercase'>
                    Account Settings
                  </span>
                  <div className='flex-1 h-0.5 bg-primary-600' />
                </div>

                {/*Firstnaem*/}
                <div className='flex lg:flex-row md:flex-row flex-col gap-3 lg:gap-10 mt-6 lg:justify-start lg:items-center'>
                  <p className='text-primary-600 font-bold font-roboto lg:text-xl text-xl'>First Name:</p>
                  <div className='flex flex-row gap-3 lg:gap-5'>
                    <input type="text" placeholder='Kento' className='border border-primary-600 rounded-md bg-primary-700 text-primary-600 py-2 lg:px-32 px-10 ' />
                    <button className='bg-primary-600 text-white p-2 lg:px-10 px-5 rounded-md font-roboto uppercase'>Save</button>
                  </div>
                </div>
          <hr className='w-full border-t border-primary-700 mb-6 mt-5' />

                {/*LastName*/}
                <div className='flex lg:flex-row md:flex-row flex-col gap-3 lg:gap-10 mt-6 lg:justify-start lg:items-center'>
                  <p className='text-primary-600 font-bold font-roboto lg:text-xl text-xl'>Last Name:</p>
                  <div className='flex flex-row gap-3 lg:gap-5'>
                    <input type="text" placeholder='Yamikaze' className='border border-primary-600 rounded-md bg-primary-700 text-primary-600 py-2 lg:px-32 px-10 ' />
                    <button className='bg-primary-600 text-white p-2 lg:px-10 px-5 rounded-md font-roboto uppercase'>Save</button>
                  </div>
                </div>
                  <hr className='w-full border-t border-primary-700 mb-6 mt-5' />

                {/*Email*/}
                <div className='flex lg:flex-row md:flex-row flex-col gap-3 lg:gap-10 mt-6 lg:justify-start lg:items-center'>
                  <p className='text-primary-600 font-bold font-roboto lg:text-xl text-xl'>Email:</p>
                  <div className='flex flex-row gap-3 lg:gap-5 lg:ml-12 md:ml-12'>
                    <input type="text" placeholder='example@gmail.com' className='border border-primary-600 rounded-md bg-primary-700 text-primary-600 py-2 lg:px-32 px-10 ' />
                    <button className='bg-primary-600 text-white p-2 lg:px-10 px-5 rounded-md font-roboto uppercase'>Save</button>
                  </div>
                </div>
                <hr className='w-full border-t border-primary-700 mb-6 mt-5' />

                {/*Forgot pass*/}
                <div className='flex flex-row justify-start items-center gap-4 '>
                  <div className='hover:opacity-35 flex-row flex items-center justify-start gap-4'>
                    <img src="/changePass.png" alt="forgot icon" className='w-8 h-8' />
                  <button className='text-primary-600 font-bold font-roboto text-xl '
                  onClick={()=> navigate('/changePassword')}
                  >Change Password</button>
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