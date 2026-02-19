import { Car, CarStatus } from '../types'
import { SOURCE_LABELS } from '../constants'
import StatusBadge from './StatusBadge'

interface CarCardProps {
  car: Car
  isInCompare: boolean
  compareMode: boolean
  onSelect: () => void
  onToggleCompare: () => void
  onDelete: () => void
  onStatusChange: (status: CarStatus) => void
}

function formatPrice(n: number | null) {
  if (n === null) return '—'
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatKm(n: number | null) {
  if (n === null) return '—'
  return new Intl.NumberFormat('he-IL').format(n) + ' ק"מ'
}

export default function CarCard({
  car,
  isInCompare,
  compareMode,
  onSelect,
  onToggleCompare,
  onDelete,
  onStatusChange,
}: CarCardProps) {
  const primaryImage = car.images?.find((i) => i.isPrimary)?.url || car.images?.[0]?.url || car.imageUrl || ''
  const hasImage = primaryImage.length > 0
  const imageCount = car.images?.length ?? (car.imageUrl ? 1 : 0)
  const title = car.title || [car.make, car.model, car.year].filter(Boolean).join(' ') || 'רכב ללא שם'

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-md cursor-pointer ${
        isInCompare ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100 hover:border-gray-200'
      } ${car.status === 'rejected' ? 'opacity-60' : ''}`}
    >
      {/* Image */}
      <div className="relative" onClick={onSelect}>
        <div className="w-full h-44 bg-gray-100 rounded-t-xl overflow-hidden flex items-center justify-center">
          {hasImage ? (
            <img
              src={primaryImage}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="flex flex-col items-center text-gray-300">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
              </svg>
              <span className="text-xs mt-1">אין תמונה</span>
            </div>
          )}
          {/* Image count badge */}
          {imageCount > 1 && (
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {imageCount}
            </div>
          )}
        </div>

        {/* Source badge */}
        <div className="absolute top-2 right-2">
          <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {SOURCE_LABELS[car.source]}
          </span>
        </div>

        {/* Fetch status indicator */}
        {car.fetchStatus === 'pending' && (
          <div className="absolute top-2 left-2">
            <div className="w-4 h-4 border-2 border-white border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
        {car.fetchStatus === 'failed' && (
          <div className="absolute top-2 left-2" title="שליפה נכשלה - פרטים הוכנסו ידנית">
            <span className="bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">!</span>
          </div>
        )}

        {/* Compare checkbox */}
        {compareMode && (
          <button
            className={`absolute bottom-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
              isInCompare
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white/90 border-gray-400'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleCompare()
            }}
          >
            {isInCompare && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3" onClick={onSelect}>
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{title}</h3>

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mb-2">
          {car.price !== null && (
            <span className="font-semibold text-green-700 text-sm">{formatPrice(car.price)}</span>
          )}
          {car.km !== null && <span>{formatKm(car.km)}</span>}
          {car.hand !== null && <span>יד {car.hand}</span>}
          {car.year && <span>{car.year}</span>}
          {car.city && <span>{car.city}</span>}
        </div>

        {car.notes.length > 0 && (
          <p className="text-xs text-gray-400 line-clamp-1 mb-2">
            💬 {car.notes[car.notes.length - 1].text}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-3 pb-3 flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <StatusBadge status={car.status} editable onChange={onStatusChange} />

        <div className="flex items-center gap-1">
          {!compareMode && (
            <button
              className="text-xs text-gray-400 hover:text-blue-500 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              onClick={onToggleCompare}
              title="הוסף להשוואה"
            >
              השווה
            </button>
          )}
          <button
            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`למחוק את "${title}"?`)) onDelete()
            }}
            title="מחק רכב"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
