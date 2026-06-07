import { useEffect } from "react"
import { startTour, tourSteps } from "../lib/tours"

const TOUR_KEY = 'study_buddy_tour_seen'

export function useTour(
  page: keyof typeof tourSteps,
  auto = false,
  onOpenTimer?: () => void,
  onCloseTimer?: () => void,
  onOpenSidebar?: () => void,
  onCloseSidebar?: () => void
) {
  useEffect(() => {
    if (!auto) return
    const seen = localStorage.getItem(`${TOUR_KEY}_${page}`)
    if (!seen) {
      const timeout = setTimeout(() => {
        startTour(page, onOpenTimer, onCloseTimer, onOpenSidebar, onCloseSidebar)
        localStorage.setItem(`${TOUR_KEY}_${page}`, 'true')
      }, 600)
      return () => clearTimeout(timeout)
    }
  }, [page, auto])

  return { startTour: () => startTour(page, onOpenTimer, onCloseTimer, onOpenSidebar, onCloseSidebar) }
}