import { useState, useRef, useEffect } from 'react'
import { CarStatus } from '../types'
import { STATUS_LABELS, STATUS_COLORS, ALL_STATUSES } from '../constants'

interface StatusBadgeProps {
  status: CarStatus
  editable?: boolean
  onChange?: (status: CarStatus) => void
}

export default function StatusBadge({ status, editable = false, onChange }: StatusBadgeProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const badge = (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status]} ${editable ? 'cursor-pointer select-none' : ''}`}
      onClick={editable ? () => setOpen(!open) : undefined}
    >
      {STATUS_LABELS[status]}
      {editable && <span className="mr-1 text-[10px]">▾</span>}
    </span>
  )

  if (!editable) return badge

  return (
    <div ref={ref} className="relative inline-block">
      {badge}
      {open && (
        <div className="absolute z-50 top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              className={`w-full text-right px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${s === status ? 'font-semibold' : ''}`}
              onClick={() => {
                onChange?.(s)
                setOpen(false)
              }}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[s].split(' ')[0]}`} />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
