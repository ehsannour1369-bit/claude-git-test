import { useEffect, useState } from 'react'
import client, { getErrorMessage } from '../../api/client'

interface Subject { id: string; name: string; gradeLevel: { name: string } }
interface Teacher { user: { firstName: string; lastName: string }; school: { name: string }; subjects: Subject[] }

export default function TeacherClasses() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/api/teacher/me')
      .then((r) => setTeacher(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center items-center h-64 text-indigo-500 text-xl">⏳ در حال بارگذاری...</div>
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-3xl">👨‍🏫</div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {teacher?.user.firstName} {teacher?.user.lastName}
            </h2>
            <p className="text-gray-500 text-sm">{teacher?.school.name}</p>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-4">دروس تدریسی</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teacher?.subjects.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">📖</div>
            <h4 className="font-semibold text-gray-800">{s.name}</h4>
            <p className="text-sm text-gray-500 mt-1">{s.gradeLevel.name}</p>
          </div>
        ))}
        {(!teacher?.subjects || teacher.subjects.length === 0) && (
          <p className="col-span-3 text-center text-gray-400 py-10">درسی اختصاص داده نشده است</p>
        )}
      </div>
    </div>
  )
}
