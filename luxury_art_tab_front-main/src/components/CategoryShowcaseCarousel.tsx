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
        <div className="h-56 animate-pulse rounded-2xl bg-[#3b2418]/40 md:h-64" />
      </div>
    )
  }

  if (slides.length === 0) return null

  const current = slides[index] ?? slides[0]

  return (
    <section className="relative mt-12 max-w-4xl overflow-visible rounded-2xl bg-[#3b2418] text-[#f7efe2] shadow-[0_20px_40px_-24px_rgba(59,36,24,0.5)] md:mt-16 md:mx-auto">
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
                  <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-8">
                    <Link
                      to="/products/$id"
                      params={{ id: String(slide.product.id) }}
                      className="group relative mx-auto block w-full max-w-[200px] md:mx-0 md:max-w-[220px]"
                    >
                      <div className="relative z-[1] flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#2a1a12] p-2.5">
                        <img
                          src={image}
                          alt={slide.product.nom}
                          className="max-h-full max-w-full object-contain transition duration-500 group-hover:scale-[1.02]"
                        />
                      </div>
                    </Link>

                    <div className="relative flex flex-col justify-center pb-1 md:pb-0 md:pr-10">
                      <div
                        className="mb-2.5 h-0.5 w-8 rounded-full bg-[#f4a15d]"
                        aria-hidden
                      />
                      <h3 className="font-display text-2xl font-bold tracking-tight text-[#f7efe2] md:text-3xl">
                        {slide.nom}
                      </h3>
                      {slide.description ? (
                        <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-[#f7efe2]/75 line-clamp-3">
                          {slide.description}
                        </p>
                      ) : (
                        <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-[#f7efe2]/75">
                          Découvrez nos œuvres de la catégorie {slide.nom}.
                        </p>
                      )}
                      <div className="mt-4">
                        <Link
                          to="/products"
                          search={{ category: String(slide.categoryId) }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#f4a15d]/45 bg-[#f4a15d]/15 px-4 py-2 text-sm font-semibold text-[#f4a15d] transition hover:bg-[#f4a15d]/25"
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
                className="absolute left-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#3b2418] text-[#f7efe2] transition hover:border-[#f4a15d]/50 hover:text-[#f4a15d] md:-left-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Catégorie suivante"
                className="absolute right-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#3b2418] text-[#f7efe2] transition hover:border-[#f4a15d]/50 hover:text-[#f4a15d] md:-right-1"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          {slides.map((slide, dotIndex) => (
            <button
              key={slide.categoryId}
              type="button"
              onClick={() => goTo(dotIndex)}
              className={`h-1 rounded-full transition-all duration-300 ${
                dotIndex === index ? 'w-6 bg-[#f4a15d]' : 'w-1 bg-[#f7efe2]/25'
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
