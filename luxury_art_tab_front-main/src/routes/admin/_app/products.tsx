import { createFileRoute } from '@tanstack/react-router'
import ProductsPage from '@/admin/pages/ProductsPage'

export const Route = createFileRoute('/admin/_app/products')({
  component: ProductsPage,
})
