import { createFileRoute } from '@tanstack/react-router'
import FacebookOrdersPage from '@/admin/pages/FacebookOrdersPage'

export const Route = createFileRoute('/admin/_app/facebook-orders')({
  component: FacebookOrdersPage,
})
