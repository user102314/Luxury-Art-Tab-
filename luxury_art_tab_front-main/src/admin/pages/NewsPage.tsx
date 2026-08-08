import { useMemo, useState } from 'react'
import { ImageIcon, Pencil, Plus, Send, Trash2, Upload, X } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'
import { api, formatDate } from '../lib/api'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { ListToolbar } from '../components/ListToolbar'
import { useInvalidateAdmin, useNews } from '../hooks/useAdminQueries'
import { compareDates, compareStrings, matchesSearch, type SortDir } from '../lib/listUtils'
import type { News } from '../types'

function resolveImageSrc(url?: string) {
  if (!url) return undefined
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url
  return url.startsWith('/') ? url : `/${url}`
}

export default function NewsPage() {
  const { user } = useAdminAuth()
  const { data: news = [], isLoading, isFetching } = useNews()
  const invalidate = useInvalidateAdmin()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>()
  const [titre, setTitre] = useState('')
  const [resume, setResume] = useState('')
  const [contenu, setContenu] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('ALL')
  const [sort, setSort] = useState<'date' | 'titre'>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const filteredNews = useMemo(() => {
    let list = news.filter((n) => {
      if (statutFilter !== 'ALL' && n.statut !== statutFilter) return false
      if (!matchesSearch(search, [n.titre, n.resume, n.contenu, n.statut])) return false
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'titre') return compareStrings(a.titre, b.titre, sortDir)
      return compareDates(a.createdAt, b.createdAt, sortDir)
    })
    return list
  }, [news, search, statutFilter, sort, sortDir])

  const clearForm = () => {
    setTitre('')
    setResume('')
    setContenu('')
    setImageFile(null)
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(null)
    setExistingImageUrl(undefined)
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const openCreate = () => {
    if (showForm && editingId === null) {
      clearForm()
      return
    }
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setTitre('')
    setResume('')
    setContenu('')
    setImageFile(null)
    setPreview(null)
    setExistingImageUrl(undefined)
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (n: News) => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setEditingId(n.id)
    setTitre(n.titre)
    setResume(n.resume ?? '')
    setContenu(n.contenu)
    setImageFile(null)
    setExistingImageUrl(n.imageUrl)
    setPreview(n.imageUrl ? resolveImageSrc(n.imageUrl) ?? null : null)
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

  const clearImage = () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(null)
    setImageFile(null)
    if (editingId != null) setExistingImageUrl(undefined)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')
    try {
      if (editingId != null) {
        const article = news.find((n) => n.id === editingId)
        await api.updateNews(editingId, {
          titre,
          resume,
          contenu,
          auteurId: article?.auteurId ?? user.id,
          statut: article?.statut,
          imageUrl: imageFile ? article?.imageUrl : existingImageUrl,
        })
        if (imageFile) {
          await api.uploadNewsImage(editingId, imageFile)
        }
      } else {
        const created = await api.createNews({
          titre,
          resume,
          contenu,
          auteurId: user.id,
          statut: 'BROUILLON',
        })
        if (imageFile) {
          await api.uploadNewsImage(created.id, imageFile)
        }
      }
      clearForm()
      await invalidate.news()
    } catch (err) {
      setError(err instanceof Error ? err.message : editingId ? 'Erreur modification' : 'Erreur création')
    } finally {
      setSaving(false)
    }
  }

  const publish = async (id: number) => {
    await api.publishNews(id)
    await invalidate.news()
  }

  const remove = async (id: number) => {
    if (!confirm('Supprimer cet article ?')) return
    await api.deleteNews(id)
    if (editingId === id) clearForm()
    await invalidate.news()
  }

  const statusColor: Record<string, string> = {
    BROUILLON: 'bg-zinc-500/20 text-zinc-300',
    PUBLIE: 'bg-emerald-500/20 text-emerald-300',
    ARCHIVE: 'bg-red-500/20 text-red-300',
  }

  if (isLoading && news.length === 0) {
    return <PageSkeleton rows={5} />
  }

  const isEditing = editingId != null

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={isFetching || saving} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Actualités</h2>
          <p className="text-sm text-zinc-500">Créer, modifier et publier des articles</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nouvel article
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <h3 className="font-semibold text-white">
            {isEditing ? 'Modifier l’article' : 'Nouvel article'}
          </h3>
          <div>
            <label className="label">Titre</label>
            <input className="input" value={titre} onChange={(e) => setTitre(e.target.value)} required />
          </div>
          <div>
            <label className="label">Résumé</label>
            <input className="input" value={resume} onChange={(e) => setResume(e.target.value)} />
          </div>
          <div>
            <label className="label">Contenu</label>
            <textarea
              className="input min-h-[120px] resize-y"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Image (optionnelle)</label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-ink-800/50 px-4 py-6 hover:border-gold-500/40">
              <Upload className="mb-2 h-6 w-6 text-gold-400" />
              <span className="text-sm text-zinc-400">
                {isEditing ? 'Remplacer l’image' : 'Choisir une image'}
              </span>
              <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
            </label>
            {preview && (
              <div className="relative mt-3 inline-block">
                <img src={preview} alt="Aperçu" className="h-32 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
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
              {saving
                ? 'Enregistrement…'
                : isEditing
                  ? 'Enregistrer les modifications'
                  : 'Enregistrer brouillon'}
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
        searchPlaceholder="Rechercher titre, résumé, contenu…"
        sort={sort}
        onSortChange={(v) => setSort(v as 'date' | 'titre')}
        sortOptions={[
          { value: 'date', label: 'Date' },
          { value: 'titre', label: 'Titre' },
        ]}
        sortDir={sortDir}
        onSortDirChange={setSortDir}
        resultCount={filteredNews.length}
        totalCount={news.length}
        onReset={() => {
          setSearch('')
          setStatutFilter('ALL')
          setSort('date')
          setSortDir('desc')
        }}
        filters={[
          {
            id: 'statut',
            label: 'Statut',
            value: statutFilter,
            onChange: setStatutFilter,
            options: [
              { value: 'ALL', label: 'Tous' },
              { value: 'BROUILLON', label: 'Brouillon' },
              { value: 'PUBLIE', label: 'Publié' },
              { value: 'ARCHIVE', label: 'Archivé' },
            ],
          },
        ]}
      />

      <div className="grid gap-4">
        {news.length === 0 ? (
          <p className="card p-8 text-center text-zinc-500">Aucun article</p>
        ) : filteredNews.length === 0 ? (
          <p className="card p-8 text-center text-zinc-500">Aucun article ne correspond aux filtres</p>
        ) : (
          filteredNews.map((n) => (
            <div key={n.id} className="card flex flex-wrap items-start justify-between gap-4 p-6">
              <div className="flex flex-1 gap-4">
                {n.imageUrl ? (
                  <img
                    src={resolveImageSrc(n.imageUrl)}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-ink-800">
                    <ImageIcon className="h-6 w-6 text-zinc-600" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="font-semibold text-white">{n.titre}</h3>
                    <span className={`rounded-lg px-2 py-0.5 text-xs ${statusColor[n.statut]}`}>
                      {n.statut}
                    </span>
                  </div>
                  {n.resume && <p className="mb-2 text-sm text-zinc-400">{n.resume}</p>}
                  <p className="text-xs text-zinc-600">
                    Créé le {formatDate(n.createdAt)}
                    {n.publishedAt && ` · Publié le ${formatDate(n.publishedAt)}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(n)}
                  className="rounded-xl p-2 text-zinc-500 hover:bg-white/5 hover:text-gold-300"
                  title="Modifier"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {n.statut === 'BROUILLON' && (
                  <button type="button" onClick={() => publish(n.id)} className="btn-primary text-xs">
                    <Send className="h-3 w-3" />
                    Publier
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  className="rounded-xl p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
