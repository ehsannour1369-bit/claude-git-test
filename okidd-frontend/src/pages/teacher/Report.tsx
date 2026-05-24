import { useEffect, useState } from 'react'
import client, { getErrorMessage } from '../../api/client'

interface Student {
  id: string
  user: { firstName: string; lastName: string }
  totalPoints: number
  gradeLevel?: { name: string }
}

export default function TeacherReport() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/api/teacher/students')
      .then((r) => setStudents(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  const atRisk = students.filter((s) => s.totalPoints < 50)
  const avgPoints = students.length
    ? Math.round(students.reduce((a, s) => a + s.totalPoints, 0) / students.length)
    : 0

  if (loading) return <div className="flex justify-center items-center h-64 text-indigo-500 text-xl">⏳ در حال بارگذاری...</div>
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">گزارش کلاس</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-indigo-500 text-white rounded-xl p-5 shadow-md">
          <div className="text-3xl mb-1">👥</div>
          <div className="text-2xl font-bold">{students.length}</div>
          <div className="text-sm opacity-90">کل دانش‌آموزان</div>
        </div>
        <div className="bg-amber-500 text-white rounded-xl p-5 shadow-md">
          <div className="text-3xl mb-1">⭐</div>
          <div className="text-2xl font-bold">{avgPoints}</div>
          <div className="text-sm opacity-90">میانگین امتیاز</div>
        </div>
        <div className="bg-rose-500 text-white rounded-xl p-5 shadow-md">
          <div className="text-3xl mb-1">⚠️</div>
          <div className="text-2xl font-bold">{atRisk.length}</div>
          <div className="text-sm opacity-90">در معرض خطر (امتیاز &lt; ۵۰)</div>
        </div>
      </div>

      {atRisk.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-red-700 mb-3">⚠️ دانش‌آموزان در معرض خطر</h3>
          <div className="space-y-2">
            {atRisk.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-red-100">
                <span className="font-medium text-gray-800">{s.user.firstName} {s.user.lastName}</span>
                <span className="text-red-600 text-sm font-medium">{s.totalPoints} امتیاز</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="font-semibold text-gray-700 mb-3">همه دانش‌آموزان</h3>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">نام</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">پایه</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">امتیاز</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.user.firstName} {s.user.lastName}</td>
                <td className="px-4 py-3 text-gray-500">{s.gradeLevel?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${s.totalPoints < 50 ? 'text-red-600' : 'text-green-600'}`}>
                    {s.totalPoints}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <p className="text-center text-gray-400 py-10">دانش‌آموزی یافت نشد</p>}
      </div>
    </div>
  )
}
