import { createFileRoute } from '@tanstack/react-router'
import AnalyticsPage from '@/admin/pages/AnalyticsPage'

export const Route = createFileRoute('/admin/_app/analytics')({
  component: AnalyticsPage,
})
