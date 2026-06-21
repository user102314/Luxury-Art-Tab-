import { Link } from '@tanstack/react-router'
import { usePublishedNews } from '@/hooks/useStorefrontQueries'

export function NewsSection() {
  const { data: news = [], isLoading } = usePublishedNews()

  const latest = news.slice(0, 3)
  if (isLoading || latest.length === 0) return null

  return (
    <section className="bg-background px-6 py-24 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.25em] text-accent-green">
              Actualités
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
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
                <p className="text-xs uppercase tracking-wider text-accent-green font-semibold">
                  {article.auteurNom ?? 'Luxury Art'}
                </p>
                <h3 className="mt-2 font-display text-xl font-bold text-foreground line-clamp-2">
                  {article.titre}
                </h3>
                {article.resume && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{article.resume}</p>
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
