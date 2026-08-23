import { createFileRoute } from '@tanstack/react-router'
import { AdminLoyaltyPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/loyalty')({
  component: AdminLoyaltyPage,
})
