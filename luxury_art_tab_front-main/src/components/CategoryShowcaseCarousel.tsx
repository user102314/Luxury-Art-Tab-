import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PaintSplash, PaintStroke } from '@/components/ArtDecor'
import { useCategoryShowcase } from '@/hooks/useStorefrontQueries'
import { getProductImage, IMAGE_WIDTH } from '@/lib/images'
import { heroCategories } from '@/data/heroCategories'

const CYCLE_MS = 5000

/** Visuel de repli quand l'image produit est absente ou cassée. */
function fallbackFor(position: number) {
  return heroCategories[position % heroCategories.length]?.images[0] ?? '/placeholder-art.svg'
}

function handleImageError(fallback: string) {
  return (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    if (img.src !== fallback) img.src = fallback
  }
}

export function CategoryShowcaseCarousel() {
  const { data: slides = [], isLoading } = useCategoryShowcase()
  const [index, setIndex] = useState(0)
  const [pauseToken, setPauseToken] = useState(0)

  const goTo = useCallback(
    (next: number) => {
      if (slides.length === 0) return
      setIndex(((next % slides.length) + slides.length) % slides.length)
      setPauseToken((t) => t + 1)
    },
    [slides.length],
  )

  const goPrev = () => goTo(index - 1)
  const goNext = () => goTo(index + 1)

  useEffect(() => {
    if (slides.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, CYCLE_MS)
    return () => window.clearInterval(id)
  }, [slides.length, pauseToken])

  useEffect(() => {
    if (index >= slides.length) setIndex(0)
  }, [slides.length, index])

  if (isLoading) {
    return (
      <div className="mt-12 md:mt-16">
        <div className="h-56 animate-pulse rounded-2xl bg-muted md:h-64" />
      </div>
    )
  }

  if (slides.length === 0) return null

  const current = slides[index] ?? slides[0]

  return (
    <section className="relative mt-12 max-w-4xl overflow-visible rounded-[2rem] text-foreground shadow-[0_30px_70px_-45px_rgba(74,93,79,0.55)] ring-1 ring-gold/35 md:mt-16 md:mx-auto">
      {/* Panneau lumineux + halo doré : donne du relief sans réintroduire de bloc plein */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem]"
        style={{
          background:
            'radial-gradient(120% 90% at 15% 0%, var(--sand) 0%, color-mix(in oklab, var(--beige) 35%, var(--sand)) 55%, var(--beige) 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem]"
        style={{
          background:
            'radial-gradient(60% 70% at 90% 100%, color-mix(in oklab, var(--accent-orange) 22%, transparent), transparent 70%)',
        }}
      />
      <PaintSplash
        color="orange"
        opacity={0.45}
        rotate={-18}
        className="-left-12 -top-12 hidden h-32 w-32 md:block"
      />
      <PaintStroke
        color="beige"
        opacity={0.4}
        rotate={8}
        flip
        className="-right-14 -bottom-3 hidden h-12 w-52 md:block"
      />

      <div className="relative overflow-hidden rounded-2xl px-4 py-6 md:px-8 md:py-8">
        <div className="relative">
          <div className="relative overflow-hidden">
            {slides.map((slide, i) => {
              const image = getProductImage(slide.product, IMAGE_WIDTH.hero)
              return (
                <div
                  key={`${slide.categoryId}-${slide.product.id}`}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    i === index
                      ? 'z-10 translate-x-0 opacity-100 pointer-events-auto'
                      : i < index
                        ? 'z-0 -translate-x-6 opacity-0 pointer-events-none'
                        : 'z-0 translate-x-6 opacity-0 pointer-events-none'
                  }`}
                  aria-hidden={i !== index}
                >
                  <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-8">
                    <Link
                      to="/products/$id"
                      params={{ id: String(slide.product.id) }}
                      className="group relative mx-auto block w-full max-w-[200px] md:mx-0 md:max-w-[220px]"
                    >
                      {/* Cadre doré décalé derrière l'œuvre */}
                      <span
                        aria-hidden
                        className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl border-2 border-gold/55 transition-transform duration-500 group-hover:translate-x-4 group-hover:translate-y-4"
                      />
                      <div className="relative z-[1] flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-border bg-sand p-2.5 shadow-[0_22px_44px_-24px_rgba(74,93,79,0.6)] transition duration-500 group-hover:-translate-y-1">
                        <img
                          src={image}
                          alt={slide.product.ref}
                          loading="lazy"
                          decoding="async"
                          onError={handleImageError(fallbackFor(i))}
                          className="h-full w-full rounded-lg object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                      </div>
                    </Link>

                    <div className="relative flex flex-col justify-center pb-1 md:pb-0 md:pr-10">
                      <p className="mb-3 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
                        <span aria-hidden className="h-px w-7 bg-gold" />
                        Nos univers
                        <span className="text-muted-foreground">
                          {String(i + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                        </span>
                      </p>
                      <h3 className="font-display text-3xl font-bold capitalize tracking-tight text-foreground md:text-4xl">
                        {slide.nom}
                      </h3>
                      {slide.description ? (
                        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground line-clamp-3">
                          {slide.description}
                        </p>
                      ) : (
                        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                          Découvrez nos œuvres de la catégorie {slide.nom}.
                        </p>
                      )}
                      <div className="mt-5">
                        <Link
                          to="/products"
                          search={{ category: String(slide.categoryId) }}
                          className="group/cta inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-sand shadow-[0_14px_28px_-14px_rgba(199,161,88,0.9)] transition hover:brightness-105"
                        >
                          Explorer la catégorie
                          <span
                            aria-hidden
                            className="transition-transform duration-300 group-hover/cta:translate-x-1"
                          >
                            →
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <div
              className="pointer-events-none invisible grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-8"
              aria-hidden
            >
              <div className="mx-auto w-full max-w-[200px] md:mx-0 md:max-w-[220px]">
                <div className="aspect-[3/4] w-full" />
              </div>
              <div />
            </div>
          </div>

          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Catégorie précédente"
                className="absolute left-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-sand text-foreground shadow-[0_10px_22px_-14px_rgba(74,93,79,0.7)] transition hover:border-gold hover:bg-gold hover:text-sand md:-left-4"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Catégorie suivante"
                className="absolute right-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-sand text-foreground shadow-[0_10px_22px_-14px_rgba(74,93,79,0.7)] transition hover:border-gold hover:bg-gold hover:text-sand md:-right-4"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {slides.map((slide, dotIndex) => (
            <button
              key={slide.categoryId}
              type="button"
              onClick={() => goTo(dotIndex)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                dotIndex === index
                  ? 'w-8 bg-gold'
                  : 'w-1.5 bg-foreground/20 hover:bg-gold/50'
              }`}
              aria-label={slide.nom}
            />
          ))}
        </div>
      </div>

      <span className="sr-only">
        {current.nom}
        {current.description ? ` — ${current.description}` : ''}
      </span>
    </section>
  )
}
