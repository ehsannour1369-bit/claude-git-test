import { useEffect, useState } from 'react'
import client, { getErrorMessage } from '../../api/client'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: string
}

const roleLabel: Record<string, string> = {
  ADMIN: 'ادمین',
  SCHOOL: 'مدرسه',
  TEACHER: 'معلم',
  PARENT: 'والدین',
  STUDENT: 'دانش‌آموز',
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchUsers = () => {
    setLoading(true)
    client
      .get('/api/admin/users')
      .then((r) => setUsers(r.data.data.users))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(fetchUsers, [])

  const toggle = async (id: string) => {
    setToggling(id)
    try {
      await client.patch(`/api/admin/users/${id}/toggle`)
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)))
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setToggling(null)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-64 text-indigo-500 text-xl">⏳ در حال بارگذاری...</div>
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">مدیریت کاربران</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">نام</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">ایمیل</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">نقش</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">وضعیت</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-gray-500 ltr">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
                    {roleLabel[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggle(u.id)}
                    disabled={toggling === u.id}
                    className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                      u.isActive
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {toggling === u.id ? '...' : u.isActive ? 'تعلیق' : 'فعال‌سازی'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="text-center text-gray-400 py-10">کاربری یافت نشد</p>
        )}
      </div>
    </div>
  )
}
