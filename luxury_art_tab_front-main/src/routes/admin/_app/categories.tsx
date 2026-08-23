import { createFileRoute } from '@tanstack/react-router'
import { AdminCategoriesPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/categories')({
  component: AdminCategoriesPage,
})
