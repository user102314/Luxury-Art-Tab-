import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export const Route = createFileRoute('/signup')({
  component: SignUpPage,
})

function SignUpPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [termsPreview, setTermsPreview] = useState('')
  const [programHint, setProgramHint] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getSiteSettings().then((s) => setTermsPreview(s.termsContent.slice(0, 400) + '…')).catch(() => {})
    api.getActiveLoyaltyProgram().then((p) => {
      if (!p) return
      setProgramHint(
        p.typeRecompense === 'FREE_TABLEAU'
          ? `Offre actuelle : ${p.commandesRequises} commandes livrées = tableau gratuit !`
          : `Offre actuelle : ${p.commandesRequises} commandes livrées = ${p.valeurRecompense} DH offerts !`,
      )
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptTerms) {
      toast.error('Vous devez accepter les règles du site')
      return
    }
    setLoading(true)
    try {
      await register({ nom, email, motDePasse: password, telephone, acceptTerms: true })
      toast.success('Compte créé — bienvenue dans le club fidélité !')
      navigate({ to: '/compte' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Inscription impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-lg px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-foreground">Créer un compte</h1>
        <p className="mt-2 text-sm text-muted-foreground">Rejoignez le programme fidélité et gagnez des cadeaux</p>
        {programHint && (
          <div className="mt-4 rounded-xl border border-accent-green/30 bg-accent-green/10 px-4 py-3 text-sm text-accent-green">
            {programHint}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nom complet</label>
            <input className="w-full rounded-xl border border-border px-4 py-3" value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input type="email" className="w-full rounded-xl border border-border px-4 py-3" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Téléphone (optionnel)</label>
            <input className="w-full rounded-xl border border-border px-4 py-3" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Mot de passe</label>
            <input type="password" className="w-full rounded-xl border border-border px-4 py-3" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1" />
            <span>J&apos;accepte les règles du site web et le programme de fidélité Luxury Art Tab.</span>
          </label>
          {termsPreview && (
            <div className="max-h-32 overflow-y-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap">
              {termsPreview}
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà membre ?{' '}
          <Link to="/signin" className="font-semibold text-brand-red hover:underline">Se connecter</Link>
        </p>
      </div>
      <SiteFooter />
    </main>
  )
}
