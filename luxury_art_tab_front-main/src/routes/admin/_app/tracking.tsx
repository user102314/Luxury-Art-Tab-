import { createFileRoute } from '@tanstack/react-router'
import ShipmentTrackingPage from '@/admin/pages/ShipmentTrackingPage'

export const Route = createFileRoute('/admin/_app/tracking')({
  component: ShipmentTrackingPage,
})
