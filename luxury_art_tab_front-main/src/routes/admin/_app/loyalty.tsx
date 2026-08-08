import { createFileRoute } from '@tanstack/react-router'
import LoyaltyPage from '@/admin/pages/LoyaltyPage'

export const Route = createFileRoute('/admin/_app/loyalty')({
  component: LoyaltyPage,
})
