import { createFileRoute } from '@tanstack/react-router'
import LoginPage from '@/admin/pages/LoginPage'

export const Route = createFileRoute('/admin/login')({
  component: LoginPage,
})
