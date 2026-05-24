import { useEffect, useState } from 'react'
import client, { getErrorMessage } from '../../api/client'

interface Grant { id: string; bookTitle?: string; quantity?: number; usedSeats?: number }

export default function SchoolGrants() {
  const [grants, setGrants] = useState<Grant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/api/school/grants')
      .then((r) => setGrants(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center items-center h-64 text-indigo-500 text-xl">⏳ در حال بارگذاری...</div>
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">دسترسی‌های کتاب</h2>
      <div className="space-y-3">
        {grants.map((g) => (
          <div key={g.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎫</span>
              <div>
                <p className="font-semibold text-gray-800">{g.bookTitle ?? 'کتاب'}</p>
                <p className="text-sm text-gray-500">
                  {g.usedSeats ?? 0} از {g.quantity ?? 0} صندلی استفاده شده
                </p>
              </div>
            </div>
            {g.quantity !== undefined && g.usedSeats !== undefined && (
              <div className="w-32">
                <div className="bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 rounded-full h-2 transition-all"
                    style={{ width: `${Math.min((g.usedSeats / g.quantity) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  {Math.round((g.usedSeats / g.quantity) * 100)}٪
                </p>
              </div>
            )}
          </div>
        ))}
        {grants.length === 0 && <p className="text-center text-gray-400 py-10">دسترسی کتابی اعطا نشده است</p>}
      </div>
    </div>
  )
}
