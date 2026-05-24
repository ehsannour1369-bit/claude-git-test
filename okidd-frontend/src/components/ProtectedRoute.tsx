import { Navigate } from 'react-router-dom'

interface Props {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')

  if (!token) return <Navigate to="/login" replace />

  if (allowedRoles && userStr) {
    const user = JSON.parse(userStr) as { role: string }
    if (!allowedRoles.includes(user.role)) return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
