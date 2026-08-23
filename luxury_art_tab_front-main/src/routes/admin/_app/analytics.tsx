import { createFileRoute } from '@tanstack/react-router'
import { AdminAnalyticsPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/analytics')({
  component: AdminAnalyticsPage,
})
