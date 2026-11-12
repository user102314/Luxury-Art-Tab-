import { useState, useRef } from 'react'
import {
  Camera,
  Maximize2,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Upload,
  RefreshCw,
  Eye,
  Sliders,
  Move,
} from 'lucide-react'

type ProductWallSimulatorProps = {
  productTitle: string
  productRef: string
  imageUrl: string
  simulationImageUrl?: string | null
  selectedDimensionLabel?: string
  selectedCadreNom?: string
  onLaunchAr: (imageSrc: string) => void
}

const ROOM_PRESETS = [
  {
    id: 'salon-modern',
    name: 'Salon Contemporain',
    wallBg: 'linear-gradient(180deg, #E6E1DA 0%, #D8D1C7 100%)',
    couchBg: '#2D3A30',
    couchStyle: 'border-t-8 border-[#3A4A3E] bg-[#222E25]',
  },
  {
    id: 'minimal-beige',
    name: 'Mur Beige Chaud',
    wallBg: 'linear-gradient(180deg, #F5EFEB 0%, #E8DFD7 100%)',
    couchBg: '#8C7B6B',
    couchStyle: 'border-t-8 border-[#A19181] bg-[#756556]',
  },
  {
    id: 'chic-sombre',
    name: 'Mur Salon Prestige',
    wallBg: 'linear-gradient(180deg, #444E47 0%, #2A332C 100%)',
    couchBg: '#C5A880',
    couchStyle: 'border-t-8 border-[#D8BC94] bg-[#B0936B]',
  },
]

export function ProductWallSimulator({
  productTitle,
  productRef,
  imageUrl,
  simulationImageUrl,
  selectedDimensionLabel,
  selectedCadreNom,
  onLaunchAr,
}: ProductWallSimulatorProps) {
  const [activePreset, setActivePreset] = useState(ROOM_PRESETS[0].id)
  const [scale, setScale] = useState(1)
  const [customWall, setCustomWall] = useState<string | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeImage = simulationImageUrl || imageUrl
  const preset = ROOM_PRESETS.find((p) => p.id === activePreset) || ROOM_PRESETS[0]

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setCustomWall(url)
  }

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

  const resetSimulation = () => {
    setPosition({ x: 0, y: 0 })
    setScale(1)
  }

  return (
    <section id="simulateur-mural" className="mt-12 overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-b from-sand via-beige/20 to-sand p-6 shadow-[0_20px_50px_-25px_rgba(74,93,79,0.5)] sm:p-8 md:p-10">
      {/* En-tête prestigieux */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            Technologie Réalité Augmentée & Studio Virtuel
          </span>
          <h2 className="mt-2.5 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Testez ce tableau sur votre mur réel
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Visualisez immédiatement l'accord parfait des dimensions et des couleurs dans votre intérieur
            avant de passer commande.
          </p>
        </div>

        {/* Bouton phare AR Live */}
        <button
          type="button"
          onClick={() => onLaunchAr(activeImage)}
          className="group inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full border-2 border-gold bg-foliage px-6 py-3.5 text-sm font-bold text-sand shadow-[0_12px_28px_-8px_rgba(74,93,79,0.8)] transition-all duration-300 hover:scale-[1.03] hover:bg-foliage/90 hover:shadow-xl active:scale-95"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-gold" />
          </span>
          <Camera className="h-5 w-5 text-gold transition-transform group-hover:rotate-12" />
          <span>Ouvrir la Caméra AR en direct</span>
        </button>
      </div>

      {/* 3 points forts explicatifs */}
      <div className="mt-6 grid grid-cols-1 gap-3 border-y border-border/60 py-4 sm:grid-cols-3">
        <div className="flex items-center gap-2.5 text-xs text-foreground">
          <Smartphone className="h-4 w-4 shrink-0 text-gold" />
          <span><strong>100% Web :</strong> Aucune application à installer.</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-foreground">
          <Maximize2 className="h-4 w-4 shrink-0 text-gold" />
          <span><strong>Échelle précise :</strong> Proportions réelles sur votre mur.</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-green" />
          <span><strong>Ajustement tactile :</strong> Déplacez et zoomez librement.</span>
        </div>
      </div>

      {/* Studio interactif de simulation */}
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Eye className="h-4 w-4 text-gold" />
            <span>Simulateur d'intérieur (Aperçu en pièce)</span>
            {selectedDimensionLabel && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
                Format : {selectedDimensionLabel}
              </span>
            )}
            {selectedCadreNom && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
                Cadre : {selectedCadreNom}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetSimulation}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-sand px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              title="Recentrer le tableau"
            >
              <RefreshCw className="h-3 w-3" />
              Recentrer
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-sand px-3 py-1 text-xs font-semibold text-gold transition hover:bg-gold/10"
            >
              <Upload className="h-3 w-3" />
              {customWall ? 'Changer de mur' : 'Importer votre mur'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCustomUpload}
            />
          </div>
        </div>

        {/* Cadre de visualisation du mur */}
        <div
          className="relative h-[340px] w-full overflow-hidden rounded-2xl border border-border/80 shadow-inner select-none sm:h-[400px]"
          style={{
            background: customWall
              ? `url(${customWall}) center/cover no-repeat`
              : preset.wallBg,
          }}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        >
          {/* Grille ou repères légers */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.2) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Plinthe de sol décorative (si preset studio) */}
          {!customWall && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[#DDD5CA] border-t-4 border-[#C8BEB0] flex items-end">
              <div className="h-4 w-full bg-[#EFE9DF] opacity-60" />
            </div>
          )}

          {/* Canapé / mobilier décoratif (si preset studio) */}
          {!customWall && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 w-[70%] max-w-[420px] rounded-t-2xl shadow-xl flex flex-col items-center">
              <div
                className={`h-16 w-full rounded-t-2xl ${preset.couchStyle} flex items-center justify-center`}
                style={{ backgroundColor: preset.couchBg }}
              >
                <div className="h-1 w-20 rounded-full bg-sand/30" />
              </div>
            </div>
          )}

          {/* Indicateur de déplacement */}
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-foliage/75 px-3 py-1 text-[11px] font-medium text-sand backdrop-blur-md">
            <Move className="h-3 w-3 text-gold" />
            <span>Faites glisser pour ajuster la position</span>
          </div>

          {/* Tableau interactif sur le mur */}
          <div
            className="absolute z-20 cursor-move touch-none"
            style={{
              left: '50%',
              top: customWall ? '50%' : '38%',
              transform: `translate(-50%, -50%) translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <div className="group relative">
              <img
                src={activeImage}
                alt={`${productTitle} sur mur`}
                className="max-h-[190px] max-w-[260px] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)] sm:max-h-[230px] sm:max-w-[320px]"
                draggable={false}
              />
              <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foliage/80 px-2 py-0.5 text-[10px] font-semibold text-sand opacity-0 transition group-hover:opacity-100 backdrop-blur-sm">
                {productRef}
              </span>
            </div>
          </div>

          {/* Contrôles de zoom intégrés */}
          <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 rounded-xl bg-sand/90 p-1 shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-beige/60 active:scale-95"
              aria-label="Réduire la taille"
              title="Réduire l'échelle"
            >
              −
            </button>
            <span className="w-10 text-center text-xs font-semibold text-foreground">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(2, s + 0.1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-beige/60 active:scale-95"
              aria-label="Agrandir la taille"
              title="Agrandir l'échelle"
            >
              +
            </button>
          </div>
        </div>

        {/* Sélecteur de pièces modèles */}
        {!customWall && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Changer d'ambiance :</span>
            {ROOM_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePreset(p.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  activePreset === p.id
                    ? 'bg-foliage text-sand shadow-sm'
                    : 'border border-border bg-sand text-foreground/80 hover:bg-beige/50'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {customWall && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Photo personnalisée de votre pièce chargée avec succès.
            </p>
            <button
              type="button"
              onClick={() => setCustomWall(null)}
              className="text-xs font-semibold text-brand-red hover:underline"
            >
              Revenir aux ambiances par défaut
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

