import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import ToDoList from './pages/ToDoList'
import Notes from './pages/Notes'
import ClassSchedule from './pages/ClassSchedule'
import Courses from './pages/Courses'
import StudyGenerator from './pages/StudyGenerator'
import GeneratedHistory from './pages/GeneratedHistory'
import RecentlyDeleted from './pages/RecentlyDeleted'
import Account from './pages/Account'
import CourseFolder from './pages/CourseFolder'
import { TimerProvider } from './context/TimerContext'  
import ExpiredAlert from './components/ExpiredAlert'  
import Quiz from './pages/StudyGenerator/Quiz'
import Flashcard from './pages/StudyGenerator/Flashcard'
import QuizView from './pages/StudyGenerator/QuizView'
import FlashcardView from './pages/StudyGenerator/FlashcardView'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/forgotPassword',
    element: <ForgotPassword />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/todolist',
    element: (
      <ProtectedRoute>
          <ToDoList />
      </ProtectedRoute>
    )
  },
  {
    path: '/notes',
    element: (
      <ProtectedRoute>
        <Notes />
      </ProtectedRoute>
    )
  },
  {
    path: '/schedule',
    element:(
      <ProtectedRoute>
        <ClassSchedule />
      </ProtectedRoute>
    )
  },
  {
    path: '/courses',
    element:(
      <ProtectedRoute>
        <Courses />
      </ProtectedRoute>
    )
  },
  {
    path: '/courses/:courseId',
    element:(
      <ProtectedRoute>
        <CourseFolder />
      </ProtectedRoute>
    )
  },
  {
    path: '/studyGenerator',
    element:(
      <ProtectedRoute>
        <StudyGenerator />
      </ProtectedRoute>
    )
  },
  {
    path: '/studyGenerator/Quiz',
    element:(
      <ProtectedRoute>
        <Quiz />
      </ProtectedRoute>
    )
  },
    {
    path: '/studyGenerator/Flashcard',
    element:(
      <ProtectedRoute>
        <Flashcard />
      </ProtectedRoute>
    )
  },
  {
    path:'/history',
    element:(
      <ProtectedRoute>
        <GeneratedHistory />
      </ProtectedRoute>
    )
  },
  {
    path:'/quizView',
    element:(
      <ProtectedRoute>
        <QuizView />
      </ProtectedRoute>
    )
  },
    {
    path:'/flashcardView',
    element:(
      <ProtectedRoute>
        <FlashcardView />
      </ProtectedRoute>
    )
  },
  {
    path:'/delete',
    element: (
      <ProtectedRoute>
        <RecentlyDeleted />
      </ProtectedRoute>
    )
  },
  {
    path: '/account',
    element: (
      <ProtectedRoute>
        <Account />
      </ProtectedRoute>
    )
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TimerProvider>
      <ExpiredAlert />
      <RouterProvider router={router} />
    </TimerProvider>
  </StrictMode>
)