import { createFileRoute } from '@tanstack/react-router'
import RevenuePage from '@/admin/pages/RevenuePage'

export const Route = createFileRoute('/admin/_app/revenue')({
  component: RevenuePage,
})
