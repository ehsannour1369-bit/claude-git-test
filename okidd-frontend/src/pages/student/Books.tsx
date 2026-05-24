import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client, { getErrorMessage } from '../../api/client'

interface Assignment {
  id: string
  title: string
  subject: { name: string; gradeLevel: { name: string } }
  submissions: Array<{ id: string; score: number | null }>
  maxPoints: number
}

export default function StudentBooks() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/api/student/assignments')
      .then((r) => setAssignments(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  const submitted = assignments.filter((a) => a.submissions.length > 0).length
  const total = assignments.length
  const progress = total > 0 ? Math.round((submitted / total) * 100) : 0

  if (loading) return <div className="flex justify-center items-center h-64 text-indigo-500 text-xl">⏳ در حال بارگذاری...</div>
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">تکالیف و دروس</h2>

      {total > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">پیشرفت کلی</span>
            <span className="text-sm font-bold text-indigo-600">{progress}٪</span>
          </div>
          <div className="bg-gray-100 rounded-full h-3">
            <div className="bg-indigo-500 rounded-full h-3 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{submitted} از {total} تکلیف تحویل داده شده</p>
        </div>
      )}

      <div className="space-y-3">
        {assignments.map((a) => {
          const done = a.submissions.length > 0
          const score = a.submissions[0]?.score
          return (
            <div key={a.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${done ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {done ? '✅' : '📝'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{a.title}</h3>
                  <p className="text-sm text-gray-500">{a.subject.name} — {a.subject.gradeLevel.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {score !== null && score !== undefined && (
                  <span className={`text-sm font-bold ${score >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                    {score}/{a.maxPoints}
                  </span>
                )}
                <Link to={`/student/lessons?assignmentId=${a.id}`}
                  className="text-indigo-600 text-sm hover:underline font-medium">
                  مشاهده ←
                </Link>
              </div>
            </div>
          )
        })}
        {assignments.length === 0 && (
          <p className="text-center text-gray-400 py-10">تکلیفی یافت نشد</p>
        )}
      </div>
    </div>
  )
}
