import { useNavigate } from 'react-router-dom'

function ChangePassword() {
    const navigate = useNavigate()
  return (
    <div className='h-screen w-full '>
      <div className='flex flex-row  mt-3 ml-5 ' >
        <button className='flex flex-row  justify-start  gap-2 items-center hover:opacity-60'
        title='Go Back'>
          <img src="/back.png" alt="backbutton" className='lg:w-10 lg:h-10 w-8 h-8' />
          <p className='font-roboto font-bold text-primary-600 text-2xl'
          onClick={()=>navigate('/account')}
          >Back</p>
        </button>
      </div>

      {/*img*/}
      <div className=' flex flex-col justify-center items-center'>
        <img src="logo.png" alt="" className='w-64 h-44' />
        {/*forgot pass con*/}
        <div className='flex flex-col border-2 border-primary-600 rounded-xl px-5 py-10 lg:w-[850px] lg:h-[300px] mt-10 gap-10  justify-start items-center'>
          <p className='font-roboto font-bold  mt-10 text-primary-600 uppercase text-xl lg:text-3xl'>Change Password</p>

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

export default ChangePassword