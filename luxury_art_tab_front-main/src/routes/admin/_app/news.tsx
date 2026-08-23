import { createFileRoute } from '@tanstack/react-router'
import { AdminNewsPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/news')({
  component: AdminNewsPage,
})
