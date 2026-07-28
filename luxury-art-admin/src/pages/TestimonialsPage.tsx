import { useMemo, useState } from 'react'
import { HeartHandshake, Pencil, Plus, Trash2, Upload, X } from 'lucide-react'
import { api } from '../lib/api'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { ListToolbar } from '../components/ListToolbar'
import { useInvalidateAdmin, useTestimonials } from '../hooks/useAdminQueries'
import { compareNumbers, compareStrings, matchesSearch, type SortDir } from '../lib/listUtils'
import type { Testimonial, TestimonialPlateforme } from '../types'

const PLATEFORMES: { value: TestimonialPlateforme; label: string }[] = [
  { value: 'MESSENGER', label: 'Messenger' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'AUTRE', label: 'Autre' },
]

function resolveImageSrc(url?: string) {
  if (!url) return undefined
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url
  return url.startsWith('/') ? url : `/${url}`
}

export default function TestimonialsPage() {
  const { data: items = [], isLoading, isFetching } = useTestimonials()
  const invalidate = useInvalidateAdmin()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [clientNom, setClientNom] = useState('')
  const [message, setMessage] = useState('')
  const [reponseBoutique, setReponseBoutique] = useState('')
  const [plateforme, setPlateforme] = useState<TestimonialPlateforme>('MESSENGER')
  const [ordre, setOrdre] = useState(0)
  const [actif, setActif] = useState(true)
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [plateformeFilter, setPlateformeFilter] = useState('ALL')
  const [actifFilter, setActifFilter] = useState('ALL')
  const [sort, setSort] = useState<'ordre' | 'client' | 'plateforme'>('ordre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const filteredItems = useMemo(() => {
    let list = items.filter((t) => {
      if (plateformeFilter !== 'ALL' && t.plateforme !== plateformeFilter) return false
      if (actifFilter === 'ACTIF' && !t.actif) return false
      if (actifFilter === 'INACTIF' && t.actif) return false
      if (!matchesSearch(search, [t.clientNom, t.message, t.reponseBoutique, t.plateforme])) return false
      return true
    })
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'client':
          return compareStrings(a.clientNom, b.clientNom, sortDir)
        case 'plateforme':
          return compareStrings(a.plateforme, b.plateforme, sortDir)
        case 'ordre':
        default:
          return compareNumbers(a.ordre ?? 0, b.ordre ?? 0, sortDir)
      }
    })
    return list
  }, [items, search, plateformeFilter, actifFilter, sort, sortDir])

  const clearForm = () => {
    setClientNom('')
    setMessage('')
    setReponseBoutique('')
    setPlateforme('MESSENGER')
    setOrdre(0)
    setActif(true)
    setExistingImageUrl(undefined)
    setImageFile(null)
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(null)
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const openCreate = () => {
    clearForm()
    setShowForm(true)
  }

  const openEdit = (t: Testimonial) => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setEditingId(t.id)
    setClientNom(t.clientNom)
    setMessage(t.message ?? '')
    setReponseBoutique(t.reponseBoutique ?? '')
    setPlateforme(t.plateforme)
    setOrdre(t.ordre ?? 0)
    setActif(t.actif !== false)
    setExistingImageUrl(t.imageUrl)
    setImageFile(null)
    setPreview(t.imageUrl ? resolveImageSrc(t.imageUrl) ?? null : null)
    setError('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        clientNom,
        message,
        reponseBoutique: reponseBoutique || undefined,
        plateforme,
        ordre,
        actif,
        imageUrl: imageFile ? existingImageUrl : existingImageUrl,
      }
      let id = editingId
      if (editingId != null) {
        await api.updateTestimonial(editingId, payload)
      } else {
        const created = await api.createTestimonial(payload)
        id = created.id
      }
      if (imageFile && id != null) {
        await api.uploadTestimonialImage(id, imageFile)
      }
      clearForm()
      await invalidate.testimonials()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Supprimer cet avis ?')) return
    await api.deleteTestimonial(id)
    if (editingId === id) clearForm()
    await invalidate.testimonials()
  }

  const toggleActif = async (t: Testimonial) => {
    await api.updateTestimonial(t.id, { ...t, actif: !t.actif })
    await invalidate.testimonials()
  }

  if (isLoading && items.length === 0) return <PageSkeleton rows={5} />

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={isFetching || saving} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Avis clients réels</h2>
          <p className="text-sm text-zinc-500">
            Captures Messenger / WhatsApp / Instagram affichées sur la vitrine
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nouvel avis
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <h3 className="font-semibold text-white">
            {editingId != null ? 'Modifier l’avis' : 'Nouvel avis réel'}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Nom client *</label>
              <input
                className="input"
                value={clientNom}
                onChange={(e) => setClientNom(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Plateforme</label>
              <select
                className="input"
                value={plateforme}
                onChange={(e) => setPlateforme(e.target.value as TestimonialPlateforme)}
              >
                {PLATEFORMES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Message client</label>
            <textarea
              className="input min-h-[90px] resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex. Merci beaucoup, les tableaux sont parfaits…"
            />
          </div>
          <div>
            <label className="label">Réponse boutique (optionnel)</label>
            <input
              className="input"
              value={reponseBoutique}
              onChange={(e) => setReponseBoutique(e.target.value)}
              placeholder="Votre satisfaction nous tient à cœur ❤️"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Ordre d’affichage</label>
              <input
                type="number"
                className="input"
                value={ordre}
                onChange={(e) => setOrdre(Number(e.target.value))}
              />
            </div>
            <label className="flex items-center gap-3 pt-6 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={actif}
                onChange={(e) => setActif(e.target.checked)}
                className="h-4 w-4"
              />
              Visible sur le site
            </label>
          </div>
          <div>
            <label className="label">Capture / photo (recommandé)</label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-ink-800/50 px-4 py-6 hover:border-gold-500/40">
              <Upload className="mb-2 h-6 w-6 text-gold-400" />
              <span className="text-sm text-zinc-400">Screenshot Messenger, WhatsApp…</span>
              <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
            </label>
            {preview && (
              <div className="relative mt-3 inline-block">
                <img src={preview} alt="Aperçu" className="max-h-48 rounded-lg object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
                    setPreview(null)
                    setImageFile(null)
                    setExistingImageUrl(undefined)
                  }}
                  className="absolute right-1 top-1 rounded-full bg-red-500/90 p-1"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={clearForm} className="btn-ghost">
              Annuler
            </button>
          </div>
        </form>
      )}

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher client, message, plateforme…"
        sort={sort}
        onSortChange={(v) => setSort(v as 'ordre' | 'client' | 'plateforme')}
        sortOptions={[
          { value: 'ordre', label: 'Ordre affichage' },
          { value: 'client', label: 'Client' },
          { value: 'plateforme', label: 'Plateforme' },
        ]}
        sortDir={sortDir}
        onSortDirChange={setSortDir}
        resultCount={filteredItems.length}
        totalCount={items.length}
        onReset={() => {
          setSearch('')
          setPlateformeFilter('ALL')
          setActifFilter('ALL')
          setSort('ordre')
          setSortDir('asc')
        }}
        filters={[
          {
            id: 'plateforme',
            label: 'Plateforme',
            value: plateformeFilter,
            onChange: setPlateformeFilter,
            options: [
              { value: 'ALL', label: 'Toutes' },
              ...PLATEFORMES.map((p) => ({ value: p.value, label: p.label })),
            ],
          },
          {
            id: 'actif',
            label: 'Visibilité',
            value: actifFilter,
            onChange: setActifFilter,
            options: [
              { value: 'ALL', label: 'Tous' },
              { value: 'ACTIF', label: 'Actifs' },
              { value: 'INACTIF', label: 'Inactifs' },
            ],
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {items.length === 0 ? (
          <p className="card col-span-full p-8 text-center text-zinc-500">Aucun avis enregistré</p>
        ) : filteredItems.length === 0 ? (
          <p className="card col-span-full p-8 text-center text-zinc-500">Aucun avis ne correspond aux filtres</p>
        ) : (
          filteredItems.map((t) => (
            <article key={t.id} className="card overflow-hidden">
              {t.imageUrl && (
                <img
                  src={resolveImageSrc(t.imageUrl)}
                  alt=""
                  className="h-56 w-full object-cover object-top"
                />
              )}
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{t.clientNom}</p>
                    <p className="text-xs uppercase tracking-wider text-gold-400">{t.plateforme}</p>
                  </div>
                  <span
                    className={`rounded-lg px-2 py-0.5 text-xs ${
                      t.actif ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-500/20 text-zinc-400'
                    }`}
                  >
                    {t.actif ? 'Visible' : 'Masqué'}
                  </span>
                </div>
                {t.message && <p className="text-sm text-zinc-300">{t.message}</p>}
                {t.reponseBoutique && (
                  <p className="flex items-start gap-2 text-xs text-zinc-500">
                    <HeartHandshake className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" />
                    {t.reponseBoutique}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="rounded-xl p-2 text-zinc-500 hover:bg-white/5 hover:text-gold-300"
                    title="Modifier"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => toggleActif(t)} className="btn-ghost text-xs">
                    {t.actif ? 'Masquer' : 'Afficher'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    className="rounded-xl p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
