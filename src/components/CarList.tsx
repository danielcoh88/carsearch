import { useState, useMemo } from 'react'
import { Car, CarStatus, CustomFieldDefinition } from '../types'
import { STATUS_LABELS, ALL_STATUSES } from '../constants'
import CarCard from './CarCard'
import EmptyState from './EmptyState'

type SortKey = 'addedAt' | 'price' | 'km' | 'year'

interface CarListProps {
  cars: Car[]
  compareIds: string[]
  customFieldDefs: CustomFieldDefinition[]
  onSelectCar: (id: string) => void
  onToggleCompare: (id: string) => void
  onStartCompare: () => void
  onAddCar: () => void
  onDeleteCar: (id: string) => void
  onStatusChange: (id: string, status: CarStatus) => void
}

export default function CarList({
  cars,
  compareIds,
  onSelectCar,
  onToggleCompare,
  onStartCompare,
  onAddCar,
  onDeleteCar,
  onStatusChange,
}: CarListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('addedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<CarStatus | 'all'>('all')
  const [compareMode, setCompareMode] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let result = [...cars]

    if (filterStatus !== 'all') {
      result = result.filter((c) => c.status === filterStatus)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((c) =>
        [c.title, c.make, c.model, c.city, c.color]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    }

    result.sort((a, b) => {
      let av: number | string = 0
      let bv: number | string = 0

      if (sortKey === 'addedAt') {
        av = a.addedAt
        bv = b.addedAt
      } else if (sortKey === 'price') {
        av = a.price ?? Infinity
        bv = b.price ?? Infinity
      } else if (sortKey === 'km') {
        av = a.km ?? Infinity
        bv = b.km ?? Infinity
      } else if (sortKey === 'year') {
        av = a.year ?? 0
        bv = b.year ?? 0
      }

      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [cars, filterStatus, search, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <span className="text-gray-300">↕</span>
    return sortDir === 'asc' ? '↑' : '↓'
  }

  if (cars.length === 0) return <EmptyState onAddCar={onAddCar} />

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, דגם, עיר..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filters + Sort row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Status filter chips */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
              onClick={() => setFilterStatus('all')}
            >
              הכל ({cars.length})
            </button>
            {ALL_STATUSES.map((s) => {
              const count = cars.filter((c) => c.status === s).length
              if (count === 0) return null
              return (
                <button
                  key={s}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === s ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {STATUS_LABELS[s]} ({count})
                </button>
              )
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>מיין:</span>
            {[
              { key: 'addedAt' as SortKey, label: 'תאריך' },
              { key: 'price' as SortKey, label: 'מחיר' },
              { key: 'km' as SortKey, label: "ק\"מ" },
              { key: 'year' as SortKey, label: 'שנה' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`px-2 py-1 rounded hover:bg-gray-100 ${sortKey === key ? 'font-semibold text-gray-800' : ''}`}
                onClick={() => toggleSort(key)}
              >
                {label} {sortIcon(key)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compare mode banner */}
      {compareMode && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
          <div className="text-sm text-blue-700">
            {compareIds.length === 0 && 'בחר 2-3 רכבים להשוואה'}
            {compareIds.length === 1 && 'בחר עוד 1-2 רכבים'}
            {compareIds.length >= 2 && `${compareIds.length} רכבים נבחרו`}
          </div>
          <div className="flex gap-2">
            {compareIds.length >= 2 && (
              <button
                className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                onClick={onStartCompare}
              >
                השווה →
              </button>
            )}
            <button
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100"
              onClick={() => setCompareMode(false)}
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p>לא נמצאו רכבים תואמים לסינון</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              isInCompare={compareIds.includes(car.id)}
              compareMode={compareMode}
              onSelect={() => onSelectCar(car.id)}
              onToggleCompare={() => {
                if (!compareMode) setCompareMode(true)
                onToggleCompare(car.id)
              }}
              onDelete={() => onDeleteCar(car.id)}
              onStatusChange={(s) => onStatusChange(car.id, s)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
