import { createFileRoute } from '@tanstack/react-router'
import { AdminProductsPage } from '@/admin/lazyPages'

export const Route = createFileRoute('/admin/_app/products')({
  component: AdminProductsPage,
})
