import { createFileRoute, Link } from '@tanstack/react-router'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'
import { usePublishedNews } from '@/hooks/useStorefrontQueries'

export const Route = createFileRoute('/actualites')({
  component: ActualitesPage,
})

function ActualitesPage() {
  const { data: news = [], isLoading } = usePublishedNews()

  return (
    <main className="min-h-screen bg-background font-[Inter,sans-serif]">
      <SiteNav />

      <div className="border-b border-border/40 bg-gradient-to-r from-[#3b2418] to-[#2f1b12] px-6 py-16 text-[#f7efe2] md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-accent-green">
            Blog & Inspiration
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
            Actualités <em className="text-[#f4a15d]">Luxury Art</em>
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-16 md:px-10">
        {isLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-20 text-center">
            <p className="font-display text-xl font-semibold">Aucune publication pour le moment</p>
            <Link to="/" className="mt-4 inline-block text-brand-red font-semibold hover:underline">
              Retour à l&apos;accueil
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {news.map((article, i) => (
              <article
                key={article.id}
                className="animate-card-rise overflow-hidden rounded-3xl border border-border/60 bg-white/70 shadow-lg"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {article.imageUrl && (
                  <div className="aspect-[21/9] overflow-hidden">
                    <img
                      src={article.imageUrl}
                      alt={article.titre}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="p-8 md:p-10">
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider">
                    <span className="rounded-full bg-accent-green/15 px-3 py-1 font-bold text-accent-green">
                      {article.auteurNom ?? 'Luxury Art'}
                    </span>
                    {article.publishedAt && (
                      <span className="text-muted-foreground">
                        {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-4 font-display text-3xl font-bold text-foreground">
                    {article.titre}
                  </h2>
                  {article.resume && (
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                      {article.resume}
                    </p>
                  )}
                  <div className="mt-6 prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap">
                    {article.contenu}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </main>
  )
}
