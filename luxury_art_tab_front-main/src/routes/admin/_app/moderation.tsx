import { createFileRoute } from '@tanstack/react-router'
import ModerationPage from '@/admin/pages/ModerationPage'

export const Route = createFileRoute('/admin/_app/moderation')({
  component: ModerationPage,
})
