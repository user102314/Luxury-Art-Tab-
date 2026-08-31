import { useState } from 'react'
import { Frame, ImagePlus, Plus, Ruler, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { PageSkeleton, QueryStatusBar } from '../components/QueryStatusBar'
import { useCatalogPricing, useInvalidateAdmin } from '../hooks/useAdminQueries'
import { resolveImageSrc } from '@/lib/images'
import { formatDimensionLabel } from '@/lib/pricing'
import type { Cadre, CadreCouleur, TableauDimension } from '../types'

const EMPTY_COLOR_DRAFT = { nom: '', hex: '#111111', file: null as File | null, preview: '' }

function toColorPickerValue(hex?: string) {
  const raw = (hex ?? '#111111').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
  }
  return '#111111'
}

export default function PricingPage() {
  const { data: catalog, isLoading, isFetching, error: loadError } = useCatalogPricing()
  const invalidate = useInvalidateAdmin()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savingCell, setSavingCell] = useState('')
  const [newDim, setNewDim] = useState('')
  const [newDimNote, setNewDimNote] = useState('')
  const [newCadre, setNewCadre] = useState('')
  const [colorDrafts, setColorDrafts] = useState<
    Record<number, { nom: string; hex: string; file: File | null; preview: string }>
  >({})

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
      await api.createDimension({
        label: newDim.trim(),
        note: newDimNote.trim() || undefined,
      })
      setNewDim('')
      setNewDimNote('')
      await refresh()
      flash('Dimension ajoutée')
    } catch (err) {
      handleError(err)
    }
  }

  const saveDimensionNote = async (dim: TableauDimension, rawNote: string) => {
    const note = rawNote.trim()
    if ((dim.note ?? '') === note) return
    try {
      await api.updateDimension(dim.id, {
        label: dim.label,
        note: note || undefined,
      })
      await refresh()
      flash('Note de dimension enregistrée')
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
    const draft = colorDrafts[cadreId] ?? EMPTY_COLOR_DRAFT
    if (!draft.nom.trim()) {
      setError('Indiquez le nom de la couleur')
      setMessage('')
      return
    }
    if (!draft.file) {
      setError('Ajoutez une photo de l’échantillon pour cette couleur')
      setMessage('')
      return
    }
    try {
      const created = await api.createCadreCouleur(cadreId, {
        nom: draft.nom.trim(),
        hex: toColorPickerValue(draft.hex),
      })
      await api.uploadCadreCouleurImage(created.id, draft.file)
      setColorDrafts((prev) => ({ ...prev, [cadreId]: { ...EMPTY_COLOR_DRAFT } }))
      await refresh()
      flash('Couleur et image ajoutées')
    } catch (err) {
      handleError(err)
    }
  }

  const replaceColorImage = async (color: CadreCouleur, file?: File) => {
    if (!file) return
    try {
      await api.uploadCadreCouleurImage(color.id, file)
      await refresh()
      flash(`Image « ${color.nom} » mise à jour`)
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
                  <td className="px-4 py-3 font-medium text-white">{formatDimensionLabel(dim)}</td>
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
          <form onSubmit={addDimension} className="mb-4 space-y-2">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Ex. 90/60"
                value={newDim}
                onChange={(e) => setNewDim(e.target.value)}
              />
              <input
                className="input w-28"
                placeholder="Note (opt.)"
                title="Ex. 3 pour un tableau 3 pièces"
                value={newDimNote}
                onChange={(e) => setNewDimNote(e.target.value)}
              />
              <button type="submit" className="btn-primary shrink-0">
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              La note est optionnelle. Ex. note « 3 » → affichage client : 3 × 90×60 cm
            </p>
          </form>
          <ul className="space-y-2">
            {dimensions.map((dim) => (
              <li
                key={dim.id}
                className="flex flex-col gap-2 rounded-xl bg-ink-800/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{formatDimensionLabel(dim)}</p>
                  <p className="font-mono text-xs text-zinc-500">{dim.label}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <input
                    className="input w-28 text-sm"
                    placeholder="Note"
                    defaultValue={dim.note ?? ''}
                    key={`note-${dim.id}-${dim.note ?? ''}`}
                    onBlur={(e) => void saveDimensionNote(dim, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => void deleteDimension(dim)}
                    className="rounded-lg p-2 text-zinc-500 hover:text-red-400"
                    aria-label={`Supprimer ${formatDimensionLabel(dim)}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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
              const draft = colorDrafts[cadre.id] ?? EMPTY_COLOR_DRAFT
              const pickerHex = toColorPickerValue(draft.hex)
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
                  <ul className="mb-3 space-y-2">
                    {(cadre.couleurs ?? []).map((color) => (
                      <li key={color.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="inline-flex min-w-0 items-center gap-2 text-zinc-300">
                          {color.imageUrl ? (
                            <img
                              src={resolveImageSrc(color.imageUrl)}
                              alt={color.nom}
                              className="h-12 w-10 shrink-0 rounded-md object-cover ring-1 ring-white/15"
                            />
                          ) : (
                            <span
                              className="h-12 w-10 shrink-0 rounded-md border border-white/20"
                              style={{ background: color.hex || '#888' }}
                            />
                          )}
                          <span>
                            {color.nom}
                            {color.hex && (
                              <span className="ml-2 font-mono text-[11px] text-zinc-500">{color.hex}</span>
                            )}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                          <label className="cursor-pointer rounded-lg p-2 text-zinc-500 hover:text-gold-400" title="Changer l’image">
                            <ImagePlus className="h-4 w-4" />
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                e.target.value = ''
                                void replaceColorImage(color, file)
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => void deleteColor(color)}
                            className="rounded-lg p-2 text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </li>
                    ))}
                    {(cadre.couleurs ?? []).length === 0 && (
                      <li className="text-xs text-zinc-500">Aucune couleur (ex. sans cadre)</li>
                    )}
                  </ul>
                  <form
                    className="space-y-3 rounded-lg border border-white/10 bg-ink-950/40 p-3"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void addColor(cadre.id)
                    }}
                  >
                    <label className="block text-xs text-zinc-400">
                      Nom de la couleur
                      <input
                        className="input mt-1 w-full"
                        placeholder="Ex. Doré, Noir, Argenté"
                        value={draft.nom}
                        onChange={(e) =>
                          setColorDrafts((prev) => ({
                            ...prev,
                            [cadre.id]: { ...draft, nom: e.target.value },
                          }))
                        }
                      />
                    </label>
                    <div>
                      <p className="mb-1 text-xs text-zinc-400">Palette</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={pickerHex}
                          onChange={(e) =>
                            setColorDrafts((prev) => ({
                              ...prev,
                              [cadre.id]: { ...draft, hex: e.target.value },
                            }))
                          }
                          className="h-11 w-14 cursor-pointer rounded-lg border border-white/15 bg-transparent p-1"
                          title="Choisir la couleur"
                        />
                        <input
                          className="input w-28 font-mono"
                          value={pickerHex}
                          onChange={(e) =>
                            setColorDrafts((prev) => ({
                              ...prev,
                              [cadre.id]: { ...draft, hex: e.target.value },
                            }))
                          }
                        />
                        <span
                          className="h-11 w-11 rounded-lg border border-white/15"
                          style={{ background: pickerHex }}
                        />
                      </div>
                    </div>
                    <label className="block text-xs text-zinc-400">
                      Photo de l’échantillon
                      <span className="mt-1 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 px-3 py-2 hover:border-gold-400/50">
                        {draft.preview ? (
                          <img
                            src={draft.preview}
                            alt=""
                            className="h-12 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <ImagePlus className="h-5 w-5 text-zinc-500" />
                        )}
                        <span className="text-sm text-zinc-300">
                          {draft.file ? draft.file.name : 'Choisir une image'}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setColorDrafts((prev) => {
                              const current = prev[cadre.id] ?? draft
                              if (current.preview) URL.revokeObjectURL(current.preview)
                              return {
                                ...prev,
                                [cadre.id]: {
                                  ...current,
                                  file,
                                  preview: file ? URL.createObjectURL(file) : '',
                                },
                              }
                            })
                          }}
                        />
                      </span>
                    </label>
                    <button type="submit" className="btn-primary w-full">
                      <Plus className="h-4 w-4" />
                      Ajouter la couleur
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <p className="text-xs text-zinc-500">
        Chaque couleur de cadre doit avoir une photo d’échantillon (angle du cadre).
        Côté boutique, le clic sur une couleur affiche cette image. Le tarif dépend toujours
        uniquement de la dimension et du type de cadre.
      </p>
    </div>
  )
}
