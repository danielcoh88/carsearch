import { useState } from 'react'
import { Car, CarImage, CarNote, CarStatus, CustomFieldDefinition, CustomFieldType } from '../types'
import { SOURCE_LABELS } from '../constants'
import { generateId } from '../storage'
import StatusBadge from './StatusBadge'
import ImageGallery from './ImageGallery'

interface CarDetailProps {
  car: Car
  customFieldDefs: CustomFieldDefinition[]
  onUpdate: (car: Car) => void
  onDelete: (id: string) => void
  onBack: () => void
  onOpenCustomFields: () => void
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

interface EditableFieldProps {
  label: string
  value: string
  onSave: (v: string) => void
  type?: 'text' | 'number' | 'url'
  placeholder?: string
}

function EditableField({ label, value, onSave, type = 'text', placeholder = '—' }: EditableFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  return (
    <div className="py-2">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir={type === 'url' ? 'ltr' : 'rtl'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onSave(draft); setEditing(false) }
              if (e.key === 'Escape') { setDraft(value); setEditing(false) }
            }}
          />
          <button onClick={() => { onSave(draft); setEditing(false) }} className="text-blue-600 text-xs hover:underline">שמור</button>
          <button onClick={() => { setDraft(value); setEditing(false) }} className="text-gray-400 text-xs hover:underline">ביטול</button>
        </div>
      ) : (
        <button
          className="text-sm text-gray-800 hover:text-blue-600 text-right w-full group flex items-center gap-1"
          onClick={() => { setDraft(value); setEditing(true) }}
        >
          <span>{value || placeholder}</span>
          <svg className="w-3 h-3 text-gray-300 group-hover:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}
    </div>
  )
}

function CustomFieldInput({
  def,
  value,
  onChange,
}: {
  def: CustomFieldDefinition
  value: string | number | boolean | null
  onChange: (v: string | number | boolean | null) => void
}) {
  const type: CustomFieldType = def.type

  if (type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(value === true ? null : true)}
          className={`px-3 py-1 rounded-lg text-sm border transition-colors ${value === true ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
        >
          כן
        </button>
        <button
          onClick={() => onChange(value === false ? null : false)}
          className={`px-3 py-1 rounded-lg text-sm border transition-colors ${value === false ? 'bg-red-100 border-red-300 text-red-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
        >
          לא
        </button>
      </div>
    )
  }

  if (type === 'rating') {
    const num = typeof value === 'number' ? value : 0
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(num === star ? null : star)}
            className={`text-2xl leading-none ${star <= num ? 'text-yellow-400' : 'text-gray-200'} hover:text-yellow-400 transition-colors`}
          >
            ★
          </button>
        ))}
      </div>
    )
  }

  return (
    <input
      type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
      value={value === null || value === undefined ? '' : String(value)}
      onChange={(e) => {
        const v = e.target.value
        if (type === 'number') onChange(v ? Number(v) : null)
        else onChange(v || null)
      }}
      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
    />
  )
}

export default function CarDetail({ car, customFieldDefs, onUpdate, onDelete, onBack, onOpenCustomFields }: CarDetailProps) {
  const [noteText, setNoteText] = useState('')

  const update = (partial: Partial<Car>) => {
    onUpdate({ ...car, ...partial, updatedAt: new Date().toISOString() })
  }

  const updateField = (key: keyof Car, value: unknown) => {
    update({ [key]: value } as Partial<Car>)
  }

  const addNote = () => {
    if (!noteText.trim()) return
    const note: CarNote = { id: generateId(), text: noteText.trim(), createdAt: new Date().toISOString() }
    update({ notes: [note, ...car.notes] })
    setNoteText('')
  }

  const deleteNote = (id: string) => {
    update({ notes: car.notes.filter((n) => n.id !== id) })
  }

  const updateCustomField = (fieldId: string, value: string | number | boolean | null) => {
    const existing = car.customFields.find((cf) => cf.fieldId === fieldId)
    if (existing) {
      update({ customFields: car.customFields.map((cf) => cf.fieldId === fieldId ? { ...cf, value } : cf) })
    } else {
      update({ customFields: [...car.customFields, { fieldId, value }] })
    }
  }

  const title = car.title || [car.make, car.model, car.year].filter(Boolean).join(' ') || 'רכב ללא שם'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm"
      >
        <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        חזור לרשימה
      </button>

      {/* Image Gallery */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <ImageGallery
          images={car.images || []}
          onChange={(imgs: CarImage[]) => {
            const primary = imgs.find((i) => i.isPrimary) || imgs[0]
            update({ images: imgs, imageUrl: primary?.url ?? '' })
          }}
        />
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{title}</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {SOURCE_LABELS[car.source]}
              </span>
              {car.url && (
                <a
                  href={car.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-0.5"
                >
                  פתח מודעה
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge
              status={car.status}
              editable
              onChange={(s: CarStatus) => updateField('status', s)}
            />
            <button
              className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
              onClick={() => {
                if (confirm(`למחוק את "${title}"?`)) {
                  onDelete(car.id)
                }
              }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-400">מחיר</p>
            <p className="font-bold text-lg text-green-700">{formatPrice(car.price)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">ק"מ</p>
            <p className="font-semibold text-gray-800">{formatKm(car.km)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">יד</p>
            <p className="font-semibold text-gray-800">{car.hand ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">פרטים</h2>
        <div className="grid grid-cols-2 gap-x-6 divide-y divide-gray-50">
          <EditableField label="כותרת" value={car.title} onSave={(v) => updateField('title', v)} />
          <EditableField label="שנה" value={car.year?.toString() || ''} onSave={(v) => updateField('year', v ? parseInt(v) : null)} type="number" />
          <EditableField label="יצרן" value={car.make} onSave={(v) => updateField('make', v)} />
          <EditableField label="דגם" value={car.model} onSave={(v) => updateField('model', v)} />
          <EditableField label="מחיר (₪)" value={car.price?.toString() || ''} onSave={(v) => updateField('price', v ? parseInt(v.replace(/[^0-9]/g, '')) : null)} type="number" />
          <EditableField label="קילומטראז׳" value={car.km?.toString() || ''} onSave={(v) => updateField('km', v ? parseInt(v.replace(/[^0-9]/g, '')) : null)} type="number" />
          <EditableField label="יד" value={car.hand?.toString() || ''} onSave={(v) => updateField('hand', v ? parseInt(v) : null)} type="number" />
          <EditableField label="צבע" value={car.color} onSave={(v) => updateField('color', v)} />
          <EditableField label="עיר" value={car.city} onSave={(v) => updateField('city', v)} />
          <EditableField label="נפח מנוע" value={car.engineSize} onSave={(v) => updateField('engineSize', v)} />
          <EditableField label="סוג דלק" value={car.fuelType} onSave={(v) => updateField('fuelType', v)} />
          <EditableField label="תיבת הילוכים" value={car.gearType} onSave={(v) => updateField('gearType', v)} />
        </div>
      </div>

      {/* Custom fields */}
      {(customFieldDefs.length > 0 || true) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">שדות מותאמים אישית</h2>
            <button
              onClick={onOpenCustomFields}
              className="text-xs text-blue-500 hover:underline"
            >
              ערוך שדות
            </button>
          </div>

          {customFieldDefs.length === 0 ? (
            <button
              onClick={onOpenCustomFields}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
            >
              + הוסף שדה מותאם אישית (יד שנייה, ביטוח, טסט...)
            </button>
          ) : (
            <div className="space-y-3">
              {customFieldDefs.map((def) => {
                const cfv = car.customFields.find((cf) => cf.fieldId === def.id)
                return (
                  <div key={def.id}>
                    <label className="block text-xs text-gray-400 mb-1">{def.label}</label>
                    <CustomFieldInput
                      def={def}
                      value={cfv?.value ?? null}
                      onChange={(v) => updateCustomField(def.id, v)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">הערות</h2>

        <div className="flex gap-2 mb-3">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="הוסף הערה..."
            rows={2}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote()
            }}
          />
          <button
            onClick={addNote}
            disabled={!noteText.trim()}
            className="bg-blue-600 text-white px-4 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm self-end py-2"
          >
            הוסף
          </button>
        </div>

        {car.notes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2">אין הערות עדיין</p>
        ) : (
          <div className="space-y-2">
            {car.notes.map((note) => (
              <div key={note.id} className="bg-gray-50 rounded-xl p-3 flex gap-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{note.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(note.createdAt).toLocaleDateString('he-IL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  className="text-gray-300 hover:text-red-400 p-1 flex-shrink-0"
                  onClick={() => deleteNote(note.id)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
