import { useEffect, useState } from 'react'
import { BrandLogo } from '@/components/BrandLogo'
import { useSiteSettings } from '@/hooks/useStorefrontQueries'
import { hasDefinedTerms } from '@/lib/siteSettings'

const TERMS_KEY = 'luxart_terms_accepted'

export function TermsAcceptanceModal() {
  const { data: settings, isError } = useSiteSettings()
  const [open, setOpen] = useState(false)

  const terms = settings?.termsContent?.trim() ?? ''
  const version = settings?.termsVersion ?? 1
  const boutiqueNom = settings?.boutiqueNom?.trim() || 'Luxury Art_Tab'

  useEffect(() => {
    if (!settings && !isError) return

    if (!hasDefinedTerms(settings)) {
      setOpen(false)
      return
    }

    const accepted = localStorage.getItem(TERMS_KEY)
    if (accepted !== String(version)) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [settings, isError, version])

  const accept = () => {
    localStorage.setItem(TERMS_KEY, String(version))
    setOpen(false)
  }

  if (!open || !terms) return null

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-foliage/70 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        <div className="border-b border-border px-6 py-4">
          <BrandLogo size="md" className="mb-3" name={boutiqueNom} />
          <h2 className="font-display text-lg font-bold text-foreground">Conditions générales</h2>
          <p className="text-xs text-muted-foreground">
            Veuillez lire et accepter les conditions de {boutiqueNom} pour continuer
          </p>
        </div>
        <div className="max-h-[50vh] overflow-y-auto px-6 py-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {terms}
        </div>
        <div className="border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={accept}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            J&apos;accepte les conditions
          </button>
        </div>
      </div>
    </div>
  )
}
