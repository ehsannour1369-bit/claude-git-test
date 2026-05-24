import { NavLink, useNavigate } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  icon: string
}

const navByRole: Record<string, NavItem[]> = {
  ADMIN: [
    { to: '/admin', label: 'داشبورد', icon: '📊' },
    { to: '/admin/users', label: 'کاربران', icon: '👥' },
    { to: '/admin/books', label: 'کتاب‌ها', icon: '📚' },
    { to: '/admin/lessons', label: 'درس‌ها', icon: '📖' },
    { to: '/admin/grants', label: 'اعطای دسترسی', icon: '🎫' },
  ],
  SCHOOL: [
    { to: '/school', label: 'داشبورد', icon: '📊' },
    { to: '/school/classes', label: 'کلاس‌ها', icon: '🏫' },
    { to: '/school/grants', label: 'دسترسی‌ها', icon: '🎫' },
  ],
  TEACHER: [
    { to: '/teacher', label: 'کلاس‌ها', icon: '🏫' },
    { to: '/teacher/report', label: 'گزارش', icon: '📈' },
  ],
  PARENT: [
    { to: '/parent', label: 'فرزندان', icon: '👨‍👧' },
    { to: '/parent/report', label: 'گزارش', icon: '📈' },
  ],
  STUDENT: [
    { to: '/student', label: 'داشبورد', icon: '🏠' },
    { to: '/student/books', label: 'کتاب‌ها', icon: '📚' },
  ],
}

const roleLabel: Record<string, string> = {
  ADMIN: 'ادمین',
  SCHOOL: 'مدرسه',
  TEACHER: 'معلم',
  PARENT: 'والدین',
  STUDENT: 'دانش‌آموز',
}

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  const navigate = useNavigate()
  const userStr = localStorage.getItem('user')
  const user = userStr ? (JSON.parse(userStr) as { firstName: string; lastName: string; role: string }) : null
  const navItems = navByRole[user?.role ?? ''] ?? []

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-indigo-700 text-white flex flex-col shadow-xl">
        <div className="p-5 border-b border-indigo-600">
          <h1 className="text-2xl font-bold tracking-wide">اوکیدد 🎮</h1>
          <p className="text-indigo-300 text-xs mt-1">پلتفرم آموزشی</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/school' || item.to === '/student'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white text-indigo-700' : 'text-indigo-100 hover:bg-indigo-600'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-600">
          {user && (
            <div className="mb-3">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-indigo-300">{roleLabel[user.role]}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full text-right text-sm text-indigo-200 hover:text-white transition-colors"
          >
            🚪 خروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
