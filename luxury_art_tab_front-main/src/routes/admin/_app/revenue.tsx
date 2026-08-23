import { createFileRoute } from '@tanstack/react-router'
import { AdminRevenuePage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/revenue')({
  component: AdminRevenuePage,
})
