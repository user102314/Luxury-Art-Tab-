import { useEffect, useRef, useState } from 'react'
import { Camera, Download, HelpCircle, Move, RotateCcw, X, ZoomIn, ZoomOut, Upload } from 'lucide-react'
import { toast } from 'sonner'

type ArViewerProps = {
  isOpen: boolean
  onClose: () => void
  imageSrc: string | null
}

export function ArViewer({ isOpen, onClose, imageSrc }: ArViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [fallbackImage, setFallbackImage] = useState<string | null>(null)
  const dragStart = useRef({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let stream: MediaStream | null = null

    if (isOpen) {
      setError(null)
      setPosition({ x: 0, y: 0 })
      setScale(1)
      setFallbackImage(null)

      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })
        .then((s) => {
          stream = s
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch((e) => {
              console.error('Erreur lecture vidéo:', e)
              setError('Impossible de lire le flux de la caméra.')
            })
          }
        })
        .catch((err) => {
          console.error('Erreur accès caméra:', err)
          setError(
            'Accès caméra non disponible. Vous pouvez importer une photo de votre mur pour continuer la simulation.'
          )
        })
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isOpen])

  if (!isOpen || !imageSrc) return null

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true)
    dragStart.current = { x: clientX - position.x, y: clientY - position.y }
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return
    setPosition({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y,
    })
  }

  const handleEnd = () => {
    setIsDragging(false)
  }

  const handleFallbackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setFallbackImage(url)
    setError(null)
  }

  // Capture photo instantanée du mur avec le tableau
  const handleCapturePhoto = async () => {
    try {
      setIsCapturing(true)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width
      canvas.height = height

      // 1. Dessiner le fond (vidéo ou image importée)
      if (videoRef.current && !fallbackImage) {
        ctx.drawImage(videoRef.current, 0, 0, width, height)
      } else if (fallbackImage) {
        const bgImg = new Image()
        bgImg.crossOrigin = 'anonymous'
        bgImg.src = fallbackImage
        await new Promise((resolve) => {
          bgImg.onload = resolve
          bgImg.onerror = resolve
        })
        ctx.drawImage(bgImg, 0, 0, width, height)
      } else {
        ctx.fillStyle = '#1A211C'
        ctx.fillRect(0, 0, width, height)
      }

      // 2. Dessiner le tableau à sa position exacte
      const artImg = new Image()
      artImg.crossOrigin = 'anonymous'
      artImg.src = imageSrc
      await new Promise((resolve) => {
        artImg.onload = resolve
        artImg.onerror = resolve
      })

      const baseWidth = Math.min(width * 0.7, 400) * scale
      const aspectRatio = artImg.naturalHeight / (artImg.naturalWidth || 1)
      const baseHeight = baseWidth * aspectRatio

      const centerX = width / 2 + position.x
      const centerY = height / 2 + position.y

      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
      ctx.shadowBlur = 24
      ctx.shadowOffsetY = 14
      ctx.drawImage(
        artImg,
        centerX - baseWidth / 2,
        centerY - baseHeight / 2,
        baseWidth,
        baseHeight
      )
      ctx.restore()

      // 3. Filigrane discret Luxury Art
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
      ctx.font = '14px Inter, sans-serif'
      ctx.fillText('Luxury Art — Simulation Mur', 20, height - 25)

      // Téléchargement
      const link = document.createElement('a')
      link.download = `simulation-mur-luxury-art-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Photo de votre mur enregistrée !')
    } catch (err) {
      console.error('Erreur capture photo:', err)
      toast.error('Impossible d’enregistrer la photo.')
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      {/* Flux vidéo caméra */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 h-full w-full object-cover ${fallbackImage ? 'hidden' : ''}`}
      />

      {/* Image de fond alternative si uploadée */}
      {fallbackImage && (
        <img
          src={fallbackImage}
          alt="Mur importé"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Message en cas de blocage de caméra */}
      {error && !fallbackImage && (
        <div className="absolute inset-x-4 top-1/2 z-30 mx-auto max-w-md -translate-y-1/2 rounded-3xl border border-gold/40 bg-foliage/90 p-6 text-center text-sand backdrop-blur-xl shadow-2xl">
          <Camera className="mx-auto h-12 w-12 text-gold opacity-90" />
          <h3 className="mt-3 font-display text-lg font-bold">Caméra indisponible</h3>
          <p className="mt-2 text-xs leading-relaxed text-sand/80">{error}</p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gold bg-gold px-6 py-2.5 text-xs font-bold text-sand shadow transition hover:brightness-110"
            >
              <Upload className="h-4 w-4" />
              Importer une photo de mon mur
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-sand/15 px-6 py-2 text-xs font-semibold text-sand transition hover:bg-sand/25"
            >
              Fermer
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFallbackUpload}
          />
        </div>
      )}

      {/* Guide et contrôles supérieurs */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-2 rounded-full bg-foliage/80 px-4 py-2 text-xs font-semibold text-sand backdrop-blur-md border border-gold/30 shadow-lg">
          <Move className="h-3.5 w-3.5 text-gold animate-pulse" />
          <span>Touchez et faites glisser le tableau sur votre mur</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleCapturePhoto}
            disabled={isCapturing}
            className="flex h-11 items-center gap-2 rounded-full bg-gold/90 px-4 text-xs font-bold text-sand backdrop-blur-md shadow-lg transition hover:scale-105 hover:bg-gold active:scale-95 disabled:opacity-50"
            title="Prendre une photo du mur avec le tableau"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Prendre photo</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-sand backdrop-blur-md border border-sand/20 transition hover:bg-black/90 active:scale-95"
            aria-label="Fermer l'aperçu AR"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Réticule de niveau discret au centre */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-20">
        <div className="h-64 w-64 rounded-full border border-dashed border-sand/60" />
      </div>

      {/* Le tableau superposé sur le mur */}
      {(!error || fallbackImage) && (
        <div
          className="absolute z-20 cursor-move touch-none select-none"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.08s ease-out',
          }}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        >
          <div className="relative">
            <img
              src={imageSrc}
              alt="Simulation du tableau sur le mur"
              className="max-h-[55vh] max-w-[85vw] object-contain pointer-events-none drop-shadow-[0_22px_35px_rgba(0,0,0,0.6)]"
              draggable={false}
            />
            {/* Ligne d'accroche visuelle stylisée */}
            <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 h-3 w-0.5 bg-gold/80" />
          </div>
        </div>
      )}

      {/* Contrôles inférieurs (Zoom et Recentrer) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center justify-end p-6 pb-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-sand/20 bg-black/60 px-5 py-2.5 backdrop-blur-xl shadow-2xl">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.4, Number((s - 0.1).toFixed(2))))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-sand/15 text-sand transition hover:bg-sand/30 active:scale-90"
            aria-label="Réduire la taille"
            title="Réduire"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <span className="w-12 text-center text-xs font-bold text-sand">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.1).toFixed(2))))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-sand/15 text-sand transition hover:bg-sand/30 active:scale-90"
            aria-label="Agrandir la taille"
            title="Agrandir"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-sand/20" />

          <button
            type="button"
            onClick={() => {
              setPosition({ x: 0, y: 0 })
              setScale(1)
            }}
            className="flex h-9 items-center gap-1.5 rounded-full bg-sand/15 px-3 text-xs font-semibold text-sand transition hover:bg-sand/30 active:scale-95"
            title="Recentrer le tableau"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Recentrer</span>
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] text-sand/60">
          Échelle indicative ajustable · Aucun accessoire requis
        </p>
      </div>
    </div>
  )
}
