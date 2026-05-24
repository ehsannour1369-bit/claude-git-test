import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client, { getErrorMessage } from '../../api/client'
import CoinBadge from '../../components/student/CoinBadge'
import CircularProgress from '../../components/student/CircularProgress'

const BOOK_COLORS = ['#7C3AED', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#EC4899']
const BOOK_EMOJIS = ['📚', '🔬', '🌍', '🎨', '📐', '🌿', '🏛️', '🎵']

const ANIMATIONS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.06); }
  }
`

interface Subject {
  id: string
  name: string
  total: number
  submitted: number
}

interface StudentProfile {
  id: string
  totalPoints: number
  user: { firstName: string; lastName: string }
  gradeLevel?: { name: string }
  class?: { name: string }
}

interface Assignment {
  id: string
  subject: { id: string; name: string }
  submissions: { id: string }[]
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      client.get('/api/student/me'),
      client.get('/api/student/assignments'),
    ])
      .then(([pRes, aRes]) => {
        setProfile(pRes.data.data)
        const assignments: Assignment[] = aRes.data.data
        const map = new Map<string, Subject>()
        assignments.forEach((a) => {
          const s = a.subject
          if (!map.has(s.id)) map.set(s.id, { id: s.id, name: s.name, total: 0, submitted: 0 })
          const entry = map.get(s.id)!
          entry.total++
          if (a.submissions.length > 0) entry.submitted++
        })
        setSubjects(Array.from(map.values()))
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320, fontFamily: "'Nunito', 'Segoe UI', sans-serif", color: '#7C3AED', fontSize: 20 }}>
        ⏳ در حال بارگذاری...
      </div>
    )
  }
  if (error) {
    return (
      <div style={{ background: '#FEF2F2', color: '#DC2626', padding: 16, borderRadius: 12, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
        ⚠️ {error}
      </div>
    )
  }

  const totalAssignments = subjects.reduce((s, x) => s + x.total, 0)
  const totalSubmitted = subjects.reduce((s, x) => s + x.submitted, 0)
  const overallProgress = totalAssignments > 0 ? Math.round((totalSubmitted / totalAssignments) * 100) : 0

  return (
    <div style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif", maxWidth: 900, margin: '0 auto' }}>
      <style>{ANIMATIONS}</style>

      {/* Hero header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3D1A6E 0%, #5B2D8E 50%, #7C3AED 100%)',
          borderRadius: 24,
          padding: '36px 40px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 12px 40px rgba(61, 26, 110, 0.45)',
          animation: 'fadeInUp 0.5s ease both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 52,
              backdropFilter: 'blur(8px)',
              border: '3px solid rgba(255,255,255,0.3)',
              animation: 'pulse 3s ease-in-out infinite',
            }}
          >
            🎓
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4 }}>خوش آمدی،</div>
            <div style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
              {profile?.user.firstName} {profile?.user.lastName}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              {profile?.gradeLevel?.name ?? ''} {profile?.class ? `— ${profile.class.name}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
          <CoinBadge points={profile?.totalPoints ?? 0} size="lg" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CircularProgress value={overallProgress} size={64} color="#FDE68A" strokeWidth={6} />
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{overallProgress}٪</div>
              پیشرفت کلی
            </div>
          </div>
        </div>
      </div>

      {/* Books grid */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#3D1A6E', margin: '0 0 20px' }}>📖 دروس من</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {subjects.map((subj, i) => {
            const color = BOOK_COLORS[i % BOOK_COLORS.length]
            const emoji = BOOK_EMOJIS[i % BOOK_EMOJIS.length]
            const pct = subj.total > 0 ? Math.round((subj.submitted / subj.total) * 100) : 0
            return (
              <div
                key={subj.id}
                onClick={() => navigate(`/student/books?subjectId=${subj.id}`)}
                style={{
                  background: `linear-gradient(135deg, ${color}dd, ${color})`,
                  borderRadius: 20,
                  padding: '24px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  boxShadow: `0 8px 24px ${color}55`,
                  animation: `fadeInUp 0.5s ease ${i * 0.08}s both`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                  e.currentTarget.style.boxShadow = `0 14px 32px ${color}66`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = `0 8px 24px ${color}55`
                }}
              >
                <div style={{ fontSize: 40 }}>{emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {subj.name}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                    {subj.submitted}/{subj.total} تکلیف
                  </div>
                </div>
                <CircularProgress value={pct} size={56} color="#fff" strokeWidth={5} />
              </div>
            )
          })}
          {subjects.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9CA3AF', padding: 48, fontSize: 15 }}>
              درسی یافت نشد
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
