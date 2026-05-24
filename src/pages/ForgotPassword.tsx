
function ForgotPassword() {
  return (
    <div className='h-screen w-full '>
      <div className='flex flex-row  mt-3 ml-5 ' >
        <button className='flex flex-row  justify-start  gap-2 items-center hover:opacity-60'
        title='Go Back'>
          <img src="/back.png" alt="backbutton" className='w-10 h-10' />
          <p className='font-roboto font-bold text-primary-600 text-2xl'>Back</p>
        </button>
      </div>

      {/*img*/}
      <div className=' flex flex-col justify-center items-center'>
        <img src="logo.png" alt="" className='w-64 h-44' />
        {/*forgot pass con*/}
        <div className='flex flex-col border-2 border-primary-600 rounded-xl w-[850px] h-[300px] mt-10 gap-10  justify-start items-center'>
          <p className='font-roboto font-bold  mt-10 text-primary-600 uppercase text-3xl'>Change Password</p>

          <div>
            <p className='font-roboto font-bold text-primary-600  text-md'>Email</p>
          <input type="email" placeholder='Enter Your email' className='w-80  px-3 py-2 border border-primary-600 rounded-md' />
          </div>

        </div>

        {/*Send Link Button*/}
        <button className='font-roboto font-bold bg-primary-600 text-white text-md px-16 py-2 mt-10 rounded-md uppercase'>Send Link</button>
      </div>
    </div>
  )
}

export default ForgotPassword