import { Link } from '@tanstack/react-router'
import { ArrowRight, Brush, Sparkles } from 'lucide-react'
import atelierProcess from '@/assets/decor/atelier-process.jpg'
import { PaintSplash, PaintStroke } from '@/components/ArtDecor'

/**
 * Bande « À propos » claire, pensée pour s'intercaler entre deux blocs
 * feuillage (avis clients / footer) et rompre la masse verte.
 */
export function AboutBand() {
  return (
    <section className="relative overflow-hidden border-y border-gold/25 bg-beige/45 px-6 py-16 md:py-20">
      <PaintStroke
        color="beige"
        opacity={0.45}
        rotate={-6}
        className="-left-24 top-8 hidden h-16 w-72 md:block"
      />
      <PaintSplash
        color="brown"
        opacity={0.25}
        rotate={14}
        floatSlow
        className="-right-12 bottom-0 hidden h-36 w-36 lg:block"
      />

      <div className="relative z-[1] mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1fr_1.05fr] md:gap-14">
        <div className="relative">
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-3 translate-y-3 rounded-3xl border border-gold/40"
          />
          <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-sand p-2 shadow-[0_28px_55px_-32px_rgba(74,93,79,0.65)]">
            <img
              src={atelierProcess}
              alt="Application de peinture à l'atelier"
              className="h-[260px] w-full rounded-2xl object-cover md:h-[340px]"
              loading="lazy"
            />
            <div className="absolute inset-x-2 bottom-2 rounded-b-2xl bg-gradient-to-t from-foliage/85 to-transparent p-5 pt-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                L&apos;atelier
              </p>
              <p className="mt-1 font-display text-lg font-bold text-sand">Chaque geste compte</p>
            </div>
          </div>
        </div>

        <div>
          <p className="inline-flex items-center gap-2 font-display text-sm uppercase tracking-[0.25em] text-gold">
            <Brush className="h-4 w-4" />À propos
          </p>

          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            L&apos;artiste derrière <em className="text-gold">chaque toile</em>
          </h2>

          <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
            Je crée des tableaux décoratifs inspirés du quotidien : des tons chauds, des formes
            organiques et des détails qui donnent une vraie présence à votre salon ou votre
            cuisine. Chaque pièce raconte une histoire simple, élégante et personnelle.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              'Impression premium et finitions soignées',
              'Formats personnalisés sur demande',
              'Conseils déco avant achat',
              'Livraison rapide partout en Tunisie',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/products"
              search={{ category: undefined }}
              className="group inline-flex items-center gap-2 rounded-full bg-foliage px-6 py-3 text-sm font-semibold text-sand transition hover:bg-foliage/90"
            >
              Voir la galerie
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-full border border-foliage/25 bg-sand px-6 py-3 text-sm font-semibold text-foreground transition hover:border-gold hover:text-gold"
            >
              Me contacter
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
