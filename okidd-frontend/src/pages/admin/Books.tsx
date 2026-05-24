import { useEffect, useState, FormEvent } from 'react'
import client, { getErrorMessage } from '../../api/client'

interface Book {
  id: string
  title: string
  subject?: string
  price?: number
  createdAt?: string
}

export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', subjectId: '', price: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchBooks = () => {
    setLoading(true)
    client
      .get('/api/admin/books')
      .then((r) => setBooks(r.data.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(fetchBooks, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await client.post('/api/admin/books', {
        title: form.title,
        subjectId: form.subjectId || undefined,
        price: form.price ? Number(form.price) : undefined,
      })
      setShowForm(false)
      setForm({ title: '', subjectId: '', price: '' })
      fetchBooks()
    } catch (e) {
      setFormError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">کتاب‌ها</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'انصراف' : '+ کتاب جدید'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-700">افزودن کتاب جدید</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">عنوان کتاب</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">شناسه درس</label>
              <input
                type="text"
                value={form.subjectId}
                onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">قیمت (تومان)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {formError && <p className="text-red-500 text-sm">⚠️ {formError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40 text-indigo-500">⏳ در حال بارگذاری...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="font-semibold text-gray-800">{b.title}</h3>
              {b.price !== undefined && <p className="text-sm text-gray-500 mt-1">{b.price.toLocaleString('fa-IR')} تومان</p>}
            </div>
          ))}
          {books.length === 0 && (
            <p className="col-span-3 text-center text-gray-400 py-10">کتابی ثبت نشده است</p>
          )}
        </div>
      )}
    </div>
  )
}
