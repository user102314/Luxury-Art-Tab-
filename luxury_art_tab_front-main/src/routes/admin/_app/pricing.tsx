import { createFileRoute } from '@tanstack/react-router'
import { AdminPricingPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/pricing')({
  component: AdminPricingPage,
})
