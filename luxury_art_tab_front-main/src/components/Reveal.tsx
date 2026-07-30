import { useEffect, useRef, useState } from 'react'

type RevealProps = {
  children: React.ReactNode
  className?: string
  /** Décalage en ms, pour échelonner plusieurs blocs d'une même rangée. */
  delay?: number
  /** Rejoue l'animation à chaque passage, au lieu d'une seule fois. */
  repeat?: boolean
}

/**
 * Révèle son contenu quand il entre dans l'écran : le bloc arrive flou et
 * décalé, puis se met net. Le contenu est rendu côté serveur dans tous les cas ;
 * si l'IntersectionObserver n'existe pas, il s'affiche immédiatement.
 */
export function Reveal({ children, className = '', delay = 0, repeat = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (!repeat) observer.unobserve(el)
        } else if (repeat) {
          setVisible(false)
        }
      },
      // Se déclenche quand le bloc atteint le niveau courant de l'écran.
      { threshold: 0.12, rootMargin: '0px 0px -12% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [repeat])

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
