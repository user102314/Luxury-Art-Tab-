import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

export const Route = createFileRoute('/contact')({
  component: ContactPage,
})

function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [sujet, setSujet] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim() || !email.trim() || !sujet.trim() || !message.trim()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    setLoading(true)
    try {
      await api.sendContact({ nom: nom.trim(), email: email.trim(), sujet: sujet.trim(), message: message.trim() })
      toast.success('Message envoyé !', { description: 'Nous vous répondrons très bientôt.' })
      setNom('')
      setEmail('')
      setSujet('')
      setMessage('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background font-[Inter,sans-serif] flex flex-col">
      <SiteNav />
      <div className="flex-1 py-16 px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="flex flex-col justify-center animate-word-in">
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                <span className="text-brand-red">Contactez</span>-nous
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Projet sur mesure, question sur une œuvre ou commande spéciale — notre équipe vous
                répond sous 24h.
              </p>
              <div className="mt-12 space-y-6">
                <div className="rounded-2xl border border-accent-green/30 bg-accent-green/5 p-5">
                  <h3 className="font-display text-lg font-semibold text-accent-green">Réponse rapide</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Messages traités en direct via notre plateforme admin.
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">Email</h3>
                  <p className="mt-2 text-muted-foreground">contact@luxuryart.com</p>
                </div>
              </div>
            </div>

            <div className="bg-white/60 p-8 rounded-3xl shadow-[0_10px_30px_-18px_rgba(0,0,0,0.4)] border border-black/5 animate-card-rise">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom complet *</Label>
                  <Input
                    id="nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Votre nom"
                    required
                    className="bg-white/80 border-border/40 focus-visible:ring-brand-red rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="bg-white/80 border-border/40 focus-visible:ring-brand-red rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet *</Label>
                  <Input
                    id="subject"
                    value={sujet}
                    onChange={(e) => setSujet(e.target.value)}
                    placeholder="Sujet de votre message"
                    required
                    className="bg-white/80 border-border/40 focus-visible:ring-brand-red rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Comment pouvons-nous vous aider ?"
                    required
                    className="min-h-[150px] bg-white/80 border-border/40 focus-visible:ring-brand-red rounded-xl resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-red hover:bg-brand-red/90 text-white rounded-xl py-6 text-base font-semibold shadow-md"
                >
                  {loading ? 'Envoi...' : 'Envoyer le message'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
