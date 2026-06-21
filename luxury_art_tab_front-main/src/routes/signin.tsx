import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { useAuth } from '@/context/AuthContext'

export const Route = createFileRoute('/signin')({
  component: SignInPage,
})

function SignInPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Bienvenue !')
      navigate({ to: '/compte' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Connexion impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-foreground">Connexion</h1>
        <p className="mt-2 text-sm text-muted-foreground">Accédez à votre profil fidélité et vos récompenses</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input type="email" className="w-full rounded-xl border border-border px-4 py-3" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Mot de passe</label>
            <input type="password" className="w-full rounded-xl border border-border px-4 py-3" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore membre ?{' '}
          <Link to="/signup" className="font-semibold text-brand-red hover:underline">Créer un compte</Link>
        </p>
      </div>
      <SiteFooter />
    </main>
  )
}
