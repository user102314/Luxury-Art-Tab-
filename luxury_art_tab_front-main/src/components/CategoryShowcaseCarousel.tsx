import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PaintSplash, PaintStroke } from '@/components/ArtDecor'
import { useCategoryShowcase } from '@/hooks/useStorefrontQueries'
import { getProductImage } from '@/lib/images'

const CYCLE_MS = 5000

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
        <div className="h-72 animate-pulse rounded-3xl bg-muted/60 md:h-80" />
      </div>
    )
  }

  if (slides.length === 0) return null

  const current = slides[index] ?? slides[0]

  return (
    <section className="relative mt-12 max-w-5xl overflow-visible bg-transparent md:mt-16 md:mx-auto">
      <PaintSplash
        color="orange"
        opacity={0.45}
        rotate={-18}
        className="-left-14 -top-14 hidden h-40 w-40 md:block"
      />
      <PaintStroke
        color="beige"
        opacity={0.4}
        rotate={8}
        flip
        className="-right-16 -bottom-4 hidden h-14 w-60 md:block"
      />

      <div className="relative overflow-hidden px-5 py-8 md:px-10 md:py-10">
        <div className="relative">
          <div className="relative overflow-hidden">
            {slides.map((slide, i) => {
              const image = getProductImage(slide.product)
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
                  <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10">
                    <Link
                      to="/products/$id"
                      params={{ id: String(slide.product.id) }}
                      className="group relative mx-auto block w-full max-w-[240px] md:mx-0 md:max-w-[280px]"
                    >
                      <div className="relative z-[1] flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-white/50 p-3 shadow-sm">
                        <img
                          src={image}
                          alt={slide.product.nom}
                          className="max-h-full max-w-full object-contain transition duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                    </Link>

                    <div className="relative flex flex-col justify-center pb-1 md:pb-0 md:pr-12">
                      <div
                        className="mb-3 h-0.5 w-10 rounded-full bg-[#f4a15d]"
                        aria-hidden
                      />
                      <h3 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        {slide.nom}
                      </h3>
                      {slide.description ? (
                        <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground line-clamp-3">
                          {slide.description}
                        </p>
                      ) : (
                        <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
                          Découvrez nos œuvres de la catégorie {slide.nom}.
                        </p>
                      )}
                      <div className="mt-5">
                        <Link
                          to="/products"
                          search={{ category: String(slide.categoryId) }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#f4a15d]/50 bg-[#f4a15d]/10 px-5 py-2.5 text-base font-semibold text-[#c9783a] transition hover:bg-[#f4a15d]/20"
                        >
                          Explorer la catégorie
                          <span aria-hidden>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <div
              className="pointer-events-none invisible grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10"
              aria-hidden
            >
              <div className="mx-auto w-full max-w-[240px] md:mx-0 md:max-w-[280px]">
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
                className="absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/80 text-foreground shadow-sm transition hover:border-[#f4a15d]/50 hover:text-[#f4a15d] md:-left-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Catégorie suivante"
                className="absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/80 text-foreground shadow-sm transition hover:border-[#f4a15d]/50 hover:text-[#f4a15d] md:-right-2"
              >
                <ChevronRight className="h-5 w-5" />
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
                dotIndex === index ? 'w-7 bg-[#f4a15d]' : 'w-1.5 bg-foreground/20'
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
