import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import client, { getErrorMessage } from '../../api/client'

const BOOK_COLORS = ['#7C3AED', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#EC4899']

const ANIMATIONS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }
  @keyframes ripple {
    from { transform: scale(0.95); opacity: 0.7; }
    to   { transform: scale(1); opacity: 1; }
  }
`

interface Assignment {
  id: string
  title: string
  description: string | null
  maxPoints: number
  dueDate: string | null
  subject: { id: string; name: string }
  submissions: { id: string; content: string | null; score: number | null; feedback: string | null }[]
}

export default function StudentLessons() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const subjectId = searchParams.get('subjectId')
  const focusId = searchParams.get('assignmentId')

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(focusId)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [watchingId, setWatchingId] = useState<string | null>(null)

  const fetchData = () => {
    client
      .get('/api/student/assignments')
      .then((r) => {
        const all: Assignment[] = r.data.data
        setAssignments(subjectId ? all.filter((a) => a.subject.id === subjectId) : all)
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(fetchData, [subjectId])

  const handleSubmit = async (assignmentId: string) => {
    if (!content.trim()) return
    setSubmitting(assignmentId)
    setSubmitError('')
    try {
      await client.post(`/api/student/assignments/${assignmentId}/submit`, { content })
      setContent('')
      setExpanded(null)
      fetchData()
    } catch (e) {
      setSubmitError(getErrorMessage(e))
    } finally {
      setSubmitting(null)
    }
  }

  const handleVideoComplete = async (lessonId: string) => {
    setWatchingId(lessonId)
    try {
      await client.post(`/api/student/lessons/${lessonId}/video-complete`)
    } catch {
      // endpoint may not exist yet — fail silently
    } finally {
      setTimeout(() => setWatchingId(null), 800)
    }
  }

  const subjectName = assignments[0]?.subject.name ?? 'تکالیف'
  const colorIndex = subjectId ? Math.abs([...subjectId].reduce((a, c) => a + c.charCodeAt(0), 0)) % BOOK_COLORS.length : 0
  const themeColor = BOOK_COLORS[colorIndex]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320, fontFamily: "'Nunito','Segoe UI',sans-serif", color: '#7C3AED', fontSize: 20 }}>
        ⏳ در حال بارگذاری...
      </div>
    )
  }
  if (error) {
    return (
      <div style={{ background: '#FEF2F2', color: '#DC2626', padding: 16, borderRadius: 12, fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
        ⚠️ {error}
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif", maxWidth: 760, margin: '0 auto' }}>
      <style>{ANIMATIONS}</style>

      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, #3D1A6E, ${themeColor})`,
          borderRadius: 20,
          padding: '24px 28px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: `0 8px 28px ${themeColor}44`,
          animation: 'fadeInUp 0.4s ease both',
        }}
      >
        <button
          onClick={() => navigate('/student/books')}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            cursor: 'pointer',
            color: '#fff',
            fontSize: 14,
            fontFamily: 'inherit',
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
          }}
        >
          ←
        </button>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>درس</div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{subjectName}</div>
        </div>
        <div style={{ marginRight: 'auto', background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '6px 14px', color: '#fff', fontSize: 14, fontWeight: 700 }}>
          {assignments.filter((a) => a.submissions.length > 0).length}/{assignments.length} تکلیف
        </div>
      </div>

      {/* Lessons list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {assignments.map((a, i) => {
          const done = a.submissions.length > 0
          const sub = a.submissions[0]
          const isOpen = expanded === a.id
          const cardColor = BOOK_COLORS[(colorIndex + i) % BOOK_COLORS.length]

          return (
            <div
              key={a.id}
              style={{
                background: '#fff',
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: '0 3px 16px rgba(0,0,0,0.08)',
                border: `2px solid ${isOpen ? cardColor : 'transparent'}`,
                animation: `fadeInUp 0.4s ease ${i * 0.07}s both`,
                transition: 'border-color 0.2s ease',
              }}
            >
              {/* Card header row */}
              <div
                onClick={() => setExpanded(isOpen ? null : a.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '18px 22px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {/* Lesson number badge */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: done ? '#D1FAE5' : `${cardColor}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {done ? '✅' : `${i + 1}`}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#111827', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    حداکثر نمره: {a.maxPoints}
                    {a.dueDate && ` · موعد: ${new Date(a.dueDate).toLocaleDateString('fa-IR')}`}
                  </div>
                </div>

                {/* Score badge */}
                {sub?.score !== null && sub?.score !== undefined && (
                  <div
                    style={{
                      background: sub.score >= 60 ? '#D1FAE5' : '#FEE2E2',
                      color: sub.score >= 60 ? '#065F46' : '#991B1B',
                      fontWeight: 800,
                      fontSize: 14,
                      padding: '4px 12px',
                      borderRadius: 20,
                      flexShrink: 0,
                    }}
                  >
                    {sub.score}/{a.maxPoints}
                  </div>
                )}

                {/* Status badge */}
                <div
                  style={{
                    background: done ? '#D1FAE5' : `${cardColor}18`,
                    color: done ? '#065F46' : cardColor,
                    fontWeight: 700,
                    fontSize: 12,
                    padding: '4px 12px',
                    borderRadius: 20,
                    flexShrink: 0,
                  }}
                >
                  {done ? 'تحویل داده شده' : 'در انتظار'}
                </div>

                <div style={{ color: '#9CA3AF', fontSize: 18, flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                  ▾
                </div>
              </div>

              {/* Expanded panel */}
              {isOpen && (
                <div style={{ borderTop: `2px solid ${cardColor}22`, padding: '20px 22px', background: '#FAFAFA' }}>
                  {/* Watch video button */}
                  <button
                    onClick={() => handleVideoComplete(a.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: `linear-gradient(135deg, #3D1A6E, ${themeColor})`,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 14,
                      padding: '12px 22px',
                      fontSize: 14,
                      fontWeight: 800,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      marginBottom: 20,
                      animation: watchingId === a.id ? 'shake 0.4s ease' : undefined,
                      boxShadow: `0 6px 18px ${themeColor}44`,
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {watchingId === a.id ? '⏳' : '▶️'} تماشای ویدیو
                  </button>

                  {a.description && (
                    <p style={{ color: '#4B5563', fontSize: 14, lineHeight: 1.8, marginBottom: 20, background: '#fff', padding: '12px 16px', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                      {a.description}
                    </p>
                  )}

                  {done ? (
                    <div style={{ background: '#ECFDF5', border: '2px solid #A7F3D0', borderRadius: 14, padding: 16 }}>
                      <div style={{ fontWeight: 800, color: '#065F46', marginBottom: 8 }}>✅ تکلیف تحویل داده شده</div>
                      {sub?.content && (
                        <p style={{ color: '#374151', fontSize: 13, background: '#fff', padding: '10px 14px', borderRadius: 10, marginBottom: 10 }}>
                          {sub.content}
                        </p>
                      )}
                      {sub?.feedback && (
                        <div>
                          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>بازخورد معلم:</div>
                          <p style={{ color: '#374151', fontSize: 13, background: '#fff', padding: '10px 14px', borderRadius: 10 }}>{sub.feedback}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 10 }}>📝 ارسال پاسخ</div>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                        placeholder="پاسخ خود را اینجا بنویسید..."
                        style={{
                          width: '100%',
                          border: `2px solid ${cardColor}44`,
                          borderRadius: 12,
                          padding: '12px 14px',
                          fontSize: 14,
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          outline: 'none',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = cardColor)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = `${cardColor}44`)}
                      />
                      {submitError && <p style={{ color: '#DC2626', fontSize: 13, margin: '8px 0 0' }}>⚠️ {submitError}</p>}
                      <button
                        onClick={() => handleSubmit(a.id)}
                        disabled={submitting === a.id || !content.trim()}
                        style={{
                          marginTop: 12,
                          background: submitting === a.id || !content.trim()
                            ? '#E5E7EB'
                            : `linear-gradient(135deg, ${cardColor}, ${cardColor}cc)`,
                          color: submitting === a.id || !content.trim() ? '#9CA3AF' : '#fff',
                          border: 'none',
                          borderRadius: 12,
                          padding: '12px 28px',
                          fontSize: 14,
                          fontWeight: 800,
                          fontFamily: 'inherit',
                          cursor: submitting === a.id || !content.trim() ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: submitting === a.id || !content.trim() ? 'none' : `0 6px 16px ${cardColor}44`,
                        }}
                      >
                        {submitting === a.id ? 'در حال ارسال...' : '📤 ارسال تکلیف'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {assignments.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 56, fontSize: 15 }}>
            تکلیفی یافت نشد
          </div>
        )}
      </div>
    </div>
  )
}
