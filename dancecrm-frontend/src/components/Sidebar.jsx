import React, { useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import axios from '../api/apiClient'
import { AuthContext } from '../contexts/AuthContext'

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, setUser } = useContext(AuthContext)

  const handleLogout = async () => {
    await axios.post('/auth/logout')
    setUser(null)
    navigate('/', { replace: true })
  }

  // Общие пункты
  const items = [
    { to: 'profile', label: 'Профиль' },
    // далее — по ролям
    ...(user.role === 'admin'
      ? [
          { to: 'finance',  label: 'Финансы' },
          { to: 'schedule', label: 'Расписание' },
          { to: 'trainers', label: 'Тренеры' },
          { to: 'students', label: 'Ученики' },
        ]
      : user.role === 'trainer'
      ? [
          { to: 'schedule', label: 'Расписание' },
        ]
      : user.role === 'student'
      ? [
          { to: 'schedule', label: 'Расписание' },
        ]
      : []
    )
  ]

  return (
    <aside className="w-64 bg-gray-800 text-white h-full flex flex-col">
      <nav className="mt-10 flex-1 space-y-2">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `block px-4 py-2 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-auto mb-4 mx-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
      >
        Выйти
      </button>
    </aside>
  )
}
