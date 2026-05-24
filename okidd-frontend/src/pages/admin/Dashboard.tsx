import { useEffect, useState } from 'react'
import client, { getErrorMessage } from '../../api/client'

interface Stats {
  schools: number
  teachers: number
  students: number
  parents: number
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className={`rounded-xl p-6 text-white shadow-md ${color}`}>
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-3xl font-bold">{value.toLocaleString('fa-IR')}</div>
      <div className="text-sm opacity-90 mt-1">{label}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/api/admin/stats')
      .then((r) => setStats(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center items-center h-64 text-indigo-500 text-xl">⏳ در حال بارگذاری...</div>
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">داشبورد ادمین</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="مدارس فعال" value={stats?.schools ?? 0} icon="🏫" color="bg-indigo-500" />
        <StatCard label="معلمان" value={stats?.teachers ?? 0} icon="👨‍🏫" color="bg-emerald-500" />
        <StatCard label="دانش‌آموزان" value={stats?.students ?? 0} icon="🎒" color="bg-amber-500" />
        <StatCard label="والدین" value={stats?.parents ?? 0} icon="👨‍👧" color="bg-rose-500" />
      </div>
    </div>
  )
}
