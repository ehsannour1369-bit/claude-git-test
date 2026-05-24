import { useEffect, useState, FormEvent } from 'react'
import client, { getErrorMessage } from '../../api/client'

interface GradeLevel { id: string; name: string }
interface Class {
  id: string
  name: string
  academicYear: string
  gradeLevel: { name: string }
  _count: { students: number }
}

export default function SchoolClasses() {
  const [classes, setClasses] = useState<Class[]>([])
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', gradeLevelId: '', academicYear: '1403-1404' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchClasses = () => {
    setLoading(true)
    client
      .get('/api/school/classes')
      .then((r) => setClasses(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchClasses()
    client.get('/api/grade-levels').then((r) => setGradeLevels(r.data.data)).catch(() => {})
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await client.post('/api/school/classes', form)
      setShowForm(false)
      setForm({ name: '', gradeLevelId: '', academicYear: '1403-1404' })
      fetchClasses()
    } catch (e) {
      setFormError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">کلاس‌ها</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          {showForm ? 'انصراف' : '+ کلاس جدید'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-700">افزودن کلاس جدید</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">نام کلاس</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">پایه تحصیلی</label>
              <select value={form.gradeLevelId} onChange={(e) => setForm((f) => ({ ...f, gradeLevelId: e.target.value }))} required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">انتخاب پایه...</option>
                {gradeLevels.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">سال تحصیلی</label>
              <input type="text" value={form.academicYear} onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))} required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {formError && <p className="text-red-500 text-sm">⚠️ {formError}</p>}
          <button type="submit" disabled={saving}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-indigo-500">⏳ در حال بارگذاری...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🏫</div>
              <h3 className="font-semibold text-gray-800">{c.name}</h3>
              <p className="text-sm text-gray-500">{c.gradeLevel.name}</p>
              <p className="text-sm text-gray-400">{c.academicYear}</p>
              <div className="mt-3 flex items-center gap-1 text-sm text-indigo-600">
                <span>👥</span>
                <span>{c._count.students} دانش‌آموز</span>
              </div>
            </div>
          ))}
          {classes.length === 0 && <p className="col-span-3 text-center text-gray-400 py-10">کلاسی ثبت نشده است</p>}
        </div>
      )}
    </div>
  )
}
