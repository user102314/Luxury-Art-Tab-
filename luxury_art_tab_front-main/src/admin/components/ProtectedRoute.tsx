import { Navigate, Outlet } from '@tanstack/react-router'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        Chargement...
      </div>
    )
  }

  if (!user) return <Navigate to="/admin/login" replace />

  return <Outlet />
}
