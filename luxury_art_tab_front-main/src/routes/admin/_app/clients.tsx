import { createFileRoute } from '@tanstack/react-router'
import ClientsPage from '@/admin/pages/ClientsPage'

export const Route = createFileRoute('/admin/_app/clients')({
  component: ClientsPage,
})
