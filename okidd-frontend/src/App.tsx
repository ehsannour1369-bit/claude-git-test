import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'

import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminBooks from './pages/admin/Books'
import AdminLessons from './pages/admin/Lessons'
import AdminGrants from './pages/admin/Grants'

import SchoolDashboard from './pages/school/Dashboard'
import SchoolClasses from './pages/school/Classes'
import SchoolGrants from './pages/school/Grants'

import TeacherClasses from './pages/teacher/Classes'
import TeacherReport from './pages/teacher/Report'

import ParentChildren from './pages/parent/Children'
import ParentReport from './pages/parent/Report'

import StudentDashboard from './pages/student/Dashboard'
import StudentBooks from './pages/student/Books'
import StudentLessons from './pages/student/Lessons'

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function SchoolLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['SCHOOL']}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['TEACHER']}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['PARENT']}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/claude-git-test">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
        <Route path="/admin/books" element={<AdminLayout><AdminBooks /></AdminLayout>} />
        <Route path="/admin/lessons" element={<AdminLayout><AdminLessons /></AdminLayout>} />
        <Route path="/admin/grants" element={<AdminLayout><AdminGrants /></AdminLayout>} />

        <Route path="/school" element={<SchoolLayout><SchoolDashboard /></SchoolLayout>} />
        <Route path="/school/classes" element={<SchoolLayout><SchoolClasses /></SchoolLayout>} />
        <Route path="/school/grants" element={<SchoolLayout><SchoolGrants /></SchoolLayout>} />

        <Route path="/teacher" element={<TeacherLayout><TeacherClasses /></TeacherLayout>} />
        <Route path="/teacher/report" element={<TeacherLayout><TeacherReport /></TeacherLayout>} />

        <Route path="/parent" element={<ParentLayout><ParentChildren /></ParentLayout>} />
        <Route path="/parent/report" element={<ParentLayout><ParentReport /></ParentLayout>} />

        <Route path="/student" element={<StudentLayout><StudentDashboard /></StudentLayout>} />
        <Route path="/student/books" element={<StudentLayout><StudentBooks /></StudentLayout>} />
        <Route path="/student/lessons" element={<StudentLayout><StudentLessons /></StudentLayout>} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
