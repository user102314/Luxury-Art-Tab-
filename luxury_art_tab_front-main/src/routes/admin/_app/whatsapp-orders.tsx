import { createFileRoute } from '@tanstack/react-router'
import { AdminWhatsAppOrdersPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/whatsapp-orders')({
  component: AdminWhatsAppOrdersPage,
})
