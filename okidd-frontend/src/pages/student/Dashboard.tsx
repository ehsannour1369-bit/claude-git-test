import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client, { getErrorMessage } from '../../api/client'

interface StudentProfile {
  id: string
  totalPoints: number
  user: { firstName: string; lastName: string; email: string }
  gradeLevel?: { name: string }
  class?: { name: string }
  avatar?: { name: string; imageUrl: string }
  gadgets: Array<{ gadget: { name: string; effect: string | null } }>
}

const AVATARS = ['🧒', '👦', '👧', '🧑', '👨‍🎓', '👩‍🎓', '🦸', '🧙']

export default function StudentDashboard() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/api/student/me')
      .then((r) => setProfile(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center items-center h-64 text-indigo-500 text-xl">⏳ در حال بارگذاری...</div>
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>

  const avatarEmoji = AVATARS[profile?.id.charCodeAt(0) ?? 0 % AVATARS.length]

  return (
    <div>
      {/* Profile card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl p-8 mb-6 shadow-lg">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl">
            {avatarEmoji}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile?.user.firstName} {profile?.user.lastName}</h2>
            <p className="opacity-90">{profile?.gradeLevel?.name} {profile?.class ? `— ${profile.class.name}` : ''}</p>
            <div className="flex items-center gap-2 mt-3 bg-white/20 rounded-full px-4 py-1.5 w-fit">
              <span className="text-xl">⭐</span>
              <span className="text-2xl font-bold">{profile?.totalPoints ?? 0}</span>
              <span className="opacity-80 text-sm">امتیاز</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/student/books"
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all hover:border-indigo-200 group">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="font-semibold text-gray-800 group-hover:text-indigo-700">کتاب‌هایم</h3>
          <p className="text-sm text-gray-400 mt-1">مشاهده دروس و پیشرفت</p>
        </Link>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="text-4xl mb-3">🎮</div>
          <h3 className="font-semibold text-gray-800">آیتم‌هایم</h3>
          <p className="text-sm text-gray-400 mt-1">
            {profile?.gadgets.length ?? 0} آیتم خریداری شده
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="text-4xl mb-3">🏆</div>
          <h3 className="font-semibold text-gray-800">رتبه‌بندی</h3>
          <p className="text-sm text-gray-400 mt-1">به زودی...</p>
        </div>
      </div>
    </div>
  )
}
