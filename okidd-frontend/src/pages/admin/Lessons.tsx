import { useEffect, useState, FormEvent } from 'react'
import client, { getErrorMessage } from '../../api/client'

interface Book { id: string; title: string }
interface Lesson { id: string; title: string; order?: number; videoUrl?: string }

export default function AdminLessons() {
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', order: '', videoUrl: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    client.get('/api/admin/books').then((r) => setBooks(r.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedBook) return
    setLoading(true)
    client
      .get(`/api/admin/lessons?bookId=${selectedBook}`)
      .then((r) => setLessons(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [selectedBook])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await client.post('/api/admin/lessons', {
        title: form.title,
        bookId: selectedBook,
        order: form.order ? Number(form.order) : undefined,
        videoUrl: form.videoUrl || undefined,
      })
      setShowForm(false)
      setForm({ title: '', order: '', videoUrl: '' })
      client.get(`/api/admin/lessons?bookId=${selectedBook}`).then((r) => setLessons(r.data.data))
    } catch (e) {
      setFormError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">درس‌ها</h2>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">انتخاب کتاب</label>
        <select
          value={selectedBook}
          onChange={(e) => { setSelectedBook(e.target.value); setLessons([]); setError('') }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">-- کتاب را انتخاب کنید --</option>
          {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
      </div>

      {selectedBook && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">درس‌های این کتاب</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
            >
              {showForm ? 'انصراف' : '+ درس جدید'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 p-5 mb-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">عنوان درس</label>
                  <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">ترتیب</label>
                  <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">لینک ویدیو</label>
                  <input type="url" value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
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
            <div className="space-y-2">
              {lessons.map((l) => (
                <div key={l.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <span className="text-2xl">📖</span>
                  <div>
                    <p className="font-medium text-gray-800">{l.title}</p>
                    {l.order && <p className="text-xs text-gray-400">درس {l.order}</p>}
                  </div>
                </div>
              ))}
              {lessons.length === 0 && <p className="text-center text-gray-400 py-8">درسی ثبت نشده است</p>}
            </div>
          )}
        </>
      )}
    </div>
  )
}
