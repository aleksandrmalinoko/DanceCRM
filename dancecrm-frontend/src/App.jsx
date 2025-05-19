// dancecrm-frontend/src/App.jsx
import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login           from './pages/Login'
import ProtectedRoute  from './components/ProtectedRoute'
import { AuthContext } from './contexts/AuthContext'

// Страницы
import Profile            from './pages/Profile'
import StudentDashboard   from './pages/student/StudentDashboard'
import TrainerDashboard   from './pages/trainer/TrainerDashboard'
import AdminFinance       from './pages/admin/AdminFinance'
import Schedule           from './pages/admin/Schedule'
import Trainers           from './pages/admin/Trainers'
import Students           from './pages/admin/Students'
import AdminLayout        from './pages/admin/AdminLayout'

// Выбираем дашборд по роли для /dashboard/schedule
function ScheduleRoute() {
  const { user } = useContext(AuthContext)
  if (user.role === 'student') return <StudentDashboard/>
  if (user.role === 'trainer') return <TrainerDashboard/>
  return <Schedule/>
}

// Перенаправление при заходе на /dashboard
function DashboardIndex() {
  const { user } = useContext(AuthContext)
  if (user.role === 'student') return <Navigate to="profile" replace/>
  if (user.role === 'trainer') return <Navigate to="schedule" replace/>
  return <Navigate to="finance" replace/>
}

export default function App() {
  const { loading } = useContext(AuthContext)
  if (loading) return <p>Загрузка авторизации…</p>

  return (
    <Routes>
      {/* публичная страница логина */}
      <Route path="/" element={<Login/>} />

      {/* защищённые страницы */}
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        {/* индекс /dashboard */}
        <Route index element={<DashboardIndex/>} />
        {/* профиль */}
        <Route path="profile"  element={<Profile/>} />
        {/* финансы только для админа */}
        <Route path="finance"  element={<AdminFinance/>} />
        {/* расписание для всех ролей */}
        <Route path="schedule" element={<ScheduleRoute/>} />
        {/* список тренеров (только админ) */}
        <Route path="trainers" element={<Trainers/>} />
        {/* список учеников (только админ) */}
        <Route path="students" element={<Students/>} />
        {/* всё прочее — назад на /dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace/>} />
      </Route>

      {/* любой несуществующий путь — на логин */}
      <Route path="*" element={<Navigate to="/" replace/>} />
    </Routes>
  )
}
