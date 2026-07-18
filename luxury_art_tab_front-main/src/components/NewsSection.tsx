import { Link } from '@tanstack/react-router'
import { usePublishedNews } from '@/hooks/useStorefrontQueries'
import { PaintSplash, PaintStroke } from '@/components/ArtDecor'

export function NewsSection() {
  const { data: news = [], isLoading } = usePublishedNews()

  const latest = news.slice(0, 3)
  if (isLoading || latest.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-background px-6 py-16 md:py-24">
      {/* Corner accents — leave center free for content */}
      <PaintStroke
        color="beige"
        opacity={0.5}
        rotate={-8}
        float
        className="-left-20 top-10 hidden h-20 w-72 md:block"
      />
      <PaintSplash
        color="orange"
        opacity={0.35}
        rotate={15}
        floatSlow
        className="-right-14 top-8 hidden h-40 w-40 lg:block"
      />
      <PaintSplash
        color="brown"
        opacity={0.28}
        rotate={-20}
        flip
        className="-left-10 bottom-4 hidden h-36 w-36 md:block"
      />
      <PaintStroke
        color="orange"
        opacity={0.32}
        rotate={6}
        className="-right-16 bottom-10 hidden h-16 w-64 lg:block"
      />

      <div className="relative z-[1] mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.25em] text-accent-green">
              Actualités
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Dernières <em className="text-brand-red">publications</em>
            </h2>
          </div>
          <Link
            to="/actualites"
            className="rounded-full border-2 border-brand-red bg-brand-red px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-red/90"
          >
            Voir tout
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {latest.map((article, i) => (
            <article
              key={article.id}
              className="animate-card-rise overflow-hidden rounded-3xl border border-border/60 bg-white/60 shadow-lg"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {article.imageUrl && (
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={article.imageUrl.startsWith('/') ? article.imageUrl : article.imageUrl}
                    alt={article.titre}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-green">
                  {article.auteurNom ?? 'Luxury Art'}
                </p>
                <h3 className="mt-2 line-clamp-2 font-display text-xl font-bold text-foreground">
                  {article.titre}
                </h3>
                {article.resume && (
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{article.resume}</p>
                )}
                <Link
                  to="/actualites"
                  className="mt-4 inline-flex text-sm font-semibold text-brand-red hover:underline"
                >
                  Lire la suite →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
