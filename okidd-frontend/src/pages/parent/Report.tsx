import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import client, { getErrorMessage } from '../../api/client'

interface Report {
  studentId: string
  totalPoints: number
  totalAssignments: number
  submitted: number
  submissionRate: number
  avgScore: number | null
  strengths: string[]
  weaknesses: string[]
  subjects: Array<{ subjectName: string; avgScore: number | null; submitted: number; totalAssignments: number }>
}

export default function ParentReport() {
  const [params] = useSearchParams()
  const studentId = params.get('studentId')
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!studentId) { setLoading(false); return }
    client
      .get(`/api/parent/children/${studentId}/progress`)
      .then((r) => setReport(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [studentId])

  if (!studentId) return <div className="bg-amber-50 text-amber-700 p-4 rounded-xl">ابتدا از صفحه فرزندان یک فرزند را انتخاب کنید</div>
  if (loading) return <div className="flex justify-center items-center h-64 text-indigo-500 text-xl">⏳ در حال بارگذاری...</div>
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">گزارش پیشرفت</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-indigo-500 text-white rounded-xl p-5 shadow-md">
          <div className="text-3xl mb-1">⭐</div>
          <div className="text-2xl font-bold">{report?.totalPoints ?? 0}</div>
          <div className="text-sm opacity-90">امتیاز کل</div>
        </div>
        <div className="bg-emerald-500 text-white rounded-xl p-5 shadow-md">
          <div className="text-3xl mb-1">✅</div>
          <div className="text-2xl font-bold">{report?.submissionRate ?? 0}٪</div>
          <div className="text-sm opacity-90">نرخ تکلیف</div>
        </div>
        <div className="bg-amber-500 text-white rounded-xl p-5 shadow-md">
          <div className="text-3xl mb-1">📝</div>
          <div className="text-2xl font-bold">{report?.submitted ?? 0}/{report?.totalAssignments ?? 0}</div>
          <div className="text-sm opacity-90">تکالیف تحویلی</div>
        </div>
        <div className="bg-purple-500 text-white rounded-xl p-5 shadow-md">
          <div className="text-3xl mb-1">📊</div>
          <div className="text-2xl font-bold">{report?.avgScore ?? '—'}</div>
          <div className="text-sm opacity-90">میانگین نمره</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {report?.strengths && report.strengths.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h3 className="font-semibold text-green-700 mb-3">💪 نقاط قوت</h3>
            <div className="space-y-1">
              {report.strengths.map((s) => <span key={s} className="block text-green-600 text-sm">✔ {s}</span>)}
            </div>
          </div>
        )}
        {report?.weaknesses && report.weaknesses.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h3 className="font-semibold text-red-700 mb-3">📉 نقاط ضعف</h3>
            <div className="space-y-1">
              {report.weaknesses.map((w) => <span key={w} className="block text-red-600 text-sm">✖ {w}</span>)}
            </div>
          </div>
        )}
      </div>

      <h3 className="font-semibold text-gray-700 mb-3">عملکرد درسی</h3>
      <div className="space-y-3">
        {report?.subjects.map((s) => (
          <div key={s.subjectName} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{s.subjectName}</p>
              <p className="text-sm text-gray-500">{s.submitted}/{s.totalAssignments} تکلیف تحویلی</p>
            </div>
            <div className="text-left">
              <span className={`text-lg font-bold ${(s.avgScore ?? 0) >= 80 ? 'text-green-600' : (s.avgScore ?? 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                {s.avgScore !== null ? s.avgScore : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
