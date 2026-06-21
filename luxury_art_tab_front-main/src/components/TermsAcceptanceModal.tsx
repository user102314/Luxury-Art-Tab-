import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const TERMS_KEY = 'luxart_terms_accepted'

export function TermsAcceptanceModal() {
  const [open, setOpen] = useState(false)
  const [terms, setTerms] = useState('')
  const [version, setVersion] = useState(1)

  useEffect(() => {
    api.getSiteSettings().then((s) => {
      setTerms(s.termsContent)
      setVersion(s.termsVersion)
      const accepted = localStorage.getItem(TERMS_KEY)
      if (accepted !== String(s.termsVersion)) setOpen(true)
    }).catch(() => {
      setTerms('En utilisant Luxury Art Tab, vous acceptez nos conditions générales de vente et notre politique de confidentialité.')
      setOpen(true)
    })
  }, [])

  const accept = () => {
    localStorage.setItem(TERMS_KEY, String(version))
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-bold text-foreground">Règles du site web</h2>
          <p className="text-xs text-muted-foreground">Vous devez accepter pour utiliser Luxury Art Tab</p>
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
            J&apos;accepte les règles du site
          </button>
        </div>
      </div>
    </div>
  )
}
