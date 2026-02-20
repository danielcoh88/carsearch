import { useState } from 'react'
import { isFirebaseConfigured } from '../firebase'
import {
  getRoomCode,
  setRoomCode,
  clearRoomCode,
  generateRoomCode,
  roomHasData,
} from '../sync'

interface SyncPanelProps {
  onSyncStart: (roomCode: string, isNew: boolean) => void
  onSyncStop: () => void
  isSyncing: boolean
}

export default function SyncPanel({ onSyncStart, onSyncStop, isSyncing }: SyncPanelProps) {
  const [showPanel, setShowPanel] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const roomCode = getRoomCode()

  if (!isFirebaseConfigured) return null

  const handleCreateRoom = () => {
    const code = generateRoomCode()
    setRoomCode(code)
    onSyncStart(code, true)
    setError('')
  }

  const handleJoinRoom = async () => {
    const code = joinCode.toUpperCase().trim()
    if (code.length < 4) {
      setError('יש להזין קוד תקין')
      return
    }
    setLoading(true)
    setError('')
    try {
      const exists = await roomHasData(code)
      if (!exists) {
        setError('לא נמצאו נתונים עם הקוד הזה. בדוק שהקוד נכון.')
        setLoading(false)
        return
      }
      setRoomCode(code)
      onSyncStart(code, false)
      setJoinCode('')
    } catch {
      setError('שגיאה בחיבור — בדוק את חיבור האינטרנט')
    }
    setLoading(false)
  }

  const handleDisconnect = () => {
    clearRoomCode()
    onSyncStop()
    setError('')
  }

  const handleCopy = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      {/* Sync button in header */}
      <button
        onClick={() => setShowPanel(true)}
        className={`relative p-2 rounded-xl transition-colors ${
          isSyncing
            ? 'text-green-600 hover:bg-green-50'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        title={isSyncing ? `מסונכרן — קוד: ${roomCode}` : 'סנכרון בין מכשירים'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
          />
        </svg>
        {isSyncing && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Panel modal */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPanel(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">סנכרון בין מכשירים</h2>
              <button
                onClick={() => setShowPanel(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {isSyncing && roomCode ? (
                <>
                  {/* Connected state */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-green-700">מסונכרן</span>
                    </div>
                    <p className="text-xs text-green-600 mb-3">הנתונים מסונכרנים בזמן אמת בין כל המכשירים</p>
                    <div className="bg-white border border-green-200 rounded-xl px-4 py-3 flex items-center justify-center gap-3">
                      <span className="font-mono text-2xl font-bold tracking-[0.3em] text-gray-800" dir="ltr">
                        {roomCode}
                      </span>
                      <button
                        onClick={handleCopy}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="העתק קוד"
                      >
                        {copied ? (
                          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">הכנס את הקוד הזה בנייד כדי לראות את הנתונים</p>
                  </div>

                  <button
                    onClick={handleDisconnect}
                    className="w-full border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    נתק סנכרון
                  </button>
                </>
              ) : (
                <>
                  {/* Not connected */}
                  <div className="text-center mb-2">
                    <p className="text-sm text-gray-500">
                      חבר את המכשירים שלך עם קוד משותף כדי לראות את אותם רכבים בכל מקום
                    </p>
                  </div>

                  {/* Create new room */}
                  <button
                    onClick={handleCreateRoom}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    צור קוד סנכרון חדש
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">או</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Join existing room */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      יש לך קוד? הכנס אותו כאן:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="ABCD12"
                        maxLength={6}
                        dir="ltr"
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                      />
                      <button
                        onClick={handleJoinRoom}
                        disabled={loading || joinCode.length < 4}
                        className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          'חבר'
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
