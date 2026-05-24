import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import client, { getErrorMessage } from '../../api/client'

interface Assignment {
  id: string
  title: string
  description: string | null
  maxPoints: number
  dueDate: string | null
  subject: { name: string }
  submissions: Array<{ id: string; content: string | null; score: number | null; feedback: string | null }>
}

export default function StudentLessons() {
  const [params] = useSearchParams()
  const assignmentId = params.get('assignmentId')
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    if (!assignmentId) { setLoading(false); return }
    client
      .get('/api/student/assignments')
      .then((r) => {
        const found = (r.data.data as Assignment[]).find((a) => a.id === assignmentId)
        setAssignment(found ?? null)
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [assignmentId])

  const submit = async () => {
    if (!assignmentId || !content.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await client.post(`/api/student/assignments/${assignmentId}/submit`, { content })
      setSubmitSuccess(true)
      setContent('')
      client.get('/api/student/assignments').then((r) => {
        const found = (r.data.data as Assignment[]).find((a) => a.id === assignmentId)
        setAssignment(found ?? null)
      })
    } catch (e) {
      setSubmitError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (!assignmentId) return <div className="bg-amber-50 text-amber-700 p-4 rounded-xl">تکلیفی انتخاب نشده است</div>
  if (loading) return <div className="flex justify-center items-center h-64 text-indigo-500 text-xl">⏳ در حال بارگذاری...</div>
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>
  if (!assignment) return <div className="bg-amber-50 text-amber-700 p-4 rounded-xl">تکلیف یافت نشد</div>

  const submission = assignment.submissions[0]

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">📝</div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{assignment.title}</h2>
            <p className="text-indigo-600 text-sm mt-1">{assignment.subject.name}</p>
            {assignment.description && (
              <p className="text-gray-600 mt-3 text-sm leading-relaxed">{assignment.description}</p>
            )}
            <div className="flex gap-4 mt-3 text-sm text-gray-500">
              <span>حداکثر نمره: {assignment.maxPoints}</span>
              {assignment.dueDate && <span>موعد: {new Date(assignment.dueDate).toLocaleDateString('fa-IR')}</span>}
            </div>
          </div>
        </div>
      </div>

      {submission ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-700 mb-3">✅ تکلیف تحویل داده شده</h3>
          {submission.content && <p className="text-gray-700 text-sm bg-white rounded-lg p-3 mb-3">{submission.content}</p>}
          {submission.score !== null && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">نمره:</span>
              <span className={`text-lg font-bold ${submission.score >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                {submission.score}/{assignment.maxPoints}
              </span>
            </div>
          )}
          {submission.feedback && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-600 mb-1">بازخورد معلم:</p>
              <p className="text-sm text-gray-700 bg-white rounded-lg p-3">{submission.feedback}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-700 mb-3">ارسال پاسخ</h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="پاسخ خود را اینجا بنویسید..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          {submitError && <p className="text-red-500 text-sm mt-2">⚠️ {submitError}</p>}
          {submitSuccess && <p className="text-green-600 text-sm mt-2">✅ تکلیف با موفقیت ارسال شد!</p>}
          <button
            onClick={submit}
            disabled={submitting || !content.trim()}
            className="mt-3 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'در حال ارسال...' : 'ارسال تکلیف'}
          </button>
        </div>
      )}
    </div>
  )
}
