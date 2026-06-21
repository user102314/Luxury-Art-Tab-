import { TrendingUp, ShoppingBag, Package, Users } from 'lucide-react'
import { formatCurrency } from '../lib/api'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: typeof TrendingUp
  trend?: string
  accent?: 'gold' | 'emerald' | 'blue' | 'purple'
}

const accents = {
  gold: 'from-gold-500/20 to-gold-600/5 text-gold-400',
  emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400',
  blue: 'from-blue-500/20 to-blue-600/5 text-blue-400',
  purple: 'from-purple-500/20 to-purple-600/5 text-purple-400',
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = 'gold',
}: StatCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
          <p className="mt-2 font-display text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
          {trend && <p className="mt-2 text-xs text-emerald-400">{trend}</p>}
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accents[accent]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

export { TrendingUp, ShoppingBag, Package, Users, formatCurrency }
