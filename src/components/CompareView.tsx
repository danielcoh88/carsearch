import { useState } from 'react'
import { Car, CustomFieldDefinition } from '../types'
import { STATUS_LABELS, SOURCE_LABELS } from '../constants'

interface CompareViewProps {
  cars: Car[]
  customFieldDefs: CustomFieldDefinition[]
  onBack: () => void
  onSelectCar: (id: string) => void
}

function formatPrice(n: number | null) {
  if (n === null) return null
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatKm(n: number | null) {
  if (n === null) return null
  return new Intl.NumberFormat('he-IL').format(n) + ' ק"מ'
}

type HighlightMode = 'best' | 'worst' | 'none'

interface CompareRowProps {
  label: string
  values: (string | null)[]
  highlight?: HighlightMode[]
}

function CompareRow({ label, values, highlight = [] }: CompareRowProps) {
  const allSame = values.every((v) => v === values[0])

  return (
    <tr className={`border-b border-gray-100 ${allSame && values[0] !== null ? 'opacity-60' : ''}`}>
      <td className="py-2.5 px-3 text-xs font-medium text-gray-500 w-24 whitespace-nowrap">{label}</td>
      {values.map((v, i) => {
        const mode = highlight[i]
        const bg =
          mode === 'best'
            ? 'bg-green-50 text-green-800 font-semibold'
            : mode === 'worst'
            ? 'bg-red-50 text-red-800'
            : ''
        return (
          <td key={i} className={`py-2.5 px-3 text-sm text-center ${bg}`}>
            {v ?? <span className="text-gray-300">—</span>}
          </td>
        )
      })}
    </tr>
  )
}

export default function CompareView({ cars, customFieldDefs, onBack, onSelectCar }: CompareViewProps) {
  const [showOnlyDiff, setShowOnlyDiff] = useState(false)

  if (cars.length < 2) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">בחר לפחות 2 רכבים להשוואה</p>
        <button onClick={onBack} className="mt-4 text-blue-500 hover:underline">חזור</button>
      </div>
    )
  }

  // Build highlight arrays for numeric comparisons
  const buildHighlight = (nums: (number | null)[], lowerIsBetter: boolean): HighlightMode[] => {
    const valid = nums.filter((n): n is number => n !== null)
    if (valid.length < 2) return nums.map(() => 'none')
    const best = lowerIsBetter ? Math.min(...valid) : Math.max(...valid)
    const worst = lowerIsBetter ? Math.max(...valid) : Math.min(...valid)
    return nums.map((n) => {
      if (n === null) return 'none'
      if (n === best) return 'best'
      if (n === worst) return 'worst'
      return 'none'
    })
  }

  const priceHighlight = buildHighlight(cars.map((c) => c.price), true)
  const kmHighlight = buildHighlight(cars.map((c) => c.km), true)
  const yearHighlight = buildHighlight(cars.map((c) => c.year), false)
  const handHighlight = buildHighlight(cars.map((c) => c.hand), true)

  const rows: { label: string; values: (string | null)[]; highlight?: HighlightMode[] }[] = [
    { label: 'מחיר', values: cars.map((c) => formatPrice(c.price)), highlight: priceHighlight },
    { label: 'ק"מ', values: cars.map((c) => formatKm(c.km)), highlight: kmHighlight },
    { label: 'שנה', values: cars.map((c) => c.year?.toString() || null), highlight: yearHighlight },
    { label: 'יד', values: cars.map((c) => c.hand?.toString() || null), highlight: handHighlight },
    { label: 'צבע', values: cars.map((c) => c.color || null) },
    { label: 'עיר', values: cars.map((c) => c.city || null) },
    { label: 'נפח מנוע', values: cars.map((c) => c.engineSize || null) },
    { label: 'סוג דלק', values: cars.map((c) => c.fuelType || null) },
    { label: 'הילוכים', values: cars.map((c) => c.gearType || null) },
    { label: 'סטטוס', values: cars.map((c) => STATUS_LABELS[c.status]) },
    { label: 'מקור', values: cars.map((c) => SOURCE_LABELS[c.source]) },
    { label: 'הערות', values: cars.map((c) => c.notes.length > 0 ? `${c.notes.length} הערות` : null) },
  ]

  // Custom fields rows
  customFieldDefs.forEach((def) => {
    const values = cars.map((c) => {
      const cfv = c.customFields.find((f) => f.fieldId === def.id)
      const v = cfv?.value
      if (v === null || v === undefined) return null
      if (typeof v === 'boolean') return v ? 'כן' : 'לא'
      return String(v)
    })
    rows.push({ label: def.label, values })
  })

  const filteredRows = showOnlyDiff
    ? rows.filter((r) => !r.values.every((v) => v === r.values[0]))
    : rows

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          חזור
        </button>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyDiff}
            onChange={(e) => setShowOnlyDiff(e.target.checked)}
            className="rounded border-gray-300"
          />
          הצג הבדלים בלבד
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 px-3 text-right text-xs font-medium text-gray-400 w-24"></th>
              {cars.map((car) => {
                const title = car.title || [car.make, car.model, car.year].filter(Boolean).join(' ') || 'רכב'
                return (
                  <th key={car.id} className="py-3 px-3 text-center min-w-[140px]">
                    <div className="flex flex-col items-center gap-1">
                      {(car.images?.find((i) => i.isPrimary)?.url || car.images?.[0]?.url || car.imageUrl) && (
                        <img src={car.images?.find((i) => i.isPrimary)?.url || car.images?.[0]?.url || car.imageUrl} alt={title} className="w-16 h-12 object-cover rounded-lg" />
                      )}
                      <button
                        className="text-sm font-semibold text-gray-800 hover:text-blue-600 hover:underline line-clamp-2"
                        onClick={() => onSelectCar(car.id)}
                      >
                        {title}
                      </button>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, i) => (
              <CompareRow key={i} {...row} />
            ))}
          </tbody>
        </table>

        {filteredRows.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            כל הערכים זהים — בטל את הסינון לצפייה בכולם
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">
        <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded mr-1 align-middle"></span>ערך טוב יותר&nbsp;&nbsp;
        <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded mr-1 align-middle"></span>ערך נמוך יותר
      </p>
    </div>
  )
}
