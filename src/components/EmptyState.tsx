interface EmptyStateProps {
  onAddCar: () => void
}

export default function EmptyState({ onAddCar }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-gray-200 mb-4">
        <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-400 mb-2">אין רכבים עדיין</h2>
      <p className="text-gray-400 text-sm mb-6 max-w-xs">
        הוסף את הרכב הראשון שאתה מתעניין בו — הדבק קישור מיד2 או הכנס פרטים ידנית
      </p>
      <button
        onClick={onAddCar}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        הוסף רכב ראשון
      </button>
    </div>
  )
}
