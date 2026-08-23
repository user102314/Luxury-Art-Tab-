import { createFileRoute } from '@tanstack/react-router'
import { AdminFacebookOrdersPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/facebook-orders')({
  component: AdminFacebookOrdersPage,
})
