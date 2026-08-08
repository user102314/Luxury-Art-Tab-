import { createFileRoute } from '@tanstack/react-router'
import InstagramOrdersPage from '@/admin/pages/InstagramOrdersPage'

export const Route = createFileRoute('/admin/_app/instagram-orders')({
  component: InstagramOrdersPage,
})
