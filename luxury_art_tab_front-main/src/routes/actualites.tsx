import { useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarDays, Megaphone, Newspaper } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { TestimonialsSection } from '@/components/TestimonialsSection'
import { AboutBand } from '@/components/AboutBand'
import { usePublishedNews } from '@/hooks/useStorefrontQueries'
import { Reveal } from '@/components/Reveal'
import { RemoteImage } from '@/components/RemoteImage'
import type { News } from '@/types/api'

export const Route = createFileRoute('/actualites')({
  component: ActualitesPage,
})

function formatDate(value?: string) {
  if (!value) return null
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function ActualitesPage() {
  const { data: news = [], isLoading } = usePublishedNews()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const featuredRef = useRef<HTMLDivElement>(null)

  // Le grand bloc affiche la dernière publication, ou celle choisie dans le sommaire.
  const featured = news.find((n) => n.id === selectedId) ?? news[0]
  const others = news.filter((n) => n.id !== featured?.id)
  const isLatest = featured?.id === news[0]?.id

  const select = (id: number) => {
    setSelectedId(id)
    featuredRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="flex min-h-screen flex-col bg-beige/25 font-[Inter,sans-serif]">
      <SiteNav />

      <div className="border-b border-border/40 bg-gradient-to-r from-foliage via-foliage to-taupe px-6 py-16 text-sand md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="inline-flex items-center gap-2 font-display text-sm uppercase tracking-[0.25em] text-gold">
            <Megaphone className="h-4 w-4" />
            Soldes &amp; informations
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
            Actualités <em className="text-gold">Luxury Art</em>
          </h1>
          <p className="mt-4 max-w-2xl text-sand/80">
            Promotions, nouvelles collections et annonces de la boutique — tout ce qu&apos;il ne
            faut pas manquer.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 py-14 md:px-10">
        {isLoading ? (
          <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
            <div className="h-[520px] animate-pulse rounded-3xl bg-muted" />
            <div className="space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          </div>
        ) : !featured ? (
          <div className="rounded-3xl border border-dashed border-border py-20 text-center">
            <p className="font-display text-xl font-semibold">Aucune publication pour le moment</p>
            <Link to="/" className="mt-4 inline-block font-semibold text-brand-red hover:underline">
              Retour à l&apos;accueil
            </Link>
          </div>
        ) : (
          <div
            ref={featuredRef}
            className="grid scroll-mt-24 items-start gap-8 lg:grid-cols-[1.7fr_1fr]"
          >
            <Reveal>
              <FeaturedArticle article={featured} isLatest={isLatest} />
            </Reveal>

            {others.length > 0 && (
              <Reveal delay={120} className="lg:sticky lg:top-24">
                <aside>
                  <h2 className="mb-4 inline-flex items-center gap-2 font-display text-lg font-bold text-foreground">
                    <Newspaper className="h-4 w-4 text-gold" />
                    Autres publications
                    <span className="text-sm font-semibold text-muted-foreground">
                      {others.length}
                    </span>
                  </h2>
                  <ul className="space-y-3">
                    {others.map((article) => (
                      <li key={article.id}>
                        <SummaryCard article={article} onSelect={() => select(article.id)} />
                      </li>
                    ))}
                  </ul>
                </aside>
              </Reveal>
            )}
          </div>
        )}
      </div>

      {/* Preuve sociale en fin de page : les vrais avis clients */}
      <TestimonialsSection />

      {/* Bande claire : sépare les avis du footer, tous deux en feuillage */}
      <AboutBand />

      <SiteFooter />
    </main>
  )
}

function FeaturedArticle({ article, isLatest }: { article: News; isLatest: boolean }) {
  const date = formatDate(article.publishedAt ?? article.createdAt)

  return (
    <article className="overflow-hidden rounded-[2rem] bg-sand/70 shadow-[0_30px_60px_-40px_rgba(74,93,79,0.75)] ring-1 ring-gold/35">
      {article.imageUrl && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <RemoteImage
            src={article.imageUrl}
            alt={article.titre}
            priority
            className="h-full w-full object-cover"
          />
          <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-gold px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-sand shadow-lg">
            {isLatest && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sand opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sand" />
              </span>
            )}
            {isLatest ? 'Dernière publication' : 'Publication'}
          </span>
        </div>
      )}

      <div className="p-7 md:p-10">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider">
          <span className="rounded-full bg-accent/25 px-3 py-1 font-bold text-foreground">
            {article.auteurNom ?? 'Luxury Art'}
          </span>
          {date && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {date}
            </span>
          )}
        </div>

        <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
          {article.titre}
        </h2>

        {article.resume && (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{article.resume}</p>
        )}

        <div className="mt-6 whitespace-pre-wrap leading-relaxed text-foreground/90">
          {article.contenu}
        </div>
      </div>
    </article>
  )
}

function SummaryCard({ article, onSelect }: { article: News; onSelect: () => void }) {
  const date = formatDate(article.publishedAt ?? article.createdAt)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full gap-4 rounded-2xl border border-border/60 bg-sand/60 p-3 text-left transition hover:border-gold/60 hover:bg-sand"
    >
      {article.imageUrl ? (
        <RemoteImage
          src={article.imageUrl}
          alt=""
          aria-hidden
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Newspaper className="h-5 w-5 text-muted-foreground" />
        </span>
      )}

      <div className="min-w-0 py-0.5">
        {date && (
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{date}</p>
        )}
        <h3 className="mt-0.5 line-clamp-2 font-display font-bold text-foreground transition group-hover:text-gold">
          {article.titre}
        </h3>
        {article.resume && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{article.resume}</p>
        )}
      </div>
    </button>
  )
}
