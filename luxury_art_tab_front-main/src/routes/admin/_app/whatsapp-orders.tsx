import { createFileRoute } from '@tanstack/react-router'
import WhatsAppOrdersPage from '@/admin/pages/WhatsAppOrdersPage'

export const Route = createFileRoute('/admin/_app/whatsapp-orders')({
  component: WhatsAppOrdersPage,
})
