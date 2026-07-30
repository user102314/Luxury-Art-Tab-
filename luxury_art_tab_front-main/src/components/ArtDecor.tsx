import splashBrown from '@/assets/decor/paint-splash-brown.png'
import splashOrange from '@/assets/decor/paint-splash-orange.png'
import splashBrick from '@/assets/decor/paint-splash-brick.png'
import splashBeige from '@/assets/decor/paint-splash-beige.png'
import brushRed from '@/assets/decor/brush-stroke-red.png'
import brushBrown from '@/assets/decor/brush-stroke-brown.png'
import brushOrange from '@/assets/decor/brush-stroke-orange.png'
import brushBeige from '@/assets/decor/brush-stroke-beige.png'
import { cn } from '@/lib/utils'

const SPLASH = {
  brown: splashBrown,
  orange: splashOrange,
  brick: splashBrick,
  beige: splashBeige,
} as const

const BRUSH = {
  red: brushRed,
  brown: brushBrown,
  orange: brushOrange,
  beige: brushBeige,
} as const

/*
 * Les visuels sources sont peints en orange / brique / rouge. Ces filtres les
 * ramènent sur la charte : doré pour les touches chaudes, taupe pour les
 * traces sombres, feuillage pour les aplats verts.
 */
const TINT: Record<string, string> = {
  orange: 'sepia(1) saturate(1.35) hue-rotate(-6deg) brightness(0.95)',
  brick: 'sepia(1) saturate(1.15) hue-rotate(-10deg) brightness(0.85)',
  red: 'sepia(1) saturate(1.2) hue-rotate(-8deg) brightness(0.9)',
  brown: 'sepia(0.8) saturate(0.6) hue-rotate(10deg) brightness(0.9)',
  beige: 'sepia(0.5) saturate(0.5) brightness(1.02)',
}

type DecorBase = {
  className?: string
  opacity?: number
  rotate?: number
  flip?: boolean
  float?: boolean
  floatSlow?: boolean
}

function DecorImg({
  src,
  tint,
  className,
  opacity = 0.55,
  rotate = 0,
  flip = false,
  float,
  floatSlow,
}: DecorBase & { src: string; tint?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute select-none',
        float && 'animate-paint-float',
        floatSlow && 'animate-paint-float-slow',
        className,
      )}
      style={{ opacity }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="h-full w-full object-contain"
        style={{
          transform: `rotate(${rotate}deg)${flip ? ' scaleX(-1)' : ''}`,
          filter: tint,
        }}
      />
    </div>
  )
}

export function PaintSplash({
  color = 'brown',
  ...rest
}: DecorBase & { color?: keyof typeof SPLASH }) {
  return <DecorImg src={SPLASH[color]} tint={TINT[color]} {...rest} />
}

export function PaintStroke({
  color = 'red',
  ...rest
}: DecorBase & { color?: keyof typeof BRUSH }) {
  return <DecorImg src={BRUSH[color]} tint={TINT[color]} {...rest} />
}
