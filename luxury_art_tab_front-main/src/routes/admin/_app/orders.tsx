import { createFileRoute } from '@tanstack/react-router'
import { AdminOrdersPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/orders')({
  component: AdminOrdersPage,
})
