import { Link } from '@tanstack/react-router'
import { ArrowRight, CalendarDays, Megaphone } from 'lucide-react'
import { usePublishedNews } from '@/hooks/useStorefrontQueries'
import { PaintSplash, PaintStroke } from '@/components/ArtDecor'

function formatDate(value?: string) {
  if (!value) return null
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Annonce unique : soldes et informations importantes publiées par l'admin.
 * Seule la dernière publication est mise en avant, le reste renvoie vers
 * la page Actualités.
 */
export function NewsSection() {
  const { data: news = [], isLoading } = usePublishedNews()

  const featured = news[0]
  const othersCount = Math.max(news.length - 1, 0)

  if (isLoading || !featured) return null

  const publishedAt = formatDate(featured.publishedAt ?? featured.createdAt)

  return (
    <section className="relative overflow-hidden bg-background px-6 py-16 md:py-24">
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

      <div className="relative z-[1] mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="inline-flex items-center gap-2 font-display text-sm uppercase tracking-[0.25em] text-gold">
            <Megaphone className="h-4 w-4" />
            À ne pas manquer
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Dernière <em className="text-gold">publication</em>
          </h2>
        </div>

        {/* Bandeau d'annonce : cadre doré décalé pour attirer l'œil */}
        <div className="group relative">
          <span
            aria-hidden
            className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] border-2 border-gold/45 transition-transform duration-500 group-hover:translate-x-4 group-hover:translate-y-4 md:translate-x-4 md:translate-y-4"
          />

          <article className="relative overflow-hidden rounded-[2rem] bg-foliage shadow-[0_36px_70px_-40px_rgba(74,93,79,0.85)] ring-1 ring-gold/40">
            <div className="grid items-stretch md:grid-cols-2">
              {featured.imageUrl && (
                <div className="relative min-h-[240px] overflow-hidden md:min-h-[380px]">
                  <img
                    src={featured.imageUrl}
                    alt={featured.titre}
                    className="absolute inset-0 h-full w-full object-cover transition duration-[900ms] group-hover:scale-105"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-foliage via-foliage/25 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-foliage"
                  />
                </div>
              )}

              <div className="flex flex-col justify-center gap-4 p-7 md:p-10">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-gold px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-sand">
                    {/* Point pulsé : signale une info fraîche */}
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sand opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-sand" />
                    </span>
                    À la une
                  </span>
                  {publishedAt && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-beige">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {publishedAt}
                    </span>
                  )}
                </div>

                <h3 className="font-display text-3xl font-bold leading-tight text-sand md:text-4xl">
                  {featured.titre}
                </h3>

                {featured.resume && (
                  <p className="text-base leading-relaxed text-beige line-clamp-3">
                    {featured.resume}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Link
                    to="/actualites"
                    className="group/cta inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-sand shadow-[0_16px_30px_-16px_rgba(199,161,88,0.95)] transition hover:brightness-110"
                  >
                    Lire la publication
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                  </Link>

                  {othersCount > 0 && (
                    <Link
                      to="/actualites"
                      className="inline-flex items-center gap-2 rounded-full border border-sand/30 px-5 py-3 text-sm font-semibold text-sand transition hover:border-gold hover:text-gold"
                    >
                      Voir les {othersCount} autre{othersCount > 1 ? 's' : ''} publication
                      {othersCount > 1 ? 's' : ''}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
