import { Car, CarImage, CustomFieldDefinition } from './types'

// Migrate old car records that don't have images[]
function migrateCar(car: Car): Car {
  if (!car.images) {
    const images: CarImage[] = []
    if (car.imageUrl) {
      images.push({ id: crypto.randomUUID(), url: car.imageUrl, isPrimary: true })
    }
    return { ...car, images }
  }
  // Ensure imageUrl stays in sync with primary
  const primary = car.images.find((i) => i.isPrimary) || car.images[0]
  return { ...car, imageUrl: primary?.url ?? '' }
}

const CARS_KEY = 'cars_v1'
const FIELDS_KEY = 'custom_fields_v1'

export function generateId(): string {
  return crypto.randomUUID()
}

// ─── Cars ────────────────────────────────────────────────────────────────────

export function getCars(): Car[] {
  try {
    const raw = localStorage.getItem(CARS_KEY)
    const cars: Car[] = raw ? (JSON.parse(raw) as Car[]) : []
    return cars.map(migrateCar)
  } catch {
    return []
  }
}

export function saveCar(car: Car): void {
  const cars = getCars()
  const idx = cars.findIndex((c) => c.id === car.id)
  if (idx >= 0) {
    cars[idx] = car
  } else {
    cars.unshift(car)
  }
  try {
    localStorage.setItem(CARS_KEY, JSON.stringify(cars))
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      throw new Error('אחסון מקומי מלא. מחק רכבים ישנים.')
    }
    throw e
  }
}

export function deleteCar(id: string): void {
  const cars = getCars().filter((c) => c.id !== id)
  localStorage.setItem(CARS_KEY, JSON.stringify(cars))
}

export function getCarById(id: string): Car | undefined {
  return getCars().find((c) => c.id === id)
}

// ─── Custom Field Definitions ─────────────────────────────────────────────────

export function getCustomFieldDefs(): CustomFieldDefinition[] {
  try {
    const raw = localStorage.getItem(FIELDS_KEY)
    return raw ? (JSON.parse(raw) as CustomFieldDefinition[]) : []
  } catch {
    return []
  }
}

export function saveCustomFieldDef(def: CustomFieldDefinition): void {
  const defs = getCustomFieldDefs()
  const idx = defs.findIndex((d) => d.id === def.id)
  if (idx >= 0) {
    defs[idx] = def
  } else {
    defs.push(def)
  }
  localStorage.setItem(FIELDS_KEY, JSON.stringify(defs))
}

export function deleteCustomFieldDef(id: string): void {
  // Remove definition
  const defs = getCustomFieldDefs().filter((d) => d.id !== id)
  localStorage.setItem(FIELDS_KEY, JSON.stringify(defs))

  // Strip orphaned values from all cars
  const cars = getCars().map((car) => ({
    ...car,
    customFields: car.customFields.filter((cf) => cf.fieldId !== id),
  }))
  localStorage.setItem(CARS_KEY, JSON.stringify(cars))
}

// ─── Import / Export ──────────────────────────────────────────────────────────

export function exportData(): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      cars: getCars(),
      customFieldDefs: getCustomFieldDefs(),
    },
    null,
    2
  )
}

export function importData(json: string): void {
  const data = JSON.parse(json)
  if (data.cars) localStorage.setItem(CARS_KEY, JSON.stringify(data.cars))
  if (data.customFieldDefs)
    localStorage.setItem(FIELDS_KEY, JSON.stringify(data.customFieldDefs))
}
