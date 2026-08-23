import { createFileRoute } from '@tanstack/react-router'
import { AdminInstagramOrdersPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/instagram-orders')({
  component: AdminInstagramOrdersPage,
})
