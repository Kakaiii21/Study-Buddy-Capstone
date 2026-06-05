import { useEffect } from 'react'
import type { Task } from './useTasks'

function scheduleAll(tasks: Task[]) {
  const controller = navigator.serviceWorker.controller
  if (!controller) return

  tasks.forEach((task) => {
    if (!task.deadline || task.status === 'done') {
      controller.postMessage({
        type: 'CANCEL_NOTIFICATION',
        taskId: task.id,
      })
      return
    }

    controller.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      taskId: task.id,
      taskName: task.name,
      deadline: task.deadline,
    })
  })
}

export function useTaskNotifications(tasks: Task[]) {
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (Notification.permission !== 'granted') return

    // If SW is already active, schedule immediately
    if (navigator.serviceWorker.controller) {
      scheduleAll(tasks)
      return
    }

    // Otherwise wait for SW to take control, then schedule
    const handler = () => scheduleAll(tasks)
    navigator.serviceWorker.addEventListener('controllerchange', handler)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', handler)
  }, [tasks])
}