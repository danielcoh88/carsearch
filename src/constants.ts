import { CarStatus, CustomFieldType } from './types'

export const STATUS_LABELS: Record<CarStatus, string> = {
  interested: 'מעוניין',
  contacted: 'יצרתי קשר',
  test_drive_scheduled: 'נסיעת מבחן מתוזמנת',
  test_drive_done: 'נסיעת מבחן בוצעה',
  negotiating: 'במשא ומתן',
  rejected: 'נדחה',
  purchased: 'נרכש',
}

export const STATUS_COLORS: Record<CarStatus, string> = {
  interested: 'bg-blue-100 text-blue-800 border-blue-200',
  contacted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  test_drive_scheduled: 'bg-orange-100 text-orange-800 border-orange-200',
  test_drive_done: 'bg-purple-100 text-purple-800 border-purple-200',
  negotiating: 'bg-amber-100 text-amber-800 border-amber-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  purchased: 'bg-green-100 text-green-800 border-green-200',
}

export const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'טקסט',
  number: 'מספר',
  rating: 'דירוג (1-5)',
  boolean: 'כן/לא',
  date: 'תאריך',
}

export const SOURCE_LABELS: Record<string, string> = {
  yad2: 'יד 2',
  winwin: 'WIN WIN',
  facebook: 'פייסבוק מרקטפלייס',
  other: 'אחר',
}

export const ALL_STATUSES: CarStatus[] = [
  'interested',
  'contacted',
  'test_drive_scheduled',
  'test_drive_done',
  'negotiating',
  'rejected',
  'purchased',
]
