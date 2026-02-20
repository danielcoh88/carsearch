import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import { Car, CustomFieldDefinition } from './types'

const ROOM_KEY = 'sync_room_code'

// ─── Room code management ───────────────────────────────────────────────────

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function getRoomCode(): string | null {
  return localStorage.getItem(ROOM_KEY)
}

export function setRoomCode(code: string): void {
  localStorage.setItem(ROOM_KEY, code.toUpperCase().trim())
}

export function clearRoomCode(): void {
  localStorage.removeItem(ROOM_KEY)
}

export function isSyncEnabled(): boolean {
  return isFirebaseConfigured && Boolean(getRoomCode())
}

// ─── Push local data to cloud ───────────────────────────────────────────────

export async function pushAllToCloud(
  cars: Car[],
  fieldDefs: CustomFieldDefinition[]
): Promise<void> {
  if (!db) return
  const roomCode = getRoomCode()
  if (!roomCode) return

  const batch = writeBatch(db)

  for (const car of cars) {
    batch.set(doc(db, 'rooms', roomCode, 'cars', car.id), JSON.parse(JSON.stringify(car)))
  }
  for (const def of fieldDefs) {
    batch.set(doc(db, 'rooms', roomCode, 'customFields', def.id), JSON.parse(JSON.stringify(def)))
  }

  await batch.commit()
}

// ─── Single-item sync ───────────────────────────────────────────────────────

export async function syncCar(car: Car): Promise<void> {
  if (!db) return
  const roomCode = getRoomCode()
  if (!roomCode) return
  await setDoc(doc(db, 'rooms', roomCode, 'cars', car.id), JSON.parse(JSON.stringify(car)))
}

export async function syncDeleteCar(carId: string): Promise<void> {
  if (!db) return
  const roomCode = getRoomCode()
  if (!roomCode) return
  await deleteDoc(doc(db, 'rooms', roomCode, 'cars', carId))
}

export async function syncFieldDef(def: CustomFieldDefinition): Promise<void> {
  if (!db) return
  const roomCode = getRoomCode()
  if (!roomCode) return
  await setDoc(
    doc(db, 'rooms', roomCode, 'customFields', def.id),
    JSON.parse(JSON.stringify(def))
  )
}

export async function syncDeleteFieldDef(fieldId: string): Promise<void> {
  if (!db) return
  const roomCode = getRoomCode()
  if (!roomCode) return
  await deleteDoc(doc(db, 'rooms', roomCode, 'customFields', fieldId))
}

// ─── Real-time listener ─────────────────────────────────────────────────────

export function subscribeToRoom(
  roomCode: string,
  onCarsChange: (cars: Car[]) => void,
  onFieldsChange: (fields: CustomFieldDefinition[]) => void
): () => void {
  if (!db) return () => {}

  const unsubCars = onSnapshot(
    collection(db, 'rooms', roomCode, 'cars'),
    (snapshot) => {
      const cars: Car[] = []
      snapshot.forEach((d) => cars.push(d.data() as Car))
      cars.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      onCarsChange(cars)
    }
  )

  const unsubFields = onSnapshot(
    collection(db, 'rooms', roomCode, 'customFields'),
    (snapshot) => {
      const fields: CustomFieldDefinition[] = []
      snapshot.forEach((d) => fields.push(d.data() as CustomFieldDefinition))
      fields.sort((a, b) => a.order - b.order)
      onFieldsChange(fields)
    }
  )

  return () => {
    unsubCars()
    unsubFields()
  }
}

// ─── Check if a room has data ───────────────────────────────────────────────

export async function roomHasData(roomCode: string): Promise<boolean> {
  if (!db) return false
  const snap = await getDocs(collection(db, 'rooms', roomCode, 'cars'))
  return !snap.empty
}
