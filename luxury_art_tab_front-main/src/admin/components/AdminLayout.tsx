import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { Suspense } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  ShoppingBag,
  TrendingUp,
  Newspaper,
  Package,
  LogOut,
  MessageSquare,
  Gift,
  Facebook,
  Instagram,
  BarChart3,
  Users,
  MessageCircle,
  Settings,
  Bell,
  HeartHandshake,
  Truck,
  Ruler,
  Tags,
  ScrollText,
} from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'
import { prefetchEssentials, prefetchRoute } from '../hooks/useAdminQueries'
import StockAlertsBanner from './StockAlertsBanner'
import OrderNotificationsBell from './OrderNotificationsBell'
import { BrandLogo } from './BrandLogo'
import { BackButton } from '@/components/BackButton'
import { PageSkeleton } from './QueryStatusBar'

const nav = [
  { to: '/admin/revenue', icon: TrendingUp, label: 'Revenus' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/audit-logs', icon: ScrollText, label: 'Journal audit' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Commandes' },
  { to: '/admin/tracking', icon: Truck, label: 'Suivi livraisons' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/facebook-orders', icon: Facebook, label: 'Facebook' },
  { to: '/admin/instagram-orders', icon: Instagram, label: 'Instagram' },
  { to: '/admin/whatsapp-orders', icon: MessageCircle, label: 'WhatsApp' },
  { to: '/admin/clients', icon: Users, label: 'Clients' },
  { to: '/admin/products', icon: Package, label: 'Produits' },
  { to: '/admin/categories', icon: Tags, label: 'Catégories' },
  { to: '/admin/pricing', icon: Ruler, label: 'Tarifs & cadres' },
  { to: '/admin/moderation', icon: MessageSquare, label: 'Avis & Commentaires' },
  { to: '/admin/loyalty', icon: Gift, label: 'Fidélité' },
  { to: '/admin/news', icon: Newspaper, label: 'Actualités' },
  { to: '/admin/testimonials', icon: HeartHandshake, label: 'Avis clients' },
  { to: '/admin/settings', icon: Settings, label: 'Boutique' },
] as const

export default function AdminLayout() {
  const { user, logout } = useAdminAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    prefetchEssentials(queryClient)
  }, [queryClient])

  const handleLogout = () => {
    logout()
    navigate({ to: '/admin/login' })
  }

  return (
    <div className="admin-shell flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-white/10 bg-ink-900">
        <div className="flex items-center border-b border-white/10 px-4 py-5">
          <BrandLogo onDark size="sm" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {nav.map(({ to, icon: Icon, label }) => {
            const isActive = pathname === to
            return (
              <Link
                key={to}
                to={to}
                preload="intent"
                onMouseEnter={() => prefetchRoute(queryClient, to)}
                onFocus={() => prefetchRoute(queryClient, to)}
                onTouchStart={() => prefetchRoute(queryClient, to)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-gold-500/15 text-gold-300'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-ink-800 px-4 py-3">
            <p className="truncate text-sm font-medium text-white">{user?.nom}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full">
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <div className="relative z-40 flex items-center justify-between border-b border-white/10 bg-ink-950/80 px-8 py-5 backdrop-blur">
          <div className="flex min-w-0 items-center gap-4">
            <BackButton variant="admin" fallbackTo="/admin/revenue" label="Retour" />
            <div className="min-w-0 border-l border-white/10 pl-4">
              <h1 className="font-display text-2xl font-semibold text-white">Tableau de bord</h1>
              <p className="text-sm text-zinc-500">Gestion de la boutique Luxury Art</p>
            </div>
          </div>
          <OrderNotificationsBell />
        </div>
        <div className="p-8">
          <StockAlertsBanner />
          <Suspense fallback={<PageSkeleton rows={8} />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
