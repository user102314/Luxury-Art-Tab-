import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { AdminAuthProvider } from '@/admin/context/AdminAuthContext'
import { buildSeoHead, SITE } from '@/lib/seo'

export const Route = createFileRoute('/admin')({
  head: () =>
    buildSeoHead({
      title: `Administration | ${SITE.name}`,
      description: 'Espace administrateur Luxury Art_Tab.',
      path: '/admin',
      robots: 'noindex, nofollow',
    }),
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
