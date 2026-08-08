import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { AdminAuthProvider } from '@/admin/context/AdminAuthContext'

export const Route = createFileRoute('/admin')({
  component: AdminRootLayout,
})

function AdminRootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isLogin = pathname === '/admin/login'

  return (
    <AdminAuthProvider>
      <div className={isLogin ? 'admin-shell min-h-screen' : 'admin-shell'}>
        <Outlet />
      </div>
    </AdminAuthProvider>
  )
}
