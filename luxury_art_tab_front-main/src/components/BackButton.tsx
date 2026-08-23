import { useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type BackButtonProps = {
  /** Page de repli si l'historique est vide (premier chargement direct). */
  fallbackTo?: string
  fallbackSearch?: Record<string, unknown>
  label?: string
  variant?: 'storefront' | 'admin'
  className?: string
}

export function BackButton({
  fallbackTo = '/',
  fallbackSearch,
  label = 'Retour',
  variant = 'storefront',
  className,
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
      return
    }
    void router.navigate({
      to: fallbackTo,
      search: fallbackSearch as never,
    })
  }

  const styles =
    variant === 'admin'
      ? 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white'
      : 'inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-muted-foreground transition hover:text-brand-red'

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(styles, className)}
      aria-label={label}
    >
      <ChevronLeft className={variant === 'admin' ? 'h-4 w-4' : 'h-4 w-4 shrink-0'} aria-hidden />
      <span>{label}</span>
    </button>
  )
}
