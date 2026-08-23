import { createFileRoute } from '@tanstack/react-router'
import { AdminTestimonialsPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/testimonials')({
  component: AdminTestimonialsPage,
})
