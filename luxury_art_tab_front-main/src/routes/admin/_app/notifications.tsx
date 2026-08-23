import { createFileRoute } from '@tanstack/react-router'
import { AdminNotificationsPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/notifications')({
  component: AdminNotificationsPage,
})
