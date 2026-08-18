import { useState } from 'react'
import { Frame, Palette, Plus, Ruler, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { useCatalogPricing, useInvalidateAdmin } from '../hooks/useAdminQueries'
import type { Cadre, CadreCouleur, TableauDimension } from '../types'

export default function PricingPage() {
  const { data: catalog, isLoading, isFetching, error: loadError } = useCatalogPricing()
  const invalidate = useInvalidateAdmin()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savingCell, setSavingCell] = useState('')
  const [newDim, setNewDim] = useState('')
  const [newCadre, setNewCadre] = useState('')
  const [colorDrafts, setColorDrafts] = useState<Record<number, { nom: string; hex: string }>>({})

  const refresh = async () => {
    await invalidate.catalogPricing()
    await invalidate.products()
  }

  const flash = (text: string) => {
    setMessage(text)
    setError('')
  }

  const handleError = (err: unknown) => {
    setError(err instanceof Error ? err.message : 'Erreur')
    setMessage('')
  }

  const saveTarif = async (dimensionId: number, cadreId: number, raw: string) => {
    const cleaned = raw.trim().replace(',', '.')
    const prix = cleaned === '' ? null : Number(cleaned)
    if (cleaned !== '' && (!Number.isFinite(prix) || (prix ?? 0) < 0)) {
      setError('Prix invalide')
      return
    }
    const key = `${dimensionId}-${cadreId}`
    setSavingCell(key)
    try {
      await api.upsertTarif({ dimensionId, cadreId, prix })
      await refresh()
      flash('Tarif enregistré — tous les tableaux de cette dimension sont mis à jour')
    } catch (err) {
      handleError(err)
    } finally {
      setSavingCell('')
    }
  }

  const addDimension = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDim.trim()) return
    try {
      await api.createDimension({ label: newDim.trim() })
      setNewDim('')
      await refresh()
      flash('Dimension ajoutée')
    } catch (err) {
      handleError(err)
    }
  }

  const deleteDimension = async (dim: TableauDimension) => {
    if (!confirm(`Supprimer la dimension ${dim.label} ?`)) return
    try {
      await api.deleteDimension(dim.id)
      await refresh()
      flash('Dimension supprimée')
    } catch (err) {
      handleError(err)
    }
  }

  const addCadre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCadre.trim()) return
    try {
      await api.createCadre({ nom: newCadre.trim() })
      setNewCadre('')
      await refresh()
      flash('Cadre ajouté')
    } catch (err) {
      handleError(err)
    }
  }

  const deleteCadre = async (cadre: Cadre) => {
    if (!confirm(`Supprimer « ${cadre.nom} » ?`)) return
    try {
      await api.deleteCadre(cadre.id)
      await refresh()
      flash('Cadre supprimé')
    } catch (err) {
      handleError(err)
    }
  }

  const addColor = async (cadreId: number) => {
    const draft = colorDrafts[cadreId]
    if (!draft?.nom.trim()) return
    try {
      await api.createCadreCouleur(cadreId, {
        nom: draft.nom.trim(),
        hex: draft.hex.trim() || undefined,
      })
      setColorDrafts((prev) => ({ ...prev, [cadreId]: { nom: '', hex: '' } }))
      await refresh()
      flash('Couleur ajoutée')
    } catch (err) {
      handleError(err)
    }
  }

  const deleteColor = async (color: CadreCouleur) => {
    try {
      await api.deleteCadreCouleur(color.id)
      await refresh()
    } catch (err) {
      handleError(err)
    }
  }

  if (isLoading && !catalog) return <PageSkeleton rows={8} />

  const dimensions = catalog?.dimensions ?? []
  const cadres = catalog?.cadres ?? []
  const tarifs = catalog?.tarifs ?? []

  return (
    <div className="space-y-6">
      <QueryStatusBar fetching={isFetching} />
      <div>
        <h2 className="text-xl font-semibold text-white">Tarifs, dimensions et cadres</h2>
        <p className="text-sm text-zinc-500">
          Un prix modifié ici s’applique à tous les tableaux qui proposent cette dimension.
          Une case vide = format indisponible.
        </p>
      </div>

      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {(error || loadError) && (
        <p className="text-sm text-red-400">
          {error || (loadError instanceof Error ? loadError.message : 'Erreur de chargement')}
        </p>
      )}

      <div className="card overflow-x-auto">
        <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
          <Ruler className="h-4 w-4 text-gold-400" />
          <h3 className="font-semibold text-white">Grille des prix (TND)</h3>
        </div>
        {dimensions.length === 0 || cadres.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">Ajoutez d’abord des dimensions et des cadres.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                <th className="px-4 py-3">Dimension</th>
                {cadres.map((c) => (
                  <th key={c.id} className="px-4 py-3">
                    {c.nom}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dimensions.map((dim) => (
                <tr key={dim.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium text-white">{dim.label}</td>
                  {cadres.map((cadre) => {
                    const tarif = tarifs.find(
                      (t) => t.dimensionId === dim.id && t.cadreId === cadre.id,
                    )
                    const key = `${dim.id}-${cadre.id}`
                    return (
                      <td key={cadre.id} className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          step="1"
                          defaultValue={tarif?.prix ?? ''}
                          key={`${key}-${tarif?.prix ?? 'empty'}`}
                          onBlur={(e) => {
                            const current = tarif?.prix == null ? '' : String(tarif.prix)
                            if (e.target.value.trim() === current) return
                            void saveTarif(dim.id, cadre.id, e.target.value)
                          }}
                          placeholder="—"
                          className="input w-24"
                          disabled={savingCell === key}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Ruler className="h-4 w-4 text-gold-400" />
            <h3 className="font-semibold text-white">Dimensions</h3>
          </div>
          <form onSubmit={addDimension} className="mb-4 flex gap-2">
            <input
              className="input flex-1"
              placeholder="Ex. 90/60"
              value={newDim}
              onChange={(e) => setNewDim(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </form>
          <ul className="space-y-2">
            {dimensions.map((dim) => (
              <li
                key={dim.id}
                className="flex items-center justify-between rounded-xl bg-ink-800/60 px-4 py-2"
              >
                <span className="text-sm text-white">{dim.label} cm</span>
                <button
                  type="button"
                  onClick={() => void deleteDimension(dim)}
                  className="rounded-lg p-2 text-zinc-500 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Frame className="h-4 w-4 text-gold-400" />
            <h3 className="font-semibold text-white">Cadres et couleurs</h3>
          </div>
          <form onSubmit={addCadre} className="mb-4 flex gap-2">
            <input
              className="input flex-1"
              placeholder="Nom du cadre"
              value={newCadre}
              onChange={(e) => setNewCadre(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </form>
          <div className="space-y-4">
            {cadres.map((cadre) => {
              const draft = colorDrafts[cadre.id] ?? { nom: '', hex: '' }
              return (
                <div key={cadre.id} className="rounded-xl border border-white/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-medium text-white">{cadre.nom}</p>
                    <button
                      type="button"
                      onClick={() => void deleteCadre(cadre)}
                      className="rounded-lg p-2 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <ul className="mb-3 space-y-1">
                    {(cadre.couleurs ?? []).map((color) => (
                      <li key={color.id} className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2 text-zinc-300">
                          <span
                            className="h-4 w-4 rounded-full border border-white/20"
                            style={{ background: color.hex || '#888' }}
                          />
                          {color.nom}
                        </span>
                        <button
                          type="button"
                          onClick={() => void deleteColor(color)}
                          className="text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                    {(cadre.couleurs ?? []).length === 0 && (
                      <li className="text-xs text-zinc-500">Aucune couleur (ex. sans cadre)</li>
                    )}
                  </ul>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      placeholder="Couleur"
                      value={draft.nom}
                      onChange={(e) =>
                        setColorDrafts((prev) => ({
                          ...prev,
                          [cadre.id]: { ...draft, nom: e.target.value },
                        }))
                      }
                    />
                    <input
                      className="input w-24"
                      placeholder="#111"
                      value={draft.hex}
                      onChange={(e) =>
                        setColorDrafts((prev) => ({
                          ...prev,
                          [cadre.id]: { ...draft, hex: e.target.value },
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => void addColor(cadre.id)}
                      className="btn-ghost"
                    >
                      <Palette className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <p className="text-xs text-zinc-500">
        Les prix affichés côté boutique dépendent uniquement de la dimension et du type de cadre.
        La couleur ne change pas le tarif.
      </p>
    </div>
  )
}
