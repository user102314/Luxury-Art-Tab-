import { Clock3, Instagram, Mail, Phone, PlugZap, RefreshCw } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

const maintenanceEnd = import.meta.env.VITE_MAINTENANCE_END as string | undefined
const contactEmail =
  (import.meta.env.VITE_MAINTENANCE_EMAIL as string | undefined) ?? 'contact@luxuryart.tn'
const contactPhone =
  (import.meta.env.VITE_MAINTENANCE_PHONE as string | undefined) ?? '+216 00 000 000'

function formatEndDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

export function MaintenancePage() {
  const formattedEnd = formatEndDate(maintenanceEnd)

  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-hidden bg-sand text-foreground">
      <div
        aria-hidden
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 15%, color-mix(in oklab, var(--gold) 20%, transparent) 0, transparent 28%), radial-gradient(circle at 85% 80%, color-mix(in oklab, var(--sage) 32%, transparent) 0, transparent 32%)',
        }}
      />

      <header className="relative z-[1] mx-auto flex w-full max-w-7xl items-center justify-center px-6 py-7">
        <BrandLogo size="md" showByline />
      </header>

      <section className="relative z-[1] mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-gold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
          </span>
          Mise à jour en cours
        </span>

        <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight text-foliage sm:text-5xl md:text-6xl">
          Notre galerie se refait une <em className="text-gold">beauté</em>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-taupe md:text-lg">
          Nous préparons de nouvelles créations et améliorons votre expérience. Le site sera de
          nouveau disponible très bientôt.
        </p>

        <div className="my-10 flex w-full max-w-4xl items-center" aria-hidden>
          <span className="h-1 flex-1 rounded-full bg-gradient-to-r from-transparent to-gold" />
          <span className="relative mx-3 flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-sand shadow-[0_18px_45px_-22px_rgba(74,93,79,0.8)]">
            <PlugZap className="h-9 w-9 text-gold" />
            <span className="absolute inset-2 animate-pulse rounded-full border border-sage/40" />
          </span>
          <span className="h-1 flex-1 rounded-full bg-gradient-to-r from-sage to-transparent" />
        </div>

        <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
          <ContactCard
            icon={<Phone className="h-4 w-4" />}
            label="Téléphone"
            value={contactPhone}
            href={`tel:${contactPhone.replace(/\s/g, '')}`}
          />
          <ContactCard
            icon={<Mail className="h-4 w-4" />}
            label="E-mail"
            value={contactEmail}
            href={`mailto:${contactEmail}`}
          />
          <ContactCard
            icon={<Instagram className="h-4 w-4" />}
            label="Instagram"
            value="@luxury_art_tab"
            href="https://www.instagram.com/"
          />
        </div>

        {formattedEnd && (
          <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-taupe">
            <Clock3 className="h-4 w-4 text-sage" />
            Retour estimé : {formattedEnd}
          </p>
        )}

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-foliage px-6 py-3 text-sm font-semibold text-sand shadow-[0_18px_35px_-20px_rgba(74,93,79,0.9)] transition hover:-translate-y-0.5 hover:bg-foliage/90"
        >
          <RefreshCw className="h-4 w-4" />
          Vérifier si le site est disponible
        </button>
      </section>

      <footer className="relative z-[1] border-t border-beige/70 px-6 py-5 text-center text-xs text-taupe">
        © 2026 Luxury Art_Tab By Insaf · Merci pour votre patience
      </footer>
    </main>
  )
}

function ContactCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href: string
}) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      className="group rounded-2xl border border-beige bg-sand/80 p-4 text-left shadow-[0_15px_35px_-30px_rgba(74,93,79,0.8)] transition hover:-translate-y-0.5 hover:border-gold/50"
    >
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
        {icon}
        {label}
      </span>
      <span className="mt-2 block truncate text-sm font-semibold text-foliage group-hover:text-gold">
        {value}
      </span>
    </a>
  )
}
