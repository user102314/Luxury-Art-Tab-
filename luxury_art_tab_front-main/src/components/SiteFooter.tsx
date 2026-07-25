import { Link } from '@tanstack/react-router'
import { Mail, MapPin, Phone } from 'lucide-react'
import { PaintSplash, PaintStroke } from '@/components/ArtDecor'
import { BrandLogo } from '@/components/BrandLogo'
import { useSiteSettings } from '@/hooks/useStorefrontQueries'
import { formatShopAddress, whatsappHref } from '@/lib/siteSettings'

export function SiteFooter() {
  const { data: settings } = useSiteSettings()
  const boutiqueNom = settings?.boutiqueNom?.trim() || 'Luxury Art_Tab'
  const slogan =
    settings?.slogan?.trim() ||
    'Tableaux décoratifs pour salon et cuisine, imprimés avec soin pour un rendu élégant et durable.'
  const address = formatShopAddress(settings)
  const email = settings?.emailContact?.trim()
  const phone = settings?.telephoneContact?.trim()
  const wa = whatsappHref(settings?.whatsappNumber || settings?.telephoneContact)

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/10 bg-[#2f1b12] px-6 py-12 text-[#f7efe2] md:px-10">
      <PaintSplash
        color="orange"
        opacity={0.25}
        rotate={25}
        className="-right-10 -top-8 hidden h-36 w-36 md:block"
      />
      <PaintStroke
        color="beige"
        opacity={0.22}
        rotate={-4}
        className="-left-16 bottom-8 hidden h-12 w-56 lg:block"
      />

      <div className="relative z-[1] mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
        <div>
          <Link to="/" aria-label={`${boutiqueNom} — Accueil`}>
            <BrandLogo onDark size="md" name={boutiqueNom} />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#eadcc9]">{slogan}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-[#f7efe2]">Navigation</h4>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link to="/products" className="text-[#eadcc9] transition hover:text-accent-green">
              Tous les produits
            </Link>
            <a href="/#galerie" className="text-[#eadcc9] transition hover:text-[#f4a15d]">
              Galerie
            </a>
            <Link to="/actualites" className="text-[#eadcc9] transition hover:text-brand-red">
              Actualités
            </Link>
            <Link to="/contact" className="text-[#eadcc9] transition hover:text-[#f4a15d]">
              Contact
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-[#f7efe2]">Contact</h4>
          <div className="mt-4 flex flex-col gap-3 text-sm text-[#eadcc9]">
            {email && (
              <a href={`mailto:${email}`} className="flex items-start gap-2 transition hover:text-[#f4a15d]">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#f4a15d]" />
                {email}
              </a>
            )}
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-start gap-2 transition hover:text-[#f4a15d]">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#f4a15d]" />
                {phone}
              </a>
            )}
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 transition hover:text-accent-green"
              >
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 self-center rounded-full bg-accent-green" />
                WhatsApp
              </a>
            )}
            {address && (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#f4a15d]" />
                {address}
              </p>
            )}
            {!email && !phone && !address && (
              <>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
                  Livraison rapide
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                  Formats personnalisés
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f4a15d]" />
                  Réalité augmentée
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-[1] mx-auto mt-10 flex max-w-7xl flex-col items-start justify-between gap-3 border-t border-white/15 pt-6 text-xs text-[#d9c8b3] md:flex-row md:items-center">
        <p>© {new Date().getFullYear()} {boutiqueNom}. Tous droits réservés.</p>
        <p>Fait avec passion pour votre décoration murale.</p>
      </div>
    </footer>
  )
}
