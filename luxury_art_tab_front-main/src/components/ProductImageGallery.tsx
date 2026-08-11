import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Expand, Heart } from 'lucide-react'

type ProductImageGalleryProps = {
  images: string[]
  alt: string
  liked?: boolean
  onLike?: () => void
  /** URL image 2 (simulation) — le bouton AR n'apparaît que si définie */
  simulationImageUrl?: string | null
  onAr?: (imageUrl: string) => void
}

export function ProductImageGallery({
  images,
  alt,
  liked = false,
  onLike,
  simulationImageUrl,
  onAr,
}: ProductImageGalleryProps) {
  const gallery = images.length > 0 ? images : ['/placeholder-art.svg']
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    setActive(0)
  }, [gallery.join('|')])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + gallery.length) % gallery.length)
      if (e.key === 'ArrowRight') setActive((i) => (i + 1) % gallery.length)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightbox, gallery.length])

  const current = gallery[active] ?? gallery[0]
  const multi = gallery.length > 1

  const go = (dir: -1 | 1) => {
    if (!multi) return
    setActive((i) => (i + dir + gallery.length) % gallery.length)
  }

  return (
    <>
      <div className="flex gap-3 md:gap-4">
        {multi && (
          <div className="hidden max-h-[560px] w-[72px] shrink-0 flex-col gap-2 overflow-y-auto md:flex">
            {gallery.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                className={`aspect-square overflow-hidden rounded-lg border-2 transition ${
                  i === active
                    ? 'border-foliage ring-1 ring-foliage/30'
                    : 'border-transparent opacity-80 hover:opacity-100'
                }`}
                aria-label={`Image ${i + 1}`}
                aria-current={i === active}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-muted shadow-[0_18px_40px_-28px_rgba(80,30,10,0.45)]">
          <div className="relative aspect-[4/5] w-full sm:aspect-[5/6]">
            <img
              src={current}
              alt={alt}
              className="h-full w-full object-cover"
            />

            {onLike && (
              <button
                type="button"
                onClick={onLike}
                className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border bg-sand/90 shadow-sm transition ${
                  liked
                    ? 'border-brand-red text-brand-red'
                    : 'border-foliage/5 text-foreground hover:text-brand-red'
                }`}
                aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
              </button>
            )}

            {multi && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-sand/95 text-foreground shadow-md transition hover:scale-105"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-sand/95 text-foreground shadow-md transition hover:scale-105"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightbox(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-sand/95 text-foreground shadow-md transition hover:scale-105"
                aria-label="Agrandir"
              >
                <Expand className="h-4 w-4" />
              </button>
              {simulationImageUrl && onAr && (
                <button
                  type="button"
                  onClick={() => onAr(simulationImageUrl)}
                  className="flex items-center gap-2 rounded-full bg-accent-green px-4 py-2 text-sm font-semibold text-sand shadow-lg hover:opacity-90"
                >
                  Voir en AR
                </button>
              )}
            </div>
          </div>

          {multi && (
            <div className="flex gap-2 overflow-x-auto p-3 md:hidden">
              {gallery.map((src, i) => (
                <button
                  key={`m-${src}-${i}`}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === active ? 'border-foliage' : 'border-transparent opacity-75'
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-foliage/85 p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-sand/15 px-3 py-1 text-sm text-sand hover:bg-sand/25"
            onClick={() => setLightbox(false)}
          >
            Fermer
          </button>
          {multi && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(-1)
                }}
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-sand text-foreground"
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(1)
                }}
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-sand text-foreground"
                aria-label="Image suivante"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <img
            src={current}
            alt={alt}
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
