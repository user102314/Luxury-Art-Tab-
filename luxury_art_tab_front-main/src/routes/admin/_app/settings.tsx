import { createFileRoute } from '@tanstack/react-router'
import { AdminSettingsPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/settings')({
  component: AdminSettingsPage,
})
