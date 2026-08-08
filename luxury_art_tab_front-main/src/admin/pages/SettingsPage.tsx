import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { api } from '../lib/api'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import type { SiteSettings } from '../types'

const empty: SiteSettings = {
  boutiqueNom: '',
  slogan: '',
  emailContact: '',
  telephoneContact: '',
  adresse: '',
  ville: '',
  pays: '',
  whatsappNumber: '',
  termsContent: '',
}

export default function SettingsPage() {
  const [form, setForm] = useState<SiteSettings>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getSiteSettings()
      .then((s) => setForm({ ...empty, ...s }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Chargement impossible'))
      .finally(() => setLoading(false))
  }, [])

  const set = (key: keyof SiteSettings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const saved = await api.updateSiteSettings(form)
      setForm({ ...empty, ...saved })
      setMessage('Paramètres enregistrés')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSkeleton rows={6} />

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={saving} />
      <div>
        <h2 className="text-xl font-semibold text-white">Paramètres boutique</h2>
        <p className="text-sm text-zinc-500">
          Nom, contacts, adresse — utilisés pour la vitrine et les factures
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom boutique *" value={form.boutiqueNom ?? ''} onChange={(v) => set('boutiqueNom', v)} required />
          <Field label="Slogan" value={form.slogan ?? ''} onChange={(v) => set('slogan', v)} />
          <Field label="Email contact" value={form.emailContact ?? ''} onChange={(v) => set('emailContact', v)} type="email" />
          <Field label="Téléphone" value={form.telephoneContact ?? ''} onChange={(v) => set('telephoneContact', v)} />
          <Field label="WhatsApp (ex. 2126…)" value={form.whatsappNumber ?? ''} onChange={(v) => set('whatsappNumber', v)} />
          <Field label="Pays" value={form.pays ?? ''} onChange={(v) => set('pays', v)} />
          <Field label="Ville" value={form.ville ?? ''} onChange={(v) => set('ville', v)} />
        </div>
        <div>
          <label className="label">Adresse</label>
          <textarea
            className="input min-h-[80px]"
            value={form.adresse ?? ''}
            onChange={(e) => set('adresse', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Conditions / CGU</label>
          <textarea
            className="input min-h-[140px] font-mono text-xs"
            value={form.termsContent ?? ''}
            onChange={(e) => set('termsContent', e.target.value)}
          />
        </div>
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary">
          <Save className="h-4 w-4" />
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  )
}
