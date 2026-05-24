import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import client, { getErrorMessage } from '../api/client'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await client.post('/api/auth/register', form)
      navigate('/login')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🎮</div>
          <h1 className="text-2xl font-bold text-gray-800">ثبت‌نام</h1>
          <p className="text-gray-500 text-sm mt-1">ایجاد حساب کاربری جدید</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
              <input
                type="text"
                value={form.firstName}
                onChange={set('firstName')}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام خانوادگی</label>
              <input
                type="text"
                value={form.lastName}
                onChange={set('lastName')}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-200">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          حساب دارید؟{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            ورود
          </Link>
        </p>
      </div>
    </div>
  )
}
