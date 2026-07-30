import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Heart, MessageCircle } from 'lucide-react'
import { PaintSplash, PaintStroke } from '@/components/ArtDecor'
import { useActiveTestimonials } from '@/hooks/useStorefrontQueries'
import type { Testimonial, TestimonialPlateforme } from '@/types/api'

/** Chaque plateforme reçoit une teinte de la charte, jamais sa couleur de marque. */
const PLATFORM_STYLE: Record<
  TestimonialPlateforme,
  { label: string; accent: string; bubble: string }
> = {
  MESSENGER: {
    label: 'Messenger',
    accent: 'bg-sage',
    bubble: 'bg-sand text-taupe',
  },
  WHATSAPP: {
    label: 'WhatsApp',
    accent: 'bg-foliage',
    bubble: 'bg-sand text-taupe',
  },
  INSTAGRAM: {
    label: 'Instagram',
    accent: 'bg-gradient-to-r from-gold via-taupe to-foliage',
    bubble: 'bg-sand text-taupe',
  },
  FACEBOOK: {
    label: 'Facebook',
    accent: 'bg-taupe',
    bubble: 'bg-sand text-taupe',
  },
  AUTRE: {
    label: 'Avis',
    accent: 'bg-gold',
    bubble: 'bg-sand text-taupe',
  },
}

function resolveSrc(url?: string) {
  if (!url) return undefined
  if (url.startsWith('http') || url.startsWith('data:')) return url
  return url.startsWith('/') ? url : `/${url}`
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

const AUTOPLAY_MS = 5000

/** 3 avis par vue sur desktop, 2 sur tablette, 1 sur mobile. */
function usePerView() {
  const [perView, setPerView] = useState(3)

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth
      setPerView(w >= 1024 ? 3 : w >= 640 ? 2 : 1)
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  return perView
}

export function TestimonialsSection() {
  const { data: items = [], isLoading } = useActiveTestimonials()
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const perView = usePerView()

  const list = useMemo(
    () => [...items].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)),
    [items],
  )

  const maxIndex = Math.max(0, list.length - perView)

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex))
  }, [maxIndex])

  useEffect(() => {
    if (paused || maxIndex === 0) return
    const id = window.setInterval(
      () => setIndex((i) => (i >= maxIndex ? 0 : i + 1)),
      AUTOPLAY_MS,
    )
    return () => window.clearInterval(id)
  }, [paused, maxIndex])

  if (isLoading || list.length === 0) return null

  const goTo = (next: number) => setIndex(Math.min(Math.max(next, 0), maxIndex))

  return (
    <section
      id="avis-clients"
      className="relative scroll-mt-24 overflow-hidden bg-foliage px-4 py-16 text-sand md:px-6 md:py-24"
    >
      <PaintSplash
        color="orange"
        opacity={0.35}
        rotate={-12}
        className="-left-10 -top-8 hidden h-40 w-40 md:block"
      />
      <PaintStroke
        color="beige"
        opacity={0.28}
        rotate={4}
        className="-right-16 bottom-8 hidden h-14 w-64 lg:block"
      />

      <div className="relative z-[1] mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-gold">
            Preuves sociales
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
            Vos retours, <em className="text-gold">notre motivation</em>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-beige md:text-lg">
            Messages WhatsApp, Messenger et Instagram de vraies clientes — ce qui nous pousse
            chaque jour à créer des tableaux encore plus beaux.
          </p>
        </div>

        {/* Carrousel : la piste glisse d'un avis à la fois */}
        <div
          className="relative mt-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div className="overflow-hidden">
            <div
              className="-mx-2.5 flex items-stretch transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
            >
              {list.map((t, i) => (
                <div
                  key={t.id}
                  className="shrink-0 px-2.5"
                  style={{ flexBasis: `${100 / perView}%` }}
                  aria-hidden={i < index || i >= index + perView}
                >
                  <TestimonialCard
                    item={t}
                    featured={i === 0}
                    onOpenImage={(src) => setLightbox(src)}
                  />
                </div>
              ))}
            </div>
          </div>

          {maxIndex > 0 && (
            <>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                aria-label="Avis précédents"
                className="absolute -left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-sand/25 bg-sand/10 text-sand backdrop-blur transition hover:border-gold hover:text-gold disabled:opacity-30 lg:-left-5"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={index === maxIndex}
                aria-label="Avis suivants"
                className="absolute -right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-sand/25 bg-sand/10 text-sand backdrop-blur transition hover:border-gold hover:text-gold disabled:opacity-30 lg:-right-5"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="mt-8 flex items-center justify-center gap-1.5">
                {Array.from({ length: maxIndex + 1 }, (_, dot) => (
                  <button
                    key={dot}
                    type="button"
                    onClick={() => goTo(dot)}
                    aria-label={`Aller à l'avis ${dot + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      dot === index ? 'w-7 bg-gold' : 'w-1.5 bg-sand/30'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-foliage/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}

function TestimonialCard({
  item,
  featured,
  onOpenImage,
}: {
  item: Testimonial
  featured?: boolean
  onOpenImage: (src: string) => void
}) {
  const style = PLATFORM_STYLE[item.plateforme] ?? PLATFORM_STYLE.AUTRE
  const image = resolveSrc(item.imageUrl)
  const avatar = resolveSrc(item.avatarUrl)

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-3xl border border-sand/15 bg-sand/10 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.55)] ${
        featured ? 'ring-1 ring-gold/35' : ''
      }`}
    >
      <div className="flex flex-col items-center gap-2 border-b border-sand/10 px-4 py-4 text-center">
        <div className="relative">
          {avatar ? (
            <img src={avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold">
              {initials(item.clientNom)}
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-foliage ${style.accent}`}
            title={style.label}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sand">{item.clientNom}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-gold/90">
            <MessageCircle className="h-3 w-3" />
            {style.label}
          </p>
        </div>
      </div>

      {image && (
        <button
          type="button"
          className="flex w-full flex-1 items-start justify-center bg-sand/5 px-3 py-3"
          onClick={() => onOpenImage(image)}
          aria-label="Agrandir la capture"
        >
          <img
            src={image}
            alt={`Avis de ${item.clientNom}`}
            className="mx-auto max-h-[380px] w-auto max-w-full rounded-xl object-contain transition hover:opacity-95"
            loading="lazy"
          />
        </button>
      )}

      <div className="flex flex-col items-center gap-3 px-4 py-5 text-center">
        {item.message && (
          <div
            className={`relative w-full max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${style.bubble}`}
          >
            {item.message}
            <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-sand px-1.5 py-0.5 text-[10px] shadow-sm">
              <Heart className="h-2.5 w-2.5 fill-brand-red text-brand-red" />
              1
            </span>
          </div>
        )}
        {item.reponseBoutique && (
          <div className="w-full max-w-[88%] rounded-2xl bg-gold px-4 py-3 text-sm leading-relaxed text-sand">
            {item.reponseBoutique}
          </div>
        )}
      </div>
    </article>
  )
}
