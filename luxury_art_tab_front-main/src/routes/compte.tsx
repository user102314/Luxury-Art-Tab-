import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Gift, LogOut } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { useAuth } from '@/context/AuthContext'
import { formatPrice } from '@/lib/pricing'

export const Route = createFileRoute('/compte')({
  component: ComptePage,
})

function ComptePage() {
  const { client, logout, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <SiteNav />
        <div className="px-6 py-32 text-center text-muted-foreground">Chargement…</div>
      </main>
    )
  }

  if (!client) {
    return (
      <main className="min-h-screen bg-background">
        <SiteNav />
        <div className="mx-auto max-w-md px-6 py-32 text-center">
          <p className="text-muted-foreground">Connectez-vous pour voir votre profil fidélité</p>
          <Link to="/signin" className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground">
            Se connecter
          </Link>
        </div>
        <SiteFooter />
      </main>
    )
  }

  const progress = client.commandesRequises
    ? Math.min(100, ((client.commandesCycle ?? 0) / client.commandesRequises) * 100)
    : 0

  const handleLogout = () => {
    logout()
    navigate({ to: '/' })
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Mon profil</h1>
            <p className="mt-1 text-muted-foreground">{client.nom} · {client.email}</p>
          </div>
          <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted">
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-[#f4a15d]/30 bg-gradient-to-br from-[#3b2418] to-[#2f1b12] p-6 text-[#f7efe2]">
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-[#f4a15d]" />
            <div>
              <p className="text-sm opacity-80">Programme actif</p>
              <p className="font-display text-xl font-bold">{client.programmeNom ?? 'Fidélité Luxury Art'}</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span>Progression vers la prochaine récompense</span>
              <span>{client.commandesCycle ?? 0} / {client.commandesRequises ?? '—'} commandes livrées</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-black/30">
              <div className="h-full rounded-full bg-[#f4a15d] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{client.tableauxGratuits ?? 0}</p>
            <p className="text-xs text-muted-foreground">Tableaux gratuits</p>
          </div>
          <div className="rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{formatPrice(client.reductionDisponible ?? 0)}</p>
            <p className="text-xs text-muted-foreground">Réduction disponible</p>
          </div>
          <div className="rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{client.totalRecompenses ?? 0}</p>
            <p className="text-xs text-muted-foreground">Récompenses gagnées</p>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Les récompenses sont créditées automatiquement quand vos commandes passent au statut <strong>livrée</strong>.
        </p>
        <div className="mt-4 text-center">
          <Link to="/products" className="text-brand-red font-semibold hover:underline">Continuer mes achats →</Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
