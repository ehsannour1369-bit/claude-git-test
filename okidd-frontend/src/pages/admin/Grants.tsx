import { useEffect, useState, FormEvent } from 'react'
import client, { getErrorMessage } from '../../api/client'

interface Book { id: string; title: string }
interface School { id: string; name: string; admin: { id: string } }

export default function AdminGrants() {
  const [books, setBooks] = useState<Book[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [form, setForm] = useState({ bookId: '', grantedToId: '', quantity: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    Promise.all([
      client.get('/api/admin/books').then((r) => setBooks(r.data.data)).catch(() => {}),
      client.get('/api/admin/schools').then((r) => setSchools(r.data.data)).catch(() => {}),
    ])
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await client.post('/api/admin/grants', {
        bookId: form.bookId,
        grantedToId: form.grantedToId,
        quantity: Number(form.quantity),
      })
      setSuccess('دسترسی با موفقیت اعطا شد ✅')
      setForm({ bookId: '', grantedToId: '', quantity: '' })
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">اعطای دسترسی به کتاب</h2>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">کتاب</label>
            <select
              value={form.bookId}
              onChange={(e) => setForm((f) => ({ ...f, bookId: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">انتخاب کتاب...</option>
              {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">مدرسه</label>
            <select
              value={form.grantedToId}
              onChange={(e) => setForm((f) => ({ ...f, grantedToId: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">انتخاب مدرسه...</option>
              {schools.map((s) => <option key={s.id} value={s.admin.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تعداد مجوز</label>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">⚠️ {error}</div>}
          {success && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg">{success}</div>}

          <button type="submit" disabled={saving}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'در حال ارسال...' : 'اعطای دسترسی'}
          </button>
        </form>
      </div>
    </div>
  )
}
