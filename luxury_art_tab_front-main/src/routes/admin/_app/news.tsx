import { createFileRoute } from '@tanstack/react-router'
import NewsPage from '@/admin/pages/NewsPage'

export const Route = createFileRoute('/admin/_app/news')({
  component: NewsPage,
})
