import { useState, useRef, useEffect } from 'react'
import { logout } from '../services/authService'
import { useLocation, useNavigate } from 'react-router-dom'

type Props = {
  uploading?: boolean
  quizActive?: boolean
  isOpenExternal?: boolean
  onExternalClose?: () => void
}

function Sidebar({ uploading = false, quizActive = false, isOpenExternal = false, onExternalClose }: Props) {
  const isBlocked = uploading || quizActive
  const [isOpenInternal, setIsOpenInternal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const isOpen = isOpenInternal || isOpenExternal   // ← merged state

  const close = () => {
    setIsOpenInternal(false)
    onExternalClose?.()
  }

  const handleLogout = async () => {
    sessionStorage.clear()
    sessionStorage.setItem('intentionalLogout', 'true')
    await logout()
    setShowLogoutModal(false)
    navigate('/')
    window.history.replaceState(null, '', '/')
  }

  const handleNavigate = (path: string) => {
    if (isBlocked) return
    navigate(path)
    close() 
  }

  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleScroll = () => {
    setIsScrolling(true)
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => setIsScrolling(false), 800)
  }

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    }
  }, [])

  const navSections = [
    {
      heading: 'Home',
      items: [{ label: 'Dashboard', path: '/dashboard', icon: '/sideIcons/dashboard.png' }]
    },
    {
      heading: 'Activities',
      items: [
        { label: 'To Do List', path: '/todolist' , icon: '/sideIcons/todo.png' },
        { label: 'Notes', path: '/notes' , icon: '/sideIcons/notes.png' },
        { label: 'Class Schedule', path: '/schedule' , icon: '/sideIcons/classSched.png' },
        { label: 'My Files', path: '/myFiles' , icon: '/sideIcons/courses.png' },
        { label: 'Study Generator', path: '/studyGenerator' , icon: '/sideIcons/studyGen.png' },
        { label: 'Generated History', path: '/history' , icon: '/sideIcons/genHis.png' },
        { label: 'Recently Deleted', path: '/delete' , icon: '/sideIcons/RecentD.png' },
      ]
    },
    {
      heading: 'More',
      items: [{ label: 'Account', path: '/account', icon: '/sideIcons/account.png' }]
    },
  ]

  return (
    <>
      {/* BURGER BUTTON */}
      <button
        id="sidebar-btn"
        onClick={() => {
          if (isBlocked) return
          setIsOpenInternal(!isOpenInternal)   // ← fixed syntax
        }}
        className={`lg:hidden fixed top-5 left-3 z-50 bg-transparent p-4 flex flex-col items-center
          ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}
          ${isOpen ? 'hidden' : ''}
        `}
      >
        <img src="/menu.png" alt="menu" className="w-10 h-8 select-none" onContextMenu={(e) => e.preventDefault()} draggable={false} />
        <span className="text-xs text-primary-600 mt-1" />
      </button>

      {/* OVERLAY */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={close}   // ← was setIsOpen(false)
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          md:rounded-none lg:rounded-lg
          fixed top-0 left-0 h-full  w-60 lg:w-[165px] xl:w-[200px] 2xl:w-[235px] 3xl:w-[280px] bg-primary-800 z-40
          flex flex-col shadow-lg 
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:flex
          ${isBlocked ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {/* LOGO */}
        <div className="p-6  ml-2 lg:ml-0 flex gap-2 justify-start items-center">
          <img src="/sideIcons/sideLogo.png" alt="Study Buddy" className="w-10 lg:w-9 xl:w-14 2xl:w-16 3xl:w-20 select-none" onContextMenu={(e) => e.preventDefault()} draggable={false} 
           />
            <p className='font-roboto text-[9px] lg:text-[9px] xl:text-xs 2xl:text-[16px] 3xl:text-[20px] text-white uppercase'>Study <br></br> Buddy</p>
        </div>

        {/* NAV SECTIONS */}
        <nav id='sidebar' onScroll={handleScroll}   className={`flex-1 overflow-y-auto pb-4 custom-scroll ${isScrolling ? 'is-scrolling' : ''}`}>
          {navSections.map((section) => (
            <div  key={section.heading} className="mb-4 lg:mb-0 ">
              <div className=" mx-5 h-px  bg-primary-100" />
              <div className="flex pl-5 flex-row items-start mb-2 lg:mb-1 2xl:mb-2 3xl:mb-3">
                <span className="text-[#8C8C8C]  font-roboto font-normal text-xs lg:text-[9px] xl:text-[12px] 3xl:text-[14px]  pt-3 lg:pt-1 xl:pt-2 2xl:pt-3 3xl:pt-4   tracking-wide">
                  {section.heading}
                </span>
              </div>
            <div className='px-5 lg:px-0 lg:pl-2 lg:pr-5  ml-2 xl:px-3  '>

              {section.items.map((item) => (
              <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`
                    w-full text-left py-2 lg:py-0 pl-1 2xl:py-1 3xl:py-2  mb-1
                    font-medium text-lg lg:text-[10px] xl:text-[12px] 2xl:text-[14px] 3xl:text-[18px]
                    transition-colors duration-200  rounded-md
                    flex items-center gap-2 justs 
                    ${location.pathname === item.path ||
                      location.pathname.startsWith(item.path + '/') ||
                      (item.path === '/history' && ['/quizView', '/flashcardView'].includes(location.pathname)) ||
                      (item.path === '/account' && location.pathname === '/changeEmail')
                      ? 'bg-[#4A4A49] text-white font-medium'
                      : 'text-white hover:bg-[#4A4A49] '
                    }
                  `}
                >
                  <img src={item.icon} alt="" className="w-5  h-5 md:w-7 md:h-7 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7 3xl:w-9 3xl:h-9 shrink-0 select-none" onContextMenu={(e) => e.preventDefault()} draggable={false} />
                  {item.label}
                </button>
              ))}
            </div>
            </div>
          ))}

          {/* LOGOUT */}
              <div className='px-5 lg:px-0 lg:pl-2 lg:pr-5 -mt-2 lg:mt-0  ml-2 xl:px-3'>
                <button
                  onClick={() => !isBlocked && setShowLogoutModal(true)}
                  className="
                     w-full text-left py-2 lg:py-1 pl-1   mb-1
                    font-medium text-lg lg:text-[10px] xl:text-[12px] 2xl:text-[14px] 3xl:text-[18px]
                    transition-colors duration-200 rounded-lg
                    flex items-center gap-2 
                    text-white hover:bg-[#4A4A49]
                  "
                >
                  <img src="/sideIcons/logoutR.png" alt="" className="w-5  h-5 md:w-7 md:h-7 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-7 2xl:h-7 3xl:w-9 3xl:h-9  shrink-0 select-none"  onContextMenu={(e) => e.preventDefault()} draggable={false} />
                  Logout
                </button>
              </div>
        </nav>
      </aside>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-md 3xl:rounded-lg shadow-xl p-8 lg:p-0 lg:py-4 lg:px-5 2xl:py-6 2xl:px-5 3xl:py-8 3xl:px-5 w-80 lg:w-52 xl:w-64 2xl:w-72 3xl:w-80 text-center">
              <h2 className="text-xl lg:text-sm xl:text-lg  2xl:text-xl 3xl:text-2xl font-bold text-primary-600 font-roboto mb-2">Logout</h2>
              <p className="text-gray-600 lg:text-[10px] xl:text-[14px] 2xl:text-[16px] 3xl:text-[18px] mb-6">Are you sure you want to logout?</p>
              <div className="flex gap-4 3xl:gap-6">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 border-2 border-primary-600 font-roboto text-primary-600 lg:text-xs 2xl:text-sm 3xl:text-lg lg:rounded-md font-bold lg:py-1 2xl:py-2 3xl:py-2 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-primary-600 text-white font-roboto lg:text-xs 2xl:text-sm 3xl:text-lg lg:rounded-md font-bold lg:py-1 2xl:py-2 3xl:py-2 py-3 rounded-lg hover:opacity-90 transition-opacity duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default Sidebar