import { createFileRoute } from '@tanstack/react-router'
import { AdminClientsPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/clients')({
  component: AdminClientsPage,
})
