import { useState } from 'react'
import { CustomFieldDefinition, CustomFieldType } from '../types'
import { FIELD_TYPE_LABELS } from '../constants'
import { generateId } from '../storage'

interface CustomFieldEditorProps {
  fieldDefs: CustomFieldDefinition[]
  onAdd: (def: CustomFieldDefinition) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export default function CustomFieldEditor({
  fieldDefs,
  onAdd,
  onDelete,
  onClose,
}: CustomFieldEditorProps) {
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<CustomFieldType>('text')

  const handleAdd = () => {
    if (!newLabel.trim()) return
    onAdd({
      id: generateId(),
      label: newLabel.trim(),
      type: newType,
      order: fieldDefs.length,
    })
    setNewLabel('')
    setNewType('text')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">שדות מותאמים אישית</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Existing fields */}
          {fieldDefs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">אין עדיין שדות מותאמים</p>
          ) : (
            <div className="space-y-2">
              {fieldDefs.map((def) => (
                <div key={def.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{def.label}</span>
                    <span className="text-xs text-gray-400 mr-2">{FIELD_TYPE_LABELS[def.type]}</span>
                  </div>
                  <button
                    className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                    onClick={() => {
                      if (confirm(`למחוק את השדה "${def.label}"? הפעולה תסיר את הערכים מכל הרכבים.`)) {
                        onDelete(def.id)
                      }
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new field */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">הוסף שדה חדש</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">שם השדה</label>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="לדוגמה: מצב מרחפת, תאריך טסט..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">סוג שדה</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as CustomFieldType)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {(Object.keys(FIELD_TYPE_LABELS) as CustomFieldType[]).map((t) => (
                    <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAdd}
                disabled={!newLabel.trim()}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                הוסף שדה
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
