import { useRef, useState } from 'react'
import { CarImage } from '../types'

interface ImageGalleryProps {
  images: CarImage[]
  onChange: (images: CarImage[]) => void
}

function generateId() {
  return crypto.randomUUID()
}

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const MAX = 1400
        const scale = img.width > MAX ? MAX / img.width : 1
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = src
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ImageGallery({ images, onChange }: ImageGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draggingOver, setDraggingOver] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [error, setError] = useState('')

  const primaryImage = images.find((i) => i.isPrimary) || images[0]

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const addImages = (newImages: CarImage[]) => {
    const updated = [...images, ...newImages]
    // If no primary yet, make first one primary
    if (!updated.find((i) => i.isPrimary) && updated.length > 0) {
      updated[0].isPrimary = true
    }
    onChange(updated)
  }

  const setPrimary = (id: string) => {
    onChange(images.map((img) => ({ ...img, isPrimary: img.id === id })))
  }

  const removeImage = (id: string) => {
    const updated = images.filter((i) => i.id !== id)
    // If we removed the primary, promote first remaining
    if (!updated.find((i) => i.isPrimary) && updated.length > 0) {
      updated[0] = { ...updated[0], isPrimary: true }
    }
    onChange(updated)
  }

  // ─── File handling ──────────────────────────────────────────────────────────

  const handleFiles = async (files: FileList) => {
    setError('')
    const toAdd: CarImage[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) { setError('קובץ לא תקין — יש לבחור תמונות בלבד'); continue }
      if (file.size > 8 * 1024 * 1024) { setError(`${file.name} גדול מדי — מקסימום 8MB`); continue }
      try {
        const url = await resizeToDataUrl(file)
        toAdd.push({ id: generateId(), url, isPrimary: false })
      } catch {
        setError(`שגיאה בעיבוד ${file.name}`)
      }
    }
    if (toAdd.length) addImages(toAdd)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDraggingOver(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  // ─── URL handling ────────────────────────────────────────────────────────────

  const handleAddUrl = () => {
    setError('')
    const trimmed = urlInput.trim()
    if (!trimmed.startsWith('http')) { setError('קישור לא תקין'); return }
    addImages([{ id: generateId(), url: trimmed, isPrimary: false }])
    setUrlInput('')
    setShowUrlInput(false)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Primary image display */}
      {primaryImage ? (
        <div
          className="relative w-full h-56 sm:h-72 bg-gray-100 rounded-2xl overflow-hidden mb-3 cursor-zoom-in group"
          onClick={() => setLightbox(primaryImage.url)}
        >
          <img
            src={primaryImage.url}
            alt="תמונה ראשית"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            ראשית
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              className="bg-white/90 text-gray-700 text-xs px-2 py-1 rounded-lg hover:bg-white shadow"
              onClick={() => fileInputRef.current?.click()}
            >
              + הוסף תמונה
            </button>
            <button
              className="bg-white/90 text-gray-700 text-xs px-2 py-1 rounded-lg hover:bg-white shadow"
              onClick={() => setShowUrlInput(true)}
            >
              + קישור
            </button>
          </div>
        </div>
      ) : (
        /* Empty state / drop zone */
        <div
          className={`w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 py-10 mb-3 transition-colors cursor-pointer ${
            draggingOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDraggingOver(true) }}
          onDragLeave={() => setDraggingOver(false)}
          onDrop={handleDrop}
        >
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">גרור תמונות לכאן</p>
            <p className="text-xs text-gray-400">JPG, PNG עד 8MB לתמונה — ניתן לבחור מספר</p>
          </div>
          <div className="flex gap-2 mt-1">
            <span className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full border border-blue-200">בחר קבצים</span>
            <span
              className="bg-gray-50 text-gray-500 text-xs px-3 py-1 rounded-full border border-gray-200 cursor-pointer hover:bg-gray-100"
              onClick={(e) => { e.stopPropagation(); setShowUrlInput(true) }}
            >
              הדבק קישור
            </span>
          </div>
        </div>
      )}

      {/* URL input */}
      {showUrlInput && (
        <div className="flex gap-2 mb-3">
          <input
            autoFocus
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/car.jpg"
            dir="ltr"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddUrl()
              if (e.key === 'Escape') { setShowUrlInput(false); setUrlInput('') }
            }}
          />
          <button onClick={handleAddUrl} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">הוסף</button>
          <button onClick={() => { setShowUrlInput(false); setUrlInput('') }} className="text-gray-400 hover:text-gray-600 px-2">✕</button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {/* Thumbnail strip */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative group w-20 h-16 rounded-xl overflow-hidden cursor-pointer flex-shrink-0 border-2 transition-all ${
                img.isPrimary ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setPrimary(img.id)}
              title={img.isPrimary ? 'תמונה ראשית' : 'לחץ להגדרה כראשית'}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />

              {/* Primary star */}
              {img.isPrimary && (
                <div className="absolute top-0.5 right-0.5 text-yellow-400 text-xs leading-none drop-shadow">★</div>
              )}

              {/* Remove button */}
              <button
                className="absolute top-0.5 left-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs leading-none items-center justify-center hidden group-hover:flex"
                onClick={(e) => { e.stopPropagation(); removeImage(img.id) }}
                title="הסר תמונה"
              >
                ✕
              </button>

              {/* Zoom */}
              <button
                className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-center pb-1 opacity-0 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); setLightbox(img.url) }}
              >
                <span className="text-white text-[10px] bg-black/50 px-1 rounded">הגדל</span>
              </button>
            </div>
          ))}

          {/* Add more button in strip */}
          <button
            className="w-20 h-16 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-colors flex-shrink-0 text-xs gap-0.5"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDraggingOver(true) }}
            onDragLeave={() => setDraggingOver(false)}
            onDrop={handleDrop}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            הוסף
          </button>
        </div>
      )}

      {images.length > 1 && (
        <p className="text-xs text-gray-400 mt-1.5">לחץ על תמונה להגדרתה כראשית · ★ = ראשית</p>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 left-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
