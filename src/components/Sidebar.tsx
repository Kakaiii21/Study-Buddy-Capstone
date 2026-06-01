import { useState } from 'react'
import { logout } from '../services/authService'
import { useLocation, useNavigate } from 'react-router-dom'

type Props = {
  uploading?: boolean
   quizActive?: boolean  
}

function Sidebar({ uploading = false, quizActive = false }: Props) {
  const isBlocked = uploading || quizActive  // ← combine both
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    sessionStorage.clear()
    await logout()
    setShowLogoutModal(false)
    navigate('/login', { replace: true })
  }

  const handleNavigate = (path: string) => {
    if (isBlocked) return  // ← block navigation
    navigate(path)
    setIsOpen(false)
  }
  const navSections = [
    {
      heading: 'Home',
      items: [
        { label: 'Dashboard', path: '/dashboard' },
      ]
    },
    {
      heading: 'Activities',
      items: [
        { label: 'To Do List', path: '/todolist' },
        { label: 'Notes', path: '/notes' },
        { label: 'Class Schedule', path: '/schedule' },
        { label: 'Course', path: '/courses' },
        { label: 'Study Generator', path: '/studyGenerator' },
        { label: 'Generated History', path: '/history' },
        { label: 'Recently Deleted', path: '/delete' },
      ]
    },
    {
      heading: 'More',
      items: [
        { label: 'Account', path: '/account' },
      ]
    },
  ]

  return (
    <>
      {/* BURGER BUTTON */}
      <button
        onClick={() => !isBlocked && setIsOpen(!isOpen)}
        className={`lg:hidden fixed top-5 left-3 z-50 bg-transparent p-4 flex flex-col items-center
          ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <img src="/menu.png" alt="menu" className="w-10 h-8" />
        <span className="text-xs text-primary-600 mt-1" />
      </button>

      {/* OVERLAY */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-primary-50 z-40
          flex flex-col shadow-lg
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:flex
          ${isBlocked ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {/* LOGO */}
        <div className="p-6 flex justify-center items-center">
          <img src="/logo.png" alt="Study Buddy" className="w-40" />
        </div>

        {/* NAV SECTIONS */}
        <nav className="flex-1 overflow-y-auto pb-4">
          {navSections.map((section) => (
            <div key={section.heading} className="mb-4">

              {/* SECTION HEADER */}
              <div className="flex items-center gap-2 px-10 mb-2">
                <span className="text-primary-600 font-roboto font-bold text-lg uppercase tracking-wide">
                  {section.heading}
                </span>
                <div className="flex-1 h-px bg-primary-100" />
              </div>

              {/* SECTION ITEMS */}
              {section.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`
                    w-full text-left py-2 px-4 pl-20 mb-1
                    font-medium text-lg
                    transition-colors duration-200
                    ${location.pathname === item.path ||
                      location.pathname.startsWith(item.path + '/') ||
                      (item.path === '/history' && ['/quizView', '/flashcardView'].includes(location.pathname)) ||
                      (item.path === '/account' && location.pathname === '/changeEmail')
                      ? 'bg-primary-100 text-primary-600 font-semibold'
                      : 'text-primary-600 hover:bg-primary-100'
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}

            </div>
          ))}

          {/* LOGOUT */}
          <button
            onClick={() => !isBlocked && setShowLogoutModal(true)}
            className="w-full text-left py-2 pl-20 px-4 mb-1 font-medium text-lg font-roboto text-primary-600 hover:bg-primary-100 transition-colors duration-200"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl p-8 w-80 text-center">
              <h2 className="text-xl font-bold text-primary-600 font-roboto mb-2">
                Logout
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to logout?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 border-2 border-primary-600 font-roboto text-primary-600 font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-primary-600 text-white font-roboto font-bold py-3 rounded-lg hover:opacity-90 transition-opacity duration-200"
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