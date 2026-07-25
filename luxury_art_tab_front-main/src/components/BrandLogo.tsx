type BrandLogoProps = {
  className?: string
  /** sm = nav · md = défaut · lg = hero */
  size?: 'sm' | 'md' | 'lg'
  /** Nom boutique (défaut : Luxury Art_Tab) */
  name?: string
  showByline?: boolean
  /** Fond sombre : _Tab en crème claire */
  onDark?: boolean
}

const sizeClass = {
  sm: 'text-[1.35rem] leading-[0.95]',
  md: 'text-[1.75rem] leading-[0.95]',
  lg: 'text-[2.75rem] leading-[0.95]',
} as const

/**
 * Wordmark texte — police script Great Vibes (esprit du logo Luxury Art_Tab By Insaf).
 */
export function BrandLogo({
  className = '',
  size = 'md',
  name = 'Luxury Art_Tab',
  showByline = true,
  onDark = false,
}: BrandLogoProps) {
  const parts = parseBoutiqueName(name)
  const tabColor = onDark ? 'text-[#eadcc9]' : 'text-[#2c2c2c]'

  return (
    <span
      className={`inline-flex flex-col font-brand select-none ${sizeClass[size]} ${className}`}
      aria-label={`${parts.luxury} ${parts.artTab}${showByline ? ' By Insaf' : ''}`}
    >
      <span className="brand-gold-text">{parts.luxury}</span>
      {(parts.art || parts.tab) && (
        <span className="-mt-[0.15em]">
          {parts.art && <span className="brand-gold-text">{parts.art}</span>}
          {parts.tab && <span className={tabColor}>{parts.tab}</span>}
        </span>
      )}
      {showByline && (
        <span className="brand-gold-text -mt-[0.05em] self-end text-[0.38em] tracking-wide">
          By Insaf
        </span>
      )}
    </span>
  )
}

function parseBoutiqueName(name: string) {
  const cleaned = name.trim() || 'Luxury Art_Tab'
  if (/luxury/i.test(cleaned) && /art/i.test(cleaned)) {
    const artMatch = cleaned.match(/art[_\s-]*tab/i)
    return {
      luxury: 'Luxury',
      art: 'Art',
      tab: artMatch ? '_Tab' : '',
      artTab: artMatch ? 'Art_Tab' : cleaned.replace(/luxury/i, '').trim(),
    }
  }
  const [first, ...rest] = cleaned.split(/\s+/)
  return {
    luxury: first,
    art: rest.join(' ') || '',
    tab: '',
    artTab: rest.join(' '),
  }
}
