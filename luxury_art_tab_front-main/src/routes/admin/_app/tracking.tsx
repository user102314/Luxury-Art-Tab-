import { createFileRoute } from '@tanstack/react-router'
import { AdminShipmentTrackingPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/tracking')({
  component: AdminShipmentTrackingPage,
})
