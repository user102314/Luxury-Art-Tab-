import { createFileRoute } from '@tanstack/react-router'
import PricingPage from '@/admin/pages/PricingPage'

export const Route = createFileRoute('/admin/_app/pricing')({
  component: PricingPage,
})
