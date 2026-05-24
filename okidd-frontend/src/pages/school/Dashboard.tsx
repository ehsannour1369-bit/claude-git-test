import { useEffect, useState } from 'react'
import client, { getErrorMessage } from '../../api/client'

interface Stats { teachers: number; students: number; classes: number }

export default function SchoolDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/api/school/stats')
      .then((r) => setStats(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center items-center h-64 text-indigo-500 text-xl">⏳ در حال بارگذاری...</div>
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">داشبورد مدرسه</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-indigo-500 text-white rounded-xl p-6 shadow-md">
          <div className="text-4xl mb-2">👨‍🏫</div>
          <div className="text-3xl font-bold">{stats?.teachers ?? 0}</div>
          <div className="text-sm opacity-90 mt-1">معلمان</div>
        </div>
        <div className="bg-amber-500 text-white rounded-xl p-6 shadow-md">
          <div className="text-4xl mb-2">🎒</div>
          <div className="text-3xl font-bold">{stats?.students ?? 0}</div>
          <div className="text-sm opacity-90 mt-1">دانش‌آموزان</div>
        </div>
        <div className="bg-emerald-500 text-white rounded-xl p-6 shadow-md">
          <div className="text-4xl mb-2">🏫</div>
          <div className="text-3xl font-bold">{stats?.classes ?? 0}</div>
          <div className="text-sm opacity-90 mt-1">کلاس‌ها</div>
        </div>
      </div>
    </div>
  )
}
