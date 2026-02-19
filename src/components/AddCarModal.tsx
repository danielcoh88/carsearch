import { useState } from 'react'
import { Car, CustomFieldDefinition } from '../types'
import { fetchCarDetails, detectSource } from '../scraper'
import { generateId } from '../storage'

interface AddCarModalProps {
  onAdd: (car: Car) => void
  onClose: () => void
  customFieldDefs: CustomFieldDefinition[]
}

type Mode = 'url' | 'manual'
type FetchState = 'idle' | 'loading' | 'success' | 'error'

const EMPTY_FORM = {
  title: '',
  make: '',
  model: '',
  year: '',
  price: '',
  km: '',
  hand: '',
  color: '',
  city: '',
  engineSize: '',
  fuelType: '',
  gearType: '',
  imageUrl: '',
}

export default function AddCarModal({ onAdd, onClose, customFieldDefs }: AddCarModalProps) {
  const [mode, setMode] = useState<Mode>('url')
  const [url, setUrl] = useState('')
  const [fetchState, setFetchState] = useState<FetchState>('idle')
  const [fetchError, setFetchError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const handleFetch = async () => {
    if (!url.trim()) return
    setFetchState('loading')
    setFetchError('')

    try {
      const data = await fetchCarDetails(url.trim())
      setForm({
        title: data.title || '',
        make: data.make || '',
        model: data.model || '',
        year: data.year?.toString() || '',
        price: data.price?.toString() || '',
        km: data.km?.toString() || '',
        hand: data.hand?.toString() || '',
        color: data.color || '',
        city: data.city || '',
        engineSize: data.engineSize || '',
        fuelType: data.fuelType || '',
        gearType: data.gearType || '',
        imageUrl: data.imageUrl || '',
      })
      setFetchState('success')
      setMode('manual')
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'שגיאה בלתי ידועה')
      setFetchState('error')
      setMode('manual')
    }
  }

  const handleSave = () => {
    const now = new Date().toISOString()
    const car: Car = {
      id: generateId(),
      url: url.trim(),
      source: url.trim() ? detectSource(url.trim()) : 'other',
      addedAt: now,
      updatedAt: now,
      title: form.title || [form.make, form.model, form.year].filter(Boolean).join(' ') || 'רכב ללא שם',
      make: form.make,
      model: form.model,
      year: form.year ? parseInt(form.year) : null,
      price: form.price ? parseInt(form.price.replace(/[^0-9]/g, '')) : null,
      km: form.km ? parseInt(form.km.replace(/[^0-9]/g, '')) : null,
      hand: form.hand ? parseInt(form.hand) : null,
      color: form.color,
      city: form.city,
      engineSize: form.engineSize,
      fuelType: form.fuelType,
      gearType: form.gearType,
      imageUrl: form.imageUrl,
      status: 'interested',
      notes: [],
      customFields: customFieldDefs.map((d) => ({ fieldId: d.id, value: null })),
      fetchStatus: fetchState === 'success' ? 'success' : fetchState === 'error' ? 'failed' : 'manual',
      fetchError: fetchError || undefined,
    }
    onAdd(car)
  }

  const setField = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">הוסף רכב</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
            <button
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${mode === 'url' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
              onClick={() => setMode('url')}
            >
              הדבק קישור
            </button>
            <button
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${mode === 'manual' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
              onClick={() => setMode('manual')}
            >
              הכנסה ידנית
            </button>
          </div>

          {/* URL mode */}
          {mode === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  קישור למודעה (יד2, win.co.il וכו׳)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.yad2.co.il/item/..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                />
              </div>

              {fetchState === 'error' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                  <p className="font-medium mb-1">לא ניתן היה לשלוף פרטים אוטומטית</p>
                  <p className="text-xs">{fetchError}</p>
                  <p className="text-xs mt-1">תוכל להכניס פרטים ידנית בלשונית "הכנסה ידנית"</p>
                </div>
              )}

              <button
                onClick={handleFetch}
                disabled={!url.trim() || fetchState === 'loading'}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {fetchState === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    שולף פרטים...
                  </>
                ) : (
                  'ייבא פרטים אוטומטית'
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                או{' '}
                <button className="underline hover:text-gray-600" onClick={() => setMode('manual')}>
                  הכנס פרטים ידנית
                </button>
              </p>
            </div>
          )}

          {/* Manual / preview form */}
          {mode === 'manual' && (
            <div className="space-y-3">
              {fetchState === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  פרטים שולפו בהצלחה — בדוק ועדכן לפי הצורך
                </div>
              )}

              {/* URL field (optional in manual mode) */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">קישור (אופציונלי)</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">כותרת המודעה</label>
                  <input
                    value={form.title}
                    onChange={(e) => setField('title', e.target.value)}
                    placeholder="לדוגמה: טויוטה קורולה 2019"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">יצרן</label>
                  <input
                    value={form.make}
                    onChange={(e) => setField('make', e.target.value)}
                    placeholder="טויוטה"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">דגם</label>
                  <input
                    value={form.model}
                    onChange={(e) => setField('model', e.target.value)}
                    placeholder="קורולה"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">שנה</label>
                  <input
                    value={form.year}
                    onChange={(e) => setField('year', e.target.value)}
                    placeholder="2019"
                    type="number"
                    min="1990"
                    max="2030"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">מחיר (₪)</label>
                  <input
                    value={form.price}
                    onChange={(e) => setField('price', e.target.value)}
                    placeholder="78500"
                    type="text"
                    inputMode="numeric"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">קילומטראז׳</label>
                  <input
                    value={form.km}
                    onChange={(e) => setField('km', e.target.value)}
                    placeholder="85000"
                    type="text"
                    inputMode="numeric"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">יד</label>
                  <input
                    value={form.hand}
                    onChange={(e) => setField('hand', e.target.value)}
                    placeholder="2"
                    type="number"
                    min="1"
                    max="10"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">צבע</label>
                  <input
                    value={form.color}
                    onChange={(e) => setField('color', e.target.value)}
                    placeholder="לבן"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">עיר</label>
                  <input
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                    placeholder="תל אביב"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">נפח מנוע</label>
                  <input
                    value={form.engineSize}
                    onChange={(e) => setField('engineSize', e.target.value)}
                    placeholder="1600"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">סוג דלק</label>
                  <input
                    value={form.fuelType}
                    onChange={(e) => setField('fuelType', e.target.value)}
                    placeholder="בנזין"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">תיבת הילוכים</label>
                  <input
                    value={form.gearType}
                    onChange={(e) => setField('gearType', e.target.value)}
                    placeholder="אוטומטית"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">קישור לתמונה</label>
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setField('imageUrl', e.target.value)}
                    placeholder="https://..."
                    dir="ltr"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === 'manual' && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              שמור רכב
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
