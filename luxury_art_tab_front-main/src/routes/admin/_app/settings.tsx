import { createFileRoute } from '@tanstack/react-router'
import SettingsPage from '@/admin/pages/SettingsPage'

export const Route = createFileRoute('/admin/_app/settings')({
  component: SettingsPage,
})
