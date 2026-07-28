import { ArrowDownAZ, ArrowUpAZ, Calendar, Search, SlidersHorizontal } from 'lucide-react'
import type { SortDir } from '../lib/listUtils'

export interface SelectOption {
  value: string
  label: string
}

interface ListToolbarProps {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  sort?: string
  onSortChange?: (value: string) => void
  sortOptions?: SelectOption[]
  sortDir?: SortDir
  onSortDirChange?: (dir: SortDir) => void
  filters?: Array<{
    id: string
    label: string
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
  }>
  dateFrom?: string
  dateTo?: string
  onDateFromChange?: (value: string) => void
  onDateToChange?: (value: string) => void
  showDateRange?: boolean
  resultCount?: number
  totalCount?: number
  onReset?: () => void
  children?: React.ReactNode
}

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Rechercher…',
  sort,
  onSortChange,
  sortOptions,
  sortDir = 'desc',
  onSortDirChange,
  filters,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  showDateRange,
  resultCount,
  totalCount,
  onReset,
  children,
}: ListToolbarProps) {
  const hasActiveFilters =
    (search && search.trim().length > 0) ||
    filters?.some((f) => f.value !== 'ALL' && f.value !== 'all' && f.value !== '') ||
    dateFrom ||
    dateTo

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-ink-900/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-gold-400" />
        <span className="text-sm font-medium text-zinc-300">Filtrer & trier</span>
        {resultCount != null && totalCount != null && (
          <span className="text-xs text-zinc-500">
            {resultCount} / {totalCount} élément(s)
          </span>
        )}
        {hasActiveFilters && onReset && (
          <button type="button" onClick={onReset} className="ml-auto text-xs text-gold-400 hover:text-gold-300">
            Réinitialiser
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {onSearchChange != null && (
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              className="input pl-10"
              placeholder={searchPlaceholder}
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}

        {filters?.map((f) => (
          <div key={f.id} className="min-w-[140px]">
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">
              {f.label}
            </label>
            <select className="input py-2 text-sm" value={f.value} onChange={(e) => f.onChange(e.target.value)}>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {sortOptions && onSortChange && (
          <div className="min-w-[140px]">
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">Trier par</label>
            <div className="flex gap-1">
              <select className="input flex-1 py-2 text-sm" value={sort} onChange={(e) => onSortChange(e.target.value)}>
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {onSortDirChange && (
                <button
                  type="button"
                  title={sortDir === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
                  onClick={() => onSortDirChange(sortDir === 'asc' ? 'desc' : 'asc')}
                  className="btn-ghost shrink-0 px-2"
                >
                  {sortDir === 'asc' ? (
                    <ArrowUpAZ className="h-4 w-4" />
                  ) : (
                    <ArrowDownAZ className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showDateRange && onDateFromChange && onDateToChange && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[150px]">
            <label className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500">
              <Calendar className="h-3 w-3" /> Du
            </label>
            <input type="date" className="input py-2 text-sm" value={dateFrom ?? ''} onChange={(e) => onDateFromChange(e.target.value)} />
          </div>
          <div className="min-w-[150px]">
            <label className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500">
              <Calendar className="h-3 w-3" /> Au
            </label>
            <input type="date" className="input py-2 text-sm" value={dateTo ?? ''} onChange={(e) => onDateToChange(e.target.value)} />
          </div>
        </div>
      )}

      {children}
    </div>
  )
}

export function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-gold-500/20 text-gold-300' : 'bg-ink-800 text-zinc-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}
