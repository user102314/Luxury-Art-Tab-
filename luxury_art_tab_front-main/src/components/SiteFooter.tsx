import { Link } from '@tanstack/react-router'
import { PaintSplash, PaintStroke } from '@/components/ArtDecor'
import { BrandLogo } from '@/components/BrandLogo'

export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-sand/10 bg-foliage px-6 pb-12 pt-12 text-sand md:px-10">
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
          <Link to="/" className="inline-block" aria-label="Luxury Art_Tab — Accueil">
            <BrandLogo size="md" onDark showByline />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-beige">
            Tableaux décoratifs pour salon et cuisine, imprimés avec soin pour un rendu élégant et
            durable.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-sand">Navigation</h4>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link
              to="/products"
              search={{ category: undefined }}
              className="text-beige transition hover:text-gold"
            >
              Tous les produits
            </Link>
            <a href="/#nouveautes" className="text-beige transition hover:text-gold">
              About Me
            </a>
            <Link to="/actualites" className="text-beige transition hover:text-gold">
              Actualités
            </Link>
            <Link to="/contact" className="text-beige transition hover:text-gold">
              Contact
            </Link>
            <a href="/#avis-clients" className="text-beige transition hover:text-gold">
              Avis des clients
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-sand">Services</h4>
          <div className="mt-4 flex flex-col gap-2 text-sm text-beige">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sage" />
              Livraison rapide
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Formats personnalisés
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-beige" />
              Réalité augmentée
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-[1] mx-auto mt-10 flex max-w-7xl flex-col items-start justify-between gap-3 border-t border-sand/15 pt-6 text-xs text-beige md:flex-row md:items-center">
        <p>© 2026 Luxury Art_Tab By Insaf. Tous droits réservés.</p>
        <p>Fait avec passion pour votre décoration murale.</p>
      </div>
    </footer>
  )
}
