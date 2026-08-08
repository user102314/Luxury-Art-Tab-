import { createFileRoute } from '@tanstack/react-router'
import OrdersPage from '@/admin/pages/OrdersPage'

export const Route = createFileRoute('/admin/_app/orders')({
  component: OrdersPage,
})
