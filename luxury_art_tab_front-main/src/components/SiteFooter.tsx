import { Link } from '@tanstack/react-router'
import { PaintSplash, PaintStroke } from '@/components/ArtDecor'

export function SiteFooter() {
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
          <Link to="/" className="font-display text-2xl font-bold tracking-tight text-[#f4a15d]">
            Luxury Art Tab
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#eadcc9]">
            Tableaux décoratifs pour salon et cuisine, imprimés avec soin pour un rendu élégant et durable.
          </p>
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
          <h4 className="text-sm font-semibold uppercase tracking-widest text-[#f7efe2]">Services</h4>
          <div className="mt-4 flex flex-col gap-2 text-sm text-[#eadcc9]">
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
          </div>
        </div>
      </div>

      <div className="relative z-[1] mx-auto mt-10 flex max-w-7xl flex-col items-start justify-between gap-3 border-t border-white/15 pt-6 text-xs text-[#d9c8b3] md:flex-row md:items-center">
        <p>© 2026 Luxury Art Tab. Tous droits réservés.</p>
        <p>Fait avec passion pour votre décoration murale.</p>
      </div>
    </footer>
  )
}
