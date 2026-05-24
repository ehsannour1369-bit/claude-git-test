import { useEffect, useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import client, { getErrorMessage } from '../../api/client'

interface Student {
  id: string
  totalPoints: number
  user: { firstName: string; lastName: string; email: string }
  gradeLevel?: { name: string }
  class?: { name: string }
  avatar?: { imageUrl: string; name: string }
}

export default function ParentChildren() {
  const [children, setChildren] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showLink, setShowLink] = useState(false)
  const [linkEmail, setLinkEmail] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState('')

  const fetchChildren = () => {
    setLoading(true)
    client
      .get('/api/parent/children')
      .then((r) => setChildren(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(fetchChildren, [])

  const linkChild = async (e: FormEvent) => {
    e.preventDefault()
    setLinking(true)
    setLinkError('')
    try {
      await client.post('/api/parent/link-child', { email: linkEmail })
      setShowLink(false)
      setLinkEmail('')
      fetchChildren()
    } catch (e) {
      setLinkError(getErrorMessage(e))
    } finally {
      setLinking(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-64 text-indigo-500 text-xl">⏳ در حال بارگذاری...</div>
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">فرزندان</h2>
        <button onClick={() => setShowLink(!showLink)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          {showLink ? 'انصراف' : '+ افزودن فرزند'}
        </button>
      </div>

      {showLink && (
        <form onSubmit={linkChild} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 space-y-3">
          <h3 className="font-semibold text-gray-700">افزودن فرزند با ایمیل</h3>
          <div className="flex gap-3">
            <input type="email" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} required
              placeholder="ایمیل دانش‌آموز..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button type="submit" disabled={linking}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              {linking ? '...' : 'افزودن'}
            </button>
          </div>
          {linkError && <p className="text-red-500 text-sm">⚠️ {linkError}</p>}
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
                {c.avatar ? '🧑' : '👦'}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{c.user.firstName} {c.user.lastName}</h3>
                <p className="text-sm text-gray-500">{c.gradeLevel?.name ?? '—'}</p>
                {c.class && <p className="text-sm text-gray-400">{c.class.name}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600">
                <span>⭐</span>
                <span className="font-semibold">{c.totalPoints} امتیاز</span>
              </div>
              <Link to={`/parent/report?studentId=${c.id}`}
                className="text-indigo-600 text-sm hover:underline font-medium">
                مشاهده گزارش ←
              </Link>
            </div>
          </div>
        ))}
        {children.length === 0 && (
          <p className="col-span-2 text-center text-gray-400 py-10">فرزندی ثبت نشده است</p>
        )}
      </div>
    </div>
  )
}
