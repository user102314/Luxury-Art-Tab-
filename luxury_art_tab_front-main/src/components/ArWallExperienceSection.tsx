import { useState, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Camera,
  Sparkles,
  Smartphone,
  Eye,
  CheckCircle2,
  ArrowRight,
  Move,
  Maximize2,
  RefreshCw,
  Palette,
} from 'lucide-react'
import { LazyArViewer } from '@/components/LazyArViewer'

const HOME_ROOM_PRESETS = [
  {
    id: 'salon-contemporain',
    name: 'Salon Contemporain',
    wallBg: 'linear-gradient(180deg, #E8E2D9 0%, #D5CDC0 100%)',
    couchBg: '#2C3930',
    couchStyle: 'border-t-8 border-[#3A4B3F] bg-[#222E26]',
  },
  {
    id: 'minimal-beige',
    name: 'Mur Beige & Bois',
    wallBg: 'linear-gradient(180deg, #F6F1EC 0%, #E7DED5 100%)',
    couchBg: '#8A7868',
    couchStyle: 'border-t-8 border-[#9E8B79] bg-[#756557]',
  },
  {
    id: 'salon-sombre',
    name: 'Salon Prestige Sombre',
    wallBg: 'linear-gradient(180deg, #3C4640 0%, #252D27 100%)',
    couchBg: '#C4A67E',
    couchStyle: 'border-t-8 border-[#D8BA8E] bg-[#AF926B]',
  },
]

export function ArWallExperienceSection({
  sampleImageUrl = '/placeholder-art.svg',
}: {
  sampleImageUrl?: string
}) {
  const [arOpen, setArOpen] = useState(false)
  const [activePreset, setActivePreset] = useState(HOME_ROOM_PRESETS[0].id)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const preset = HOME_ROOM_PRESETS.find((p) => p.id === activePreset) || HOME_ROOM_PRESETS[0]

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

  const resetArt = () => {
    setPosition({ x: 0, y: 0 })
    setScale(1)
  }

  return (
    <section id="experience-ar" className="relative overflow-hidden bg-gradient-to-b from-beige/30 via-sand to-beige/25 py-16 sm:py-24">
      {/* Texture géométrique élégante */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, var(--gold) 1.5px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        {/* En-tête percutant */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gold shadow-sm">
            <Sparkles className="h-4 w-4" />
            Exclusivité Luxury Art
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Testez nos tableaux sur votre mur réel <br className="hidden sm:inline" />
            <span className="text-gold">directement depuis votre smartphone</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Ne craignez plus de vous tromper sur la taille ou les couleurs. Grâce à notre technologie de
            <strong> Réalité Augmentée en direct</strong>, projetez instantanément n’importe quel tableau sur les murs de votre salon avant de commander.
          </p>
        </div>

        {/* Démonstrateur interactif en direct dans la page d'accueil */}
        <div className="mt-12 overflow-hidden rounded-3xl border-2 border-gold/40 bg-sand p-4 shadow-[0_25px_60px_-20px_rgba(74,93,79,0.5)] sm:p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gold">
                Démonstrateur en direct
              </p>
              <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">
                Visualisez l'harmonie parfaite dans votre salon
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={resetArt}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-sand px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:bg-beige/50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Recentrer
              </button>

              <button
                type="button"
                onClick={() => setArOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-gold bg-foliage px-5 py-2 text-xs font-bold text-sand shadow-lg transition hover:bg-foliage/90 hover:scale-105 active:scale-95"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                </span>
                <Camera className="h-4 w-4 text-gold" />
                <span>Tester avec ma caméra (AR)</span>
              </button>
            </div>
          </div>

          {/* Scène de mur de salon interactif */}
          <div
            className="relative mt-4 h-[320px] w-full overflow-hidden rounded-2xl border border-border/80 shadow-inner select-none sm:h-[420px]"
            style={{ background: preset.wallBg }}
            onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handleEnd}
          >
            {/* Guide de déplacement */}
            <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-foliage/80 px-3.5 py-1.5 text-[11px] font-semibold text-sand backdrop-blur-md border border-gold/30 shadow-md">
              <Move className="h-3.5 w-3.5 text-gold animate-pulse" />
              <span>Faites glisser pour placer le tableau sur le mur</span>
            </div>

            {/* Plinthe de sol décorative */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[#DDD5CA] border-t-4 border-[#C8BEB0] flex items-end">
              <div className="h-4 w-full bg-[#EFE9DF] opacity-60" />
            </div>

            {/* Canapé design chic */}
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 w-[72%] max-w-[460px] rounded-t-2xl shadow-2xl flex flex-col items-center">
              <div
                className={`h-16 sm:h-20 w-full rounded-t-2xl ${preset.couchStyle} flex items-center justify-center`}
                style={{ backgroundColor: preset.couchBg }}
              >
                <div className="h-1.5 w-24 rounded-full bg-sand/30" />
              </div>
            </div>

            {/* Tableau interactif sur le mur */}
            <div
              className="absolute z-20 cursor-move touch-none"
              style={{
                left: '50%',
                top: '38%',
                transform: `translate(-50%, -50%) translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              <div className="group relative">
                <img
                  src={sampleImageUrl}
                  alt="Tableau de démonstration sur mur"
                  className="max-h-[190px] max-w-[270px] object-contain drop-shadow-[0_22px_35px_rgba(0,0,0,0.5)] sm:max-h-[240px] sm:max-w-[340px]"
                  draggable={false}
                />
              </div>
            </div>

            {/* Contrôles de zoom */}
            <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 rounded-xl bg-sand/90 p-1 shadow-lg backdrop-blur-md">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-beige/60 active:scale-95"
                title="Réduire"
              >
                −
              </button>
              <span className="w-10 text-center text-xs font-semibold text-foreground">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(1.8, s + 0.1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground hover:bg-beige/60 active:scale-95"
                title="Agrandir"
              >
                +
              </button>
            </div>
          </div>

          {/* Sélecteur de pièces */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Palette className="h-3.5 w-3.5" />
                Ambiance du mur :
              </span>
              {HOME_ROOM_PRESETS.map((p) => (
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

            <p className="text-xs text-muted-foreground">
              💡 Disponible sur <strong>chaque produit</strong> du catalogue.
            </p>
          </div>
        </div>

        {/* 3 Étapes illustrées */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 md:gap-8">
          <div className="group rounded-3xl border border-border/80 bg-sand p-6 shadow-[0_12px_30px_-15px_rgba(74,93,79,0.3)] transition duration-300 hover:-translate-y-1 hover:border-gold/60 sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foliage/10 text-foliage transition duration-300 group-hover:bg-foliage group-hover:text-sand">
              <Eye className="h-7 w-7" />
            </div>
            <span className="mt-5 inline-block font-display text-xs font-bold uppercase tracking-widest text-gold">
              Étape 1
            </span>
            <h3 className="mt-1 font-display text-lg font-bold text-foreground">
              Choisissez votre tableau
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Parcourez nos collections et repérez l'œuvre qui sublimera votre pièce de vie.
            </p>
          </div>

          <div className="group rounded-3xl border border-gold/50 bg-sand p-6 shadow-[0_16px_36px_-15px_rgba(74,93,79,0.4)] transition duration-300 hover:-translate-y-1 hover:border-gold sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/20 text-gold transition duration-300 group-hover:bg-gold group-hover:text-sand">
              <Camera className="h-7 w-7" />
            </div>
            <span className="mt-5 inline-block font-display text-xs font-bold uppercase tracking-widest text-gold">
              Étape 2
            </span>
            <h3 className="mt-1 font-display text-lg font-bold text-foreground">
              Cliquez « Tester sur votre mur réel »
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Directement depuis le navigateur, la caméra s'ouvre sans rien télécharger.
            </p>
          </div>

          <div className="group rounded-3xl border border-border/80 bg-sand p-6 shadow-[0_12px_30px_-15px_rgba(74,93,79,0.3)] transition duration-300 hover:-translate-y-1 hover:border-gold/60 sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-green/10 text-accent-green transition duration-300 group-hover:bg-accent-green group-hover:text-sand">
              <Smartphone className="h-7 w-7" />
            </div>
            <span className="mt-5 inline-block font-display text-xs font-bold uppercase tracking-widest text-gold">
              Étape 3
            </span>
            <h3 className="mt-1 font-display text-lg font-bold text-foreground">
              Ajustez et admirez chez vous
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Déplacez l’œuvre avec votre doigt, adaptez l’échelle à votre pièce et commandez en toute sérénité.
            </p>
          </div>
        </div>

        {/* Appel à l'action final */}
        <div className="mt-12 rounded-3xl border border-gold/40 bg-foliage p-8 text-sand shadow-2xl sm:p-10 md:p-12">
          <div className="flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sand/15 px-3 py-1 text-xs font-semibold text-sand backdrop-blur-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                  100% Gratuit & Instantané
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sand/15 px-3 py-1 text-xs font-semibold text-sand backdrop-blur-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                  Compatible tous smartphones & tablettes
                </span>
              </div>
              <h3 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
                Prêt à tester chez vous dès maintenant ?
              </h3>
              <p className="mt-2 text-sm text-sand/80 sm:text-base">
                Lancez la caméra pour voir le rendu sur votre mur physique ou explorez toute la galerie.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setArOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-gold bg-gold px-7 py-3.5 text-sm font-bold text-sand shadow-xl transition hover:brightness-110 active:scale-95"
              >
                <Camera className="h-4 w-4" />
                Lancer la Caméra AR en direct
              </button>
              <Link
                to="/products"
                search={{ category: undefined }}
                className="inline-flex items-center gap-2 rounded-full border border-sand/40 bg-sand/10 px-6 py-3.5 text-sm font-bold text-sand backdrop-blur-sm transition hover:bg-sand/20 active:scale-95"
              >
                Voir tous les tableaux
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <LazyArViewer
        isOpen={arOpen}
        onClose={() => setArOpen(false)}
        imageSrc={sampleImageUrl}
      />
    </section>
  )
}
