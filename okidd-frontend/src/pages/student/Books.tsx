import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import client, { getErrorMessage } from '../../api/client'
import CircularProgress from '../../components/student/CircularProgress'

const BOOK_COLORS = ['#7C3AED', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#EC4899']
const BOOK_EMOJIS = ['📚', '🔬', '🌍', '🎨', '📐', '🌿', '🏛️', '🎵']

const ANIMATIONS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

interface Assignment {
  id: string
  title: string
  maxPoints: number
  subject: { id: string; name: string }
  submissions: { id: string; score: number | null }[]
}

interface SubjectGroup {
  id: string
  name: string
  assignments: Assignment[]
}

export default function StudentBooks() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const filterSubjectId = searchParams.get('subjectId')

  const [groups, setGroups] = useState<SubjectGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/api/student/assignments')
      .then((r) => {
        const assignments: Assignment[] = r.data.data
        const map = new Map<string, SubjectGroup>()
        assignments.forEach((a) => {
          const s = a.subject
          if (!map.has(s.id)) map.set(s.id, { id: s.id, name: s.name, assignments: [] })
          map.get(s.id)!.assignments.push(a)
        })
        const all = Array.from(map.values())
        setGroups(filterSubjectId ? all.filter((g) => g.id === filterSubjectId) : all)
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [filterSubjectId])

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
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif", maxWidth: 900, margin: '0 auto' }}>
      <style>{ANIMATIONS}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => navigate('/student')}
          style={{ background: '#F3F4F6', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 14, color: '#6B7280', fontFamily: 'inherit' }}
        >
          ← بازگشت
        </button>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#3D1A6E', margin: 0 }}>📚 کتاب‌های من</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {groups.map((group, i) => {
          const color = BOOK_COLORS[i % BOOK_COLORS.length]
          const emoji = BOOK_EMOJIS[i % BOOK_EMOJIS.length]
          const submitted = group.assignments.filter((a) => a.submissions.length > 0).length
          const total = group.assignments.length
          const pct = total > 0 ? Math.round((submitted / total) * 100) : 0

          return (
            <div
              key={group.id}
              onClick={() => navigate(`/student/lessons?subjectId=${group.id}`)}
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: 24,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: `2px solid ${color}22`,
                animation: `fadeInUp 0.45s ease ${i * 0.1}s both`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = `0 12px 32px ${color}33`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: `${color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 30,
                  }}
                >
                  {emoji}
                </div>
                <CircularProgress value={pct} size={68} color={color} strokeWidth={7} />
              </div>

              {/* Title */}
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#1F2937', marginBottom: 4 }}>
                  {group.name}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  {submitted} از {total} تکلیف تحویل داده شده
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ height: 8, background: '#F3F4F6', borderRadius: 8, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${color}aa, ${color})`,
                      borderRadius: 8,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                مشاهده تکالیف ←
              </div>
            </div>
          )
        })}

        {groups.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9CA3AF', padding: 56, fontSize: 15 }}>
            درسی یافت نشد
          </div>
        )}
      </div>
    </div>
  )
}
