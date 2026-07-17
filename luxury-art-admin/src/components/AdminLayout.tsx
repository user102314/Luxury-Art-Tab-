import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  ShoppingBag,
  TrendingUp,
  Newspaper,
  Package,
  LogOut,
  Gem,
  MessageSquare,
  Gift,
  Facebook,
  Instagram,
  BarChart3,
  Users,
  MessageCircle,
  Settings,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { prefetchEssentials, prefetchRoute } from '../hooks/useAdminQueries'
import StockAlertsBanner from './StockAlertsBanner'
import OrderNotificationsBell from './OrderNotificationsBell'

const nav = [
  { to: '/revenue', icon: TrendingUp, label: 'Revenus' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/orders', icon: ShoppingBag, label: 'Commandes' },
  { to: '/facebook-orders', icon: Facebook, label: 'Facebook' },
  { to: '/instagram-orders', icon: Instagram, label: 'Instagram' },
  { to: '/whatsapp-orders', icon: MessageCircle, label: 'WhatsApp' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/products', icon: Package, label: 'Produits' },
  { to: '/moderation', icon: MessageSquare, label: 'Avis & Commentaires' },
  { to: '/loyalty', icon: Gift, label: 'Fidélité' },
  { to: '/news', icon: Newspaper, label: 'Actualités' },
  { to: '/settings', icon: Settings, label: 'Boutique' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    prefetchEssentials(queryClient)
  }, [queryClient])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-white/10 bg-ink-900">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/20">
            <Gem className="h-5 w-5 text-gold-400" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-white">Luxury Art</p>
            <p className="text-xs text-zinc-500">Administration</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onMouseEnter={() => prefetchRoute(queryClient, to)}
              onFocus={() => prefetchRoute(queryClient, to)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-gold-500/15 text-gold-300'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
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
        <div className="flex items-center justify-between border-b border-white/10 bg-ink-950/80 px-8 py-5 backdrop-blur">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white">Tableau de bord</h1>
            <p className="text-sm text-zinc-500">Gestion de la boutique Luxury Art</p>
          </div>
          <OrderNotificationsBell />
        </div>
        <div className="p-8">
          <StockAlertsBanner />
          <Outlet />
        </div>
      </main>
    </div>
  )
}
