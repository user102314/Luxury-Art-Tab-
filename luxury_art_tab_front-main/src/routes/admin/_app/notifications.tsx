import { createFileRoute } from '@tanstack/react-router'
import NotificationsPage from '@/admin/pages/NotificationsPage'

export const Route = createFileRoute('/admin/_app/notifications')({
  component: NotificationsPage,
})
