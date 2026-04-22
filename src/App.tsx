import './index.css'
import { useState } from "react";
function App() {
  const [activeTab, setActiveTab] = useState("signup");
  return (
    
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-t from-primary-50 to-primary-100">

      {/* FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 order-2 lg:order-1">
        <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md border-4 border-primary-500">
          <div className="flex justify-center space-x-12 mb-5">
            <button
              onClick={() => setActiveTab("signup")}
              className={`text-md font-bold border-2 border-primary-500 py-4 rounded-md w-[190px] ${
                activeTab === "signup"
                  ? "bg-primary-500 text-primary-100"
                  : "bg-white text-primary-500"
              }`}
            >
              SIGN UP
            </button>

            <button
                onClick={() => setActiveTab("login")}
                className={`text-md font-bold border-2 border-primary-500 py-4 rounded-md w-[190px] ${
                  activeTab === "login"
                  ? "bg-primary-500 text-primary-100"
                  : "bg-white text-primary-500"
                }`}
              >
                LOG IN
              </button>
          </div>
          <p className='text-primary-500 font-bold p-2' >FIRST NAME</p>
          <input type="text" className="w-full mb1 p-2 border rounded" placeholder="ex. Juan"/>
          <p className='text-primary-500 font-bold p-2' >LAST NAME</p>
          <input type="text" className="w-full mb1 p-2 border rounded" placeholder="ex. Dela Cruz"/>
          <p className='text-primary-500 font-bold p-2'>EMAIL</p>
          <input type="email" className='w-full mb1 p-2 border rounded' placeholder='juandelacruz@gmail.com' />
          <p className='text-primary-500 font-bold p-2'>PASSWORD</p>
          <input type="password" className='w-full mb1 p-2 border rounded' placeholder='ex. Ju1an_delaCruz' />
          <p className='text-primary-500 font-bold p-2'>CONFIRMED PASSWORD</p>
          <input type="password" className='w-full mb-8 p-2 border rounded' placeholder='ex. Ju1an_delaCruz' />
          <button className="w-full bg-primary-500 font-bold text-white p-6 border rounded-xl">
            CREATE ACCOUNT
          </button>
        </div>
      </div>

{/* LOGO + TEXT */}
<div className="w-full lg:w-1/2 p-10 flex flex-col items-center justify-center order-1 lg:order-2 text-center pr-20">
  
  <img
    src="/logo.png"
    alt="Study Buddy logo"
    className="w-[500px] lg:w-[600px] h-auto mb-6"
  />

  <p className="text-[#132442] text-lg max-w-xl">
    Study Buddy is a web-based learning support application designed to help students manage their study time, improve focus, and enhance learning efficiency.
  </p>

    <img
    src="/read.png"
    alt="Reading"
    className="hidden lg:block w-[200px] lg:w-[300px] h-auto mb-6"
  />

</div>

    </div>
  )
}

export default App