import { useState } from 'react'
import { ImageIcon, Plus, Send, Trash2, Upload, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, formatDate } from '../lib/api'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { useInvalidateAdmin, useNews } from '../hooks/useAdminQueries'

function resolveImageSrc(url?: string) {
  if (!url) return undefined
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url
  return url.startsWith('/') ? url : `/${url}`
}

export default function NewsPage() {
  const { user } = useAuth()
  const { data: news = [], isLoading, isFetching } = useNews()
  const invalidate = useInvalidateAdmin()
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState('')
  const [resume, setResume] = useState('')
  const [contenu, setContenu] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const clearForm = () => {
    setTitre('')
    setResume('')
    setContenu('')
    setImageFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setShowForm(false)
    setError('')
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (preview) URL.revokeObjectURL(preview)
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')
    try {
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
      clearForm()
      await invalidate.news()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur création')
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

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={isFetching || saving} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Actualités</h2>
          <p className="text-sm text-zinc-500">Créer et publier des articles (avec ou sans image)</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nouvel article
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4 p-6">
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
              <span className="text-sm text-zinc-400">Choisir une image</span>
              <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
            </label>
            {preview && (
              <div className="relative mt-3 inline-block">
                <img src={preview} alt="Aperçu" className="h-32 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    if (preview) URL.revokeObjectURL(preview)
                    setPreview(null)
                    setImageFile(null)
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
              {saving ? 'Enregistrement…' : 'Enregistrer brouillon'}
            </button>
            <button type="button" onClick={clearForm} className="btn-ghost">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {news.length === 0 ? (
          <p className="card p-8 text-center text-zinc-500">Aucun article</p>
        ) : (
          news.map((n) => (
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
