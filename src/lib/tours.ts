import { driver } from 'driver.js'
import type { DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

// ─── Desktop (lg and above, 1024px+) ───────────────────────────────────────
const dashboardDesktop: DriveStep[] = [
  {
    element: '#dash_stats',
    popover: {
      title: '📊 Your Stats at a Glance',
      description: 'See how much time you\'ve studied, how many notes you\'ve made, and your file usage — all in one place.',
      side: 'bottom',
    },
  },
  {
    element: '#currentTime',
    popover: {
      title: '⏱️ Total Study Time',
      description: 'This shows how much time you\'ve logged studying so far. Keep the streak going!',
      side: 'bottom',
    },
  },
  {
    element: '#currentScore',
    popover: {
      title: '🏆 Latest Quiz Score',
      description: 'Your most recent quiz result appears here. Take more quizzes to keep improving!',
      side: 'bottom',
    },
  },
  {
    element: '#genHistory',
    popover: {
      title: '📁 Generation History',
      description: 'Click here to browse all the study materials you\'ve previously generated.',
      side: 'bottom',
    },
  },
  {
    element: '#timer',
    popover: {
      title: '⏳ Study Timer',
      description: 'Use this timer to time your study sessions. It automatically logs your focus time to your stats.',
      side: 'left',
    },
  },
  {
    element: '#setTime',
    popover: {
      title: '🕐 Set Your Session Length',
      description: 'Tap here to choose how long you want to study before the timer starts counting down.',
      side: 'left',
    },
  },
  {
    element: '#progressC',
    popover: {
      title: '✅ Task Progress',
      description: 'This ring shows how much of your to-do list you\'ve completed. Keep checking things off!',
      side: 'left',
    },
  },
  {
    element: '#viewBtn',
    popover: {
      title: '📝 Go to To-Do List',
      description: 'Click here to open your To-Do List and manage your study tasks.',
      side: 'left',
    },
  },
]

// ─── Tablet (md, 768px–1023px) ─────────────────────────────────────────────
const dashboardTablet: DriveStep[] = [
  {
    element: '#sidebar-btn',
    popover: {
      title: '☰ Open the Sidebar',
      description: 'Tap this button to open the sidebar — it\'s how you navigate between pages in Study Buddy.',
      side: 'right',
    },
  },
  {
    element: '#sidebar',
    popover: {
      title: '🗂️ Navigation Menu',
      description: 'From here you can jump to any section of the app — Notes, Files, Quizzes, and more.',
      side: 'over',
    },
  },
  {
    element: '#timer-btn',
    popover: {
      title: '⏳ Open Study Timer',
      description: 'Tap this to slide open the study timer panel.',
      side: 'bottom',
    },
  },
  {
    element: '#timer',
    popover: {
      title: '⏳ Study Timer',
      description: 'Use this timer to track your focus sessions. It automatically logs your study time to your stats.',
      side: 'bottom',
    },
  },
  {
    element: '#setTime',
    popover: {
      title: '🕐 Set Your Session Length',
      description: 'Tap here to choose how long you want to study before the timer starts counting down.',
      side: 'left',
    },
  },
  {
    element: '#progressC',
    popover: {
      title: '✅ Task Progress',
      description: 'This ring shows how much of your to-do list you\'ve completed. Keep checking things off!',
      side: 'top',
    },
  },
  {
    element: '#viewBtn',
    popover: {
      title: '📝 Go to To-Do List',
      description: 'Tap here to open your To-Do List and manage your study tasks.',
      side: 'top',
    },
  },
  {
    element: '#dash_stats',
    popover: {
      title: '📊 Your Stats at a Glance',
      description: 'See how much time you\'ve studied, how many notes you\'ve made, and your file usage — all in one place.',
      side: 'bottom',
    },
  },
  {
    element: '#currentTime',
    popover: {
      title: '⏱️ Total Study Time',
      description: 'This shows how much time you\'ve logged studying so far. Keep the streak going!',
      side: 'bottom',
    },
  },
  {
    element: '#currentScore',
    popover: {
      title: '🏆 Latest Quiz Score',
      description: 'Your most recent quiz result appears here. Take more quizzes to keep improving!',
      side: 'bottom',
    },
  },
  {
    element: '#genHistory',
    popover: {
      title: '📁 Generation History',
      description: 'Tap here to browse all the study materials you\'ve previously generated.',
      side: 'bottom',
    },
  },
]

// ─── Mobile (below 768px) ───────────────────────────────────────────────────
const dashboardMobile: DriveStep[] = [
  {
    element: '#sidebar-btn',
    popover: {
      title: '☰ Open the Sidebar',
      description: 'Tap this button to open the sidebar — it\'s how you navigate between pages in Study Buddy.',
      side: 'right',
    },
  },
  {
    element: '#sidebar',
    popover: {
      title: '🗂️ Navigation Menu',
      description: 'From here you can jump to any section of the app — Notes, Files, Quizzes, and more.',
      side: 'over',
    },
  },
  {
    element: '#timer-btn',
    popover: {
      title: '⏳ Open Study Timer',
      description: 'Tap this to slide open the study timer panel.',
      side: 'left',
    },
  },
  {
    element: '#timer',
    popover: {
      title: '⏳ Study Timer',
      description: 'Use this timer to track your focus sessions. It automatically logs your study time to your stats.',
      side: 'over',
    },
  },
  {
    element: '#setTime',
    popover: {
      title: '🕐 Set Your Session Length',
      description: 'Tap here to choose how long you want to study before the timer starts counting down.',
      side: 'left',
    },
  },
  {
    element: '#progressC',
    popover: {
      title: '✅ Task Progress',
      description: 'This ring shows how much of your to-do list you\'ve completed. Keep checking things off!',
      side: 'top',
    },
  },
  {
    element: '#viewBtn',
    popover: {
      title: '📝 Go to To-Do List',
      description: 'Tap here to open your To-Do List and manage your study tasks.',
      side: 'top',
    },
  },
  {
    element: '#dash_stats',
    popover: {
      title: '📊 Your Stats at a Glance',
      description: 'See how much time you\'ve studied, how many notes you\'ve made, and your file usage — all in one place.',
      side: 'bottom',
    },
  },
  {
    element: '#currentTime',
    popover: {
      title: '⏱️ Total Study Time',
      description: 'This shows how much time you\'ve logged studying so far. Keep the streak going!',
      side: 'bottom',
    },
  },
  {
    element: '#currentScore',
    popover: {
      title: '🏆 Latest Quiz Score',
      description: 'Your most recent quiz result appears here. Take more quizzes to keep improving!',
      side: 'bottom',
    },
  },
  {
    element: '#genHistory',
    popover: {
      title: '📁 Generation History',
      description: 'Tap here to browse all the study materials you\'ve previously generated.',
      side: 'top',
    },
  },
]

// ─── Tour steps map ─────────────────────────────────────────────────────────
export const tourSteps: Record<string, {
  desktop: DriveStep[]
  tablet: DriveStep[]
  mobile: DriveStep[]
}> = {
  dashboard: {
    desktop: dashboardDesktop,
    tablet:  dashboardTablet,
    mobile:  dashboardMobile,
  },
}

// ─── startTour ──────────────────────────────────────────────────────────────
export function startTour(
  page: keyof typeof tourSteps,
  onOpenTimer?: () => void,
  onCloseTimer?: () => void,
  onOpenSidebar?: () => void,
  onCloseSidebar?: () => void
) {
  const w = window.innerWidth

  const steps =
    w >= 1024 ? tourSteps[page].desktop :
    w >= 768  ? tourSteps[page].tablet  :
                tourSteps[page].mobile

  if (!steps?.length) return

  const driverObj = driver({
    showProgress: true,
    animate: true,
    smoothScroll: true,
    overlayOpacity: 0.4,
    popoverClass: 'study-buddy-tour',
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Done',
    allowClose: true,
    stagePadding: 9,
    stageRadius: 12,
    onNextClick: (_element, step) => {
      if (step.element === '#sidebar-btn' && onOpenSidebar) {
        onOpenSidebar()
        setTimeout(() => driverObj.moveNext(), 400)
        return
      }
      if (step.element === '#sidebar' && onCloseSidebar) {
        onCloseSidebar()
        setTimeout(() => driverObj.moveNext(), 300)
        return
      }
      if (step.element === '#timer-btn' && onOpenTimer) {
        onOpenTimer()
        setTimeout(() => driverObj.moveNext(), 400)
        return
      }
      if (step.element === '#viewBtn' && onCloseTimer) {
        onCloseTimer()
        setTimeout(() => driverObj.moveNext(), 300)
        return
      }
      driverObj.moveNext()
    },
    steps,
  })

  driverObj.drive()
}