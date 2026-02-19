import { useState } from 'react'
import { Car, CarStatus, CustomFieldDefinition } from './types'
import {
  getCars,
  saveCar,
  deleteCar,
  getCustomFieldDefs,
  saveCustomFieldDef,
  deleteCustomFieldDef,
  exportData,
  importData,
} from './storage'
import CarList from './components/CarList'
import CarDetail from './components/CarDetail'
import CompareView from './components/CompareView'
import AddCarModal from './components/AddCarModal'
import CustomFieldEditor from './components/CustomFieldEditor'

type View = 'list' | 'detail' | 'compare'

export default function App() {
  const [cars, setCars] = useState<Car[]>(() => getCars())
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>(() => getCustomFieldDefs())
  const [view, setView] = useState<View>('list')
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFieldEditor, setShowFieldEditor] = useState(false)

  // ─── Car CRUD ──────────────────────────────────────────────────────────────

  const handleAddCar = (car: Car) => {
    saveCar(car)
    setCars(getCars())
    setShowAddModal(false)
  }

  const handleUpdateCar = (car: Car) => {
    saveCar(car)
    setCars(getCars())
  }

  const handleDeleteCar = (id: string) => {
    deleteCar(id)
    setCars(getCars())
    setCompareIds((prev) => prev.filter((cid) => cid !== id))
    if (selectedCarId === id) {
      setView('list')
      setSelectedCarId(null)
    }
  }

  const handleStatusChange = (id: string, status: CarStatus) => {
    const car = cars.find((c) => c.id === id)
    if (!car) return
    handleUpdateCar({ ...car, status, updatedAt: new Date().toISOString() })
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  const handleSelectCar = (id: string) => {
    setSelectedCarId(id)
    setView('detail')
  }

  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((cid) => cid !== id)
      if (prev.length >= 3) return prev // max 3
      return [...prev, id]
    })
  }

  const handleStartCompare = () => {
    if (compareIds.length >= 2) setView('compare')
  }

  // ─── Custom Fields ─────────────────────────────────────────────────────────

  const handleAddFieldDef = (def: CustomFieldDefinition) => {
    saveCustomFieldDef(def)
    setCustomFieldDefs(getCustomFieldDefs())
  }

  const handleDeleteFieldDef = (id: string) => {
    deleteCustomFieldDef(id)
    setCustomFieldDefs(getCustomFieldDefs())
    setCars(getCars()) // refresh cars since field values were stripped
  }

  // ─── Export / Import ───────────────────────────────────────────────────────

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `car-manager-backup-${new Date().toLocaleDateString('he-IL').replace(/\./g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          importData(ev.target?.result as string)
          setCars(getCars())
          setCustomFieldDefs(getCustomFieldDefs())
          alert('הנתונים יובאו בהצלחה')
        } catch {
          alert('שגיאה בייבוא הקובץ — ודא שהפורמט תקין')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const selectedCar = selectedCarId ? cars.find((c) => c.id === selectedCarId) : null
  const compareCars = cars.filter((c) => compareIds.includes(c.id))

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            className="flex items-center gap-2 text-gray-800 hover:text-gray-600 transition-colors"
            onClick={() => { setView('list'); setSelectedCarId(null) }}
          >
            <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
            <span className="font-bold text-lg">מנהל רכישת רכב</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Compare badge */}
            {compareIds.length > 0 && view !== 'compare' && (
              <button
                onClick={handleStartCompare}
                disabled={compareIds.length < 2}
                className="text-sm bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-100 disabled:opacity-50 transition-colors"
              >
                השווה ({compareIds.length})
              </button>
            )}

            {/* Field editor */}
            <button
              onClick={() => setShowFieldEditor(true)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors"
              title="שדות מותאמים אישית"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors"
              title="ייצוא גיבוי"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {/* Import */}
            <button
              onClick={handleImport}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors"
              title="ייבוא גיבוי"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>

            {/* Add car */}
            {view === 'list' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                הוסף רכב
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {view === 'list' && (
          <CarList
            cars={cars}
            compareIds={compareIds}
            customFieldDefs={customFieldDefs}
            onSelectCar={handleSelectCar}
            onToggleCompare={handleToggleCompare}
            onStartCompare={handleStartCompare}
            onAddCar={() => setShowAddModal(true)}
            onDeleteCar={handleDeleteCar}
            onStatusChange={handleStatusChange}
          />
        )}

        {view === 'detail' && selectedCar && (
          <CarDetail
            car={selectedCar}
            customFieldDefs={customFieldDefs}
            onUpdate={handleUpdateCar}
            onDelete={(id) => {
              handleDeleteCar(id)
            }}
            onBack={() => setView('list')}
            onOpenCustomFields={() => setShowFieldEditor(true)}
          />
        )}

        {view === 'compare' && (
          <CompareView
            cars={compareCars}
            customFieldDefs={customFieldDefs}
            onBack={() => setView('list')}
            onSelectCar={(id) => {
              setView('detail')
              setSelectedCarId(id)
            }}
          />
        )}
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddCarModal
          onAdd={handleAddCar}
          onClose={() => setShowAddModal(false)}
          customFieldDefs={customFieldDefs}
        />
      )}

      {showFieldEditor && (
        <CustomFieldEditor
          fieldDefs={customFieldDefs}
          onAdd={handleAddFieldDef}
          onDelete={handleDeleteFieldDef}
          onClose={() => setShowFieldEditor(false)}
        />
      )}
    </div>
  )
}
