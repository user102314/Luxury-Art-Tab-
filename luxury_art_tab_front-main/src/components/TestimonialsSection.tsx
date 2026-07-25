import { useMemo, useState } from 'react'
import { Heart, MessageCircle } from 'lucide-react'
import { PaintSplash, PaintStroke } from '@/components/ArtDecor'
import { useActiveTestimonials } from '@/hooks/useStorefrontQueries'
import type { Testimonial, TestimonialPlateforme } from '@/types/api'

const PLATFORM_STYLE: Record<
  TestimonialPlateforme,
  { label: string; accent: string; bubble: string }
> = {
  MESSENGER: {
    label: 'Messenger',
    accent: 'bg-[#0084ff]',
    bubble: 'bg-[#e8f2ff] text-[#0b2c4a]',
  },
  WHATSAPP: {
    label: 'WhatsApp',
    accent: 'bg-[#25d366]',
    bubble: 'bg-[#e7f8ed] text-[#0f3d24]',
  },
  INSTAGRAM: {
    label: 'Instagram',
    accent: 'bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af]',
    bubble: 'bg-[#fff1f7] text-[#4a1830]',
  },
  FACEBOOK: {
    label: 'Facebook',
    accent: 'bg-[#1877f2]',
    bubble: 'bg-[#edf3ff] text-[#12284a]',
  },
  AUTRE: {
    label: 'Avis',
    accent: 'bg-[#f4a15d]',
    bubble: 'bg-[#fff6ec] text-[#3b2418]',
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

export function TestimonialsSection() {
  const { data: items = [], isLoading } = useActiveTestimonials()
  const [lightbox, setLightbox] = useState<string | null>(null)

  const list = useMemo(
    () => [...items].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)),
    [items],
  )

  if (isLoading || list.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-[#3b2418] px-4 py-16 text-[#f7efe2] md:px-6 md:py-24">
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
          <p className="font-display text-sm uppercase tracking-[0.25em] text-[#f4a15d]">
            Preuves sociales
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
            Vos retours, <em className="text-[#f4a15d]">notre motivation</em>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#eadcc9] md:text-lg">
            Messages WhatsApp, Messenger et Instagram de vraies clientes — ce qui nous pousse
            chaque jour à créer des tableaux encore plus beaux.
          </p>
        </div>

        <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {list.map((t, i) => (
            <TestimonialCard
              key={t.id}
              item={t}
              featured={i === 0}
              onOpenImage={(src) => setLightbox(src)}
            />
          ))}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
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
      className={`mb-5 break-inside-avoid overflow-hidden rounded-3xl border border-white/10 bg-[#2a1a12]/90 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.55)] ${
        featured ? 'ring-1 ring-[#f4a15d]/35' : ''
      }`}
    >
      <div className="flex flex-col items-center gap-2 border-b border-white/10 px-4 py-4 text-center">
        <div className="relative">
          {avatar ? (
            <img src={avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4a15d]/20 text-sm font-bold text-[#f4a15d]">
              {initials(item.clientNom)}
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#2a1a12] ${style.accent}`}
            title={style.label}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#f7efe2]">{item.clientNom}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-[#f4a15d]/90">
            <MessageCircle className="h-3 w-3" />
            {style.label}
          </p>
        </div>
      </div>

      {image && (
        <button
          type="button"
          className="flex w-full justify-center bg-black/20 px-3 py-3"
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
            <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 text-[10px] shadow-sm">
              <Heart className="h-2.5 w-2.5 fill-brand-red text-brand-red" />
              1
            </span>
          </div>
        )}
        {item.reponseBoutique && (
          <div className="w-full max-w-[88%] rounded-2xl bg-[#0084ff] px-4 py-3 text-sm leading-relaxed text-white">
            {item.reponseBoutique}
          </div>
        )}
      </div>
    </article>
  )
}
