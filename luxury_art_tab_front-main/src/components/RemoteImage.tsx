import type { ImgHTMLAttributes } from 'react'
import { resolveImageSrc } from '@/lib/images'
import { cn } from '@/lib/utils'

type RemoteImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null
  /** Eager + high fetch priority (hero / LCP). */
  priority?: boolean
}

/**
 * Image backend ou locale, avec résolution d'URL API et chargement optimisé.
 */
export function RemoteImage({
  src,
  alt = '',
  className,
  priority = false,
  loading,
  decoding,
  ...props
}: RemoteImageProps) {
  const resolved = resolveImageSrc(src)
  return (
    <img
      src={resolved}
      alt={alt}
      className={cn(className)}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      decoding={decoding ?? 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      {...props}
    />
  )
}
