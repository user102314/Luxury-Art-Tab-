import { createFileRoute } from '@tanstack/react-router'
import { AdminModerationPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/moderation')({
  component: AdminModerationPage,
})
