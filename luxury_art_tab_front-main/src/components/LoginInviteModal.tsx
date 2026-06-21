import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Gift, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const DISMISS_KEY = 'luxart_login_invite_dismissed'

export function LoginInviteModal() {
  const { client } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (client) return
    if (sessionStorage.getItem(DISMISS_KEY)) return
    const timer = window.setTimeout(() => setOpen(true), 5000)
    return () => window.clearTimeout(timer)
  }, [client])

  if (!open || client) return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-w-md rounded-2xl border border-[#f4a15d]/30 bg-[#2f1b12] p-6 text-[#f7efe2] shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-lg p-1 text-zinc-400 hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4a15d]/20">
          <Gift className="h-6 w-6 text-[#f4a15d]" />
        </div>
        <h3 className="font-display text-xl font-bold">Rejoignez le club fidélité</h3>
        <p className="mt-2 text-sm text-[#f7efe2]/80">
          Créez votre compte et gagnez des tableaux gratuits ou des réductions après vos commandes livrées.
        </p>
        <ul className="mt-3 space-y-1 text-xs text-[#f7efe2]/70">
          <li>• Suivez votre progression en temps réel</li>
          <li>• Récompenses exclusives réservées aux membres</li>
          <li>• Inscription gratuite en 1 minute</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/signup"
            onClick={dismiss}
            className="rounded-xl bg-[#f4a15d] px-4 py-2 text-sm font-semibold text-[#2f1b12] hover:bg-[#f4a15d]/90"
          >
            Créer mon compte
          </Link>
          <Link
            to="/signin"
            onClick={dismiss}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/5"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}
