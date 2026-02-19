export type CarStatus =
  | 'interested'
  | 'contacted'
  | 'test_drive_scheduled'
  | 'test_drive_done'
  | 'negotiating'
  | 'rejected'
  | 'purchased'

export type CustomFieldType = 'text' | 'number' | 'rating' | 'boolean' | 'date'

export interface CustomFieldDefinition {
  id: string
  label: string
  type: CustomFieldType
  order: number
}

export interface CustomFieldValue {
  fieldId: string
  value: string | number | boolean | null
}

export interface CarNote {
  id: string
  text: string
  createdAt: string
}

export interface Car {
  id: string
  url: string
  source: 'yad2' | 'winwin' | 'facebook' | 'other'
  addedAt: string
  updatedAt: string

  // Core fields
  title: string
  make: string
  model: string
  year: number | null
  price: number | null
  km: number | null
  hand: number | null
  color: string
  city: string
  engineSize: string
  fuelType: string
  gearType: string
  imageUrl: string

  // Status
  status: CarStatus

  // User content
  notes: CarNote[]
  customFields: CustomFieldValue[]

  // Fetch metadata
  fetchStatus: 'pending' | 'success' | 'failed' | 'manual'
  fetchError?: string
}
