import { useState } from 'react'
import { Plus, Send, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, formatDate } from '../lib/api'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { useInvalidateAdmin, useNews } from '../hooks/useAdminQueries'

export default function NewsPage() {
  const { user } = useAuth()
  const { data: news = [], isLoading, isFetching } = useNews()
  const invalidate = useInvalidateAdmin()
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState('')
  const [resume, setResume] = useState('')
  const [contenu, setContenu] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    await api.createNews({
      titre,
      resume,
      contenu,
      auteurId: user.id,
      statut: 'BROUILLON',
    })
    setTitre('')
    setResume('')
    setContenu('')
    setShowForm(false)
    await invalidate.news()
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
      <QueryStatusBar fetching={isFetching} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Actualités</h2>
          <p className="text-sm text-zinc-500">Créer et publier des articles</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
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
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Enregistrer brouillon</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {news.length === 0 ? (
          <p className="card p-8 text-center text-zinc-500">Aucun article</p>
        ) : (
          news.map((n) => (
            <div key={n.id} className="card flex flex-wrap items-start justify-between gap-4 p-6">
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
              <div className="flex gap-2">
                {n.statut === 'BROUILLON' && (
                  <button onClick={() => publish(n.id)} className="btn-primary text-xs">
                    <Send className="h-3 w-3" />
                    Publier
                  </button>
                )}
                <button
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
