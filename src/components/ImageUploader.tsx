import { useRef, useState } from 'react'

interface ImageUploaderProps {
  currentImage?: string
  onImage: (dataUrl: string) => void
  className?: string
}

type InputMode = 'upload' | 'url'

export default function ImageUploader({ currentImage, onImage, className = '' }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<InputMode>('upload')
  const [urlInput, setUrlInput] = useState('')

  const processFile = (file: File) => {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('יש לבחור קובץ תמונה')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('הקובץ גדול מדי — מקסימום 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const MAX = 1200
        const scale = img.width > MAX ? MAX / img.width : 1
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        onImage(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleUrlSave = () => {
    setError('')
    const trimmed = urlInput.trim()
    if (!trimmed) { setError('הכנס קישור לתמונה'); return }
    if (!trimmed.startsWith('http')) { setError('קישור לא תקין'); return }
    onImage(trimmed)
    setUrlInput('')
  }

  const hasImage = currentImage && currentImage.length > 0

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />

      {hasImage ? (
        /* Preview with replace/remove buttons */
        <div className="relative group rounded-xl overflow-hidden bg-gray-100">
          <img
            src={currentImage}
            alt="תמונת רכב"
            className="w-full h-44 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => { setMode('upload'); inputRef.current?.click() }}
              className="bg-white text-gray-800 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100 shadow"
            >
              העלה קובץ
            </button>
            <button
              type="button"
              onClick={() => onImage('')}
              className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-red-600 shadow"
            >
              הסר
            </button>
          </div>
          {/* Small URL badge if remote */}
          {!currentImage.startsWith('data:') && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              קישור חיצוני
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${mode === 'upload' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
              onClick={() => setMode('upload')}
            >
              העלה מהמחשב
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${mode === 'url' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
              onClick={() => setMode('url')}
            >
              הדבק קישור
            </button>
          </div>

          {mode === 'upload' ? (
            /* Drop zone */
            <button
              type="button"
              className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-6 transition-colors ${
                dragging
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-center">
                <p className="text-sm text-gray-500 font-medium">גרור תמונה לכאן</p>
                <p className="text-xs text-gray-400">או לחץ לבחירת קובץ — JPG, PNG עד 5MB</p>
              </div>
            </button>
          ) : (
            /* URL input */
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/car.jpg"
                dir="ltr"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSave()}
              />
              <button
                type="button"
                onClick={handleUrlSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                הוסף
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
