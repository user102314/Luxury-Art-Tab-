import { useEffect, useRef, useState } from 'react'
import {
  Camera,
  Download,
  Move,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
  Upload,
  Clock,
  Trash2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

type ArViewerProps = {
  isOpen: boolean
  onClose: () => void
  imageSrc: string | null
}

export function ArViewer({ isOpen, onClose, imageSrc }: ArViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const artworkImgRef = useRef<HTMLImageElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [fallbackImage, setFallbackImage] = useState<string | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(60)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dragStart = useRef({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Nettoyage et suppression de la capture temporaire
  const clearCapturedPhoto = (showToast = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setCapturedPhoto(null)
    setTimeLeft(60)
    if (showToast) {
      toast.info('Capture supprimée')
    }
  }

  // Timer automatique de 60 secondes pour la capture locale
  useEffect(() => {
    if (capturedPhoto) {
      setTimeLeft(60)
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearCapturedPhoto()
            toast.info('La capture temporaire a expiré et a été supprimée')
            return 60
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [capturedPhoto])

  useEffect(() => {
    let stream: MediaStream | null = null

    if (isOpen) {
      setError(null)
      setPosition({ x: 0, y: 0 })
      setScale(1)
      setFallbackImage(null)
      clearCapturedPhoto()

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
      clearCapturedPhoto()
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

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(0.4, prev + delta), 2.5))
  }

  const handleReset = () => {
    setPosition({ x: 0, y: 0 })
    setScale(1)
  }

  const handleFallbackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setFallbackImage(url)
    setError(null)
  }

  // Chargeur d'image robuste qui évite le blocage CORS/403 et le tainted canvas
  const loadSafeArtImage = async (src: string): Promise<HTMLImageElement | null> => {
    if (!src) return null

    // 1. Si déjà en blob ou data URI
    if (src.startsWith('blob:') || src.startsWith('data:')) {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = src
      })
    }

    // 2. Si URL externe HTTP/HTTPS, passer par la route proxy serveur interne
    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`
        const proxyImg = new Image()
        proxyImg.crossOrigin = 'anonymous'
        const ok = await new Promise<boolean>((resolve) => {
          proxyImg.onload = () => resolve(true)
          proxyImg.onerror = () => resolve(false)
          proxyImg.src = proxyUrl
        })
        if (ok && proxyImg.naturalWidth > 0) {
          return proxyImg
        }
      } catch (e) {
        console.warn('Proxy load failed:', e)
      }
    }

    // 3. Fallback direct avec new Image
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img.naturalWidth > 0 ? img : null)
      img.onerror = () => {
        // En dernier recours sans crossOrigin
        const fallback = new Image()
        fallback.onload = () => resolve(fallback.naturalWidth > 0 ? fallback : null)
        fallback.onerror = () => resolve(null)
        fallback.src = src
      }
      img.src = src
    })
  }

  // Prise de capture photo
  const handleCapturePhoto = async () => {
    try {
      setIsCapturing(true)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        toast.error('Canvas non disponible.')
        return
      }

      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width
      canvas.height = height

      // 1. Dessiner le fond (vidéo caméra ou photo importée ou fond studio)
      let bgDrawn = false
      if (
        videoRef.current &&
        !fallbackImage &&
        videoRef.current.readyState >= 2 &&
        videoRef.current.videoWidth > 0
      ) {
        try {
          const vw = videoRef.current.videoWidth
          const vh = videoRef.current.videoHeight
          const hRatio = width / vw
          const vRatio = height / vh
          const ratio = Math.max(hRatio, vRatio)
          const centerShiftX = (width - vw * ratio) / 2
          const centerShiftY = (height - vh * ratio) / 2
          ctx.drawImage(
            videoRef.current,
            0,
            0,
            vw,
            vh,
            centerShiftX,
            centerShiftY,
            vw * ratio,
            vh * ratio
          )
          bgDrawn = true
        } catch (e) {
          console.warn('Erreur rendu vidéo sur canvas:', e)
        }
      }

      if (!bgDrawn && fallbackImage) {
        try {
          const bgImg = new Image()
          if (!fallbackImage.startsWith('blob:')) {
            bgImg.crossOrigin = 'anonymous'
          }
          bgImg.src = fallbackImage
          await new Promise((resolve) => {
            bgImg.onload = resolve
            bgImg.onerror = resolve
          })
          if (bgImg.naturalWidth > 0) {
            const iw = bgImg.naturalWidth
            const ih = bgImg.naturalHeight
            const hRatio = width / iw
            const vRatio = height / ih
            const ratio = Math.max(hRatio, vRatio)
            const centerShiftX = (width - iw * ratio) / 2
            const centerShiftY = (height - ih * ratio) / 2
            ctx.drawImage(
              bgImg,
              0,
              0,
              iw,
              ih,
              centerShiftX,
              centerShiftY,
              iw * ratio,
              ih * ratio
            )
            bgDrawn = true
          }
        } catch (e) {
          console.warn('Erreur rendu fallback image sur canvas:', e)
        }
      }

      if (!bgDrawn) {
        ctx.fillStyle = '#1A211C'
        ctx.fillRect(0, 0, width, height)
      }

      // 2. Charger et dessiner le tableau
      const artImg = await loadSafeArtImage(imageSrc)
      const naturalW = artImg?.naturalWidth || artworkImgRef.current?.naturalWidth || 400
      const naturalH = artImg?.naturalHeight || artworkImgRef.current?.naturalHeight || 300

      const baseWidth = Math.min(width * 0.7, 400) * scale
      const aspectRatio = naturalH / (naturalW || 1)
      const baseHeight = baseWidth * aspectRatio

      const centerX = width / 2 + position.x
      const centerY = height / 2 + position.y
      const xPos = centerX - baseWidth / 2
      const yPos = centerY - baseHeight / 2

      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
      ctx.shadowBlur = 26
      ctx.shadowOffsetY = 16

      if (artImg && artImg.naturalWidth > 0) {
        ctx.drawImage(artImg, xPos, yPos, baseWidth, baseHeight)
      } else if (artworkImgRef.current && artworkImgRef.current.complete) {
        try {
          ctx.drawImage(artworkImgRef.current, xPos, yPos, baseWidth, baseHeight)
        } catch (e) {
          console.warn('DOM img draw failed:', e)
        }
      } else {
        ctx.fillStyle = '#2C352E'
        ctx.strokeStyle = '#D4AF37'
        ctx.lineWidth = 4
        ctx.fillRect(xPos, yPos, baseWidth, baseHeight)
        ctx.strokeRect(xPos, yPos, baseWidth, baseHeight)
      }
      ctx.restore()

      // Ligne d'accroche stylisée
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.9)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(centerX, yPos)
      ctx.lineTo(centerX, yPos - 12)
      ctx.stroke()

      // 3. Filigrane discret Luxury Art
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = 'bold 15px Inter, sans-serif'
      ctx.fillText('Luxury Art — Simulation Mur Réel (luxuryart.tn)', 24, height - 28)

      // 4. Génération de l'image de prévisualisation
      let photoUrl: string | null = null
      try {
        photoUrl = canvas.toDataURL('image/png')
      } catch (taintErr) {
        console.warn('Canvas toDataURL tainted, essai via toBlob:', taintErr)
      }

      if (!photoUrl) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/png')
        )
        if (blob) {
          photoUrl = URL.createObjectURL(blob)
        }
      }

      if (photoUrl) {
        setCapturedPhoto(photoUrl)
      } else {
        toast.error('Impossible de générer le fichier photo.')
      }
    } catch (err) {
      console.error('Erreur capture photo:', err)
      toast.error('Une erreur est survenue lors de la capture.')
    } finally {
      setIsCapturing(false)
    }
  }

  // Téléchargement effectif sur l'appareil
  const handleDownloadCapturedPhoto = () => {
    if (!capturedPhoto) return
    const link = document.createElement('a')
    link.download = `simulation-mur-luxury-art-${Date.now()}.png`
    link.href = capturedPhoto
    link.click()
    toast.success('Photo téléchargée avec succès sur votre appareil !')
    clearCapturedPhoto(false)
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
              ref={artworkImgRef}
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

      {/* Modal / Confirmation de téléchargement de la capture */}
      {capturedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => clearCapturedPhoto(false)}
        >
          <div
            className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-gold/50 bg-[#161D18] p-5 shadow-2xl text-sand sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barre haute du modal */}
            <div className="flex items-center justify-between pb-3 border-b border-sand/15">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                <h4 className="font-display text-sm font-bold sm:text-base text-sand">
                  Télécharger votre simulation ?
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-sand/10 px-2.5 py-0.5 text-[11px] font-medium text-gold border border-gold/30">
                  <Clock className="h-3 w-3 animate-pulse" />
                  Expire dans {timeLeft}s
                </span>
                <button
                  type="button"
                  onClick={() => clearCapturedPhoto(true)}
                  className="rounded-full bg-sand/10 p-1.5 text-sand transition hover:bg-sand/20"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Image de la capture */}
            <div className="relative my-4 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-sand/20 bg-black/50 shadow-inner">
              <img
                src={capturedPhoto}
                alt="Aperçu simulation mur"
                className="h-full w-full object-contain"
              />
            </div>

            <p className="text-center text-xs text-sand/80">
              Souhaitez-vous enregistrer cette capture sur votre appareil avant qu’elle ne soit supprimée ?
            </p>

            {/* Actions : Télécharger ou Supprimer */}
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={handleDownloadCapturedPhoto}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-gold bg-gold py-3 px-5 text-xs font-bold text-sand shadow-lg transition hover:brightness-110 active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>Oui, télécharger la photo</span>
              </button>

              <button
                type="button"
                onClick={() => clearCapturedPhoto(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-sand/20 bg-sand/10 py-3 px-4 text-xs font-semibold text-sand transition hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/40 active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Non, supprimer la capture</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
