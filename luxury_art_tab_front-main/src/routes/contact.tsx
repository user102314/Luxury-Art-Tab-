import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { BackButton } from '@/components/BackButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { useSiteSettings } from '@/hooks/useStorefrontQueries'
import { formatShopAddress, whatsappHref } from '@/lib/siteSettings'
import { Reveal } from '@/components/Reveal'
import { PAGE_COPY, buildSeoHead, SITE } from '@/lib/seo'

export const Route = createFileRoute('/contact')({
  head: () =>
    buildSeoHead({
      title: PAGE_COPY.contact.title,
      description: PAGE_COPY.contact.description,
      path: '/contact',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: PAGE_COPY.contact.title,
        url: `${SITE.url}/contact`,
        isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
      },
    }),
  component: ContactPage,
})

function ContactPage() {
  const { data: settings } = useSiteSettings()
  const [loading, setLoading] = useState(false)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [sujet, setSujet] = useState('')
  const [message, setMessage] = useState('')

  const boutiqueNom = settings?.boutiqueNom?.trim() || 'Luxury Art'
  const contactEmail = settings?.emailContact?.trim()
  const phone = settings?.telephoneContact?.trim()
  const address = formatShopAddress(settings)
  const mapQuery = address || 'Tunisie'

  const wa = whatsappHref(
    settings?.whatsappNumber || settings?.telephoneContact,
    `Bonjour ${boutiqueNom}, j'aimerais des informations.`,
  )

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
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-beige/25 font-[Inter,sans-serif] flex flex-col">
      <SiteNav />
      <div className="flex-1 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <BackButton fallbackTo="/" className="mb-6" />
          {/* Trois colonnes de largeur égale : coordonnées · formulaire · carte */}
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3 lg:gap-8">
            {/* 1 — coordonnées */}
            <Reveal className="flex flex-col justify-center">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground lg:text-5xl">
                {PAGE_COPY.contact.h1}
              </h1>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {PAGE_COPY.contact.intro}
              </p>
              <div className="mt-8 space-y-5">
                <div className="rounded-2xl border border-accent-green/30 bg-accent-green/5 p-5">
                  <h3 className="font-display text-lg font-semibold text-accent-green">Réponse rapide</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Messages traités en direct via notre plateforme admin.
                  </p>
                </div>

                {contactEmail && (
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">Email</h3>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="mt-2 inline-flex items-center gap-2 text-muted-foreground transition hover:text-brand-red"
                    >
                      <Mail className="h-4 w-4" />
                      {contactEmail}
                    </a>
                  </div>
                )}

                {phone && (
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">Téléphone</h3>
                    <a
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="mt-2 inline-flex items-center gap-2 text-muted-foreground transition hover:text-brand-red"
                    >
                      <Phone className="h-4 w-4" />
                      {phone}
                    </a>
                  </div>
                )}

                {wa && (
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">WhatsApp</h3>
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-muted-foreground transition hover:text-accent-green"
                    >
                      <Phone className="h-4 w-4" />
                      {settings?.whatsappNumber?.trim() || phone}
                    </a>
                  </div>
                )}

                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">Adresse</h3>
                  <p className="mt-2 inline-flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
                    <span className="font-medium text-foreground">{mapQuery}</span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Atelier &amp; showroom au cœur de Monastir — venez découvrir nos tableaux en
                    vrai, ou commandez en ligne pour une livraison partout en Tunisie.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* 2 — formulaire */}
            <Reveal
              delay={120}
              className="rounded-3xl border border-foliage/5 bg-sand/60 p-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.4)] lg:p-7"
            >
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom complet *</Label>
                  <Input
                    id="nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Votre nom"
                    required
                    className="bg-sand/80 border-border/40 focus-visible:ring-brand-red rounded-xl"
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
                    className="bg-sand/80 border-border/40 focus-visible:ring-brand-red rounded-xl"
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
                    className="bg-sand/80 border-border/40 focus-visible:ring-brand-red rounded-xl"
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
                    className="min-h-[150px] bg-sand/80 border-border/40 focus-visible:ring-brand-red rounded-xl resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-red hover:bg-brand-red/90 text-sand rounded-xl py-6 text-base font-semibold shadow-md"
                >
                  {loading ? 'Envoi...' : 'Envoyer le message'}
                </Button>
              </form>
            </Reveal>

            {/* 3 — carte, troisième colonne à droite du formulaire */}
            <Reveal
              delay={240}
              className="flex flex-col overflow-hidden rounded-3xl border border-foliage/5 bg-sand/60 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.4)]"
            >
              <div className="px-6 pb-4 pt-5">
                <h3 className="font-display text-lg font-semibold text-foreground">Nous trouver</h3>
                <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-red" />
                  {mapQuery}
                </p>
              </div>
              {/* flex-1 : la carte remplit la hauteur laissée par la colonne la plus haute */}
              <div className="relative min-h-[280px] w-full flex-1 bg-muted">
                <iframe
                  title={`Carte — ${mapQuery}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=14&hl=fr&output=embed`}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 border-t border-foliage/5 py-3 text-xs font-semibold text-foreground transition hover:text-brand-red"
              >
                <MapPin className="h-3.5 w-3.5" />
                Ouvrir dans Maps
              </a>
            </Reveal>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
