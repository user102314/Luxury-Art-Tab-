import { Navigate, createFileRoute } from '@tanstack/react-router'
import AdminLayout from '@/admin/components/AdminLayout'
import { useAdminAuth } from '@/admin/context/AdminAuthContext'

export const Route = createFileRoute('/admin/_app')({
  component: AdminAuthenticatedLayout,
})

function AdminAuthenticatedLayout() {
  const { user, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center text-zinc-500">
        Chargement...
      </div>
    )
  }

  if (!user) return <Navigate to="/admin/login" />

  return <AdminLayout />
}
