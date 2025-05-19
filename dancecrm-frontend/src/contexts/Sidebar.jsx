// dancecrm-frontend/src/components/Sidebar.jsx
import React from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { path: 'profile',  label: 'Профиль'    },
  { path: 'schedule', label: 'Расписание' },
  { path: 'finance',  label: 'Финансы'    },
  { path: 'trainers', label: 'Тренеры'    },
  { path: 'students', label: 'Ученики'    },
]

export default function Sidebar({ collapsed }) {
  return (
    <nav className="mt-6">
      {links.map(link => (
        <NavLink
          key={link.path}
          to={`/dashboard/${link.path}`}
          className={({ isActive }) =>
            `flex items-center py-2 px-4 hover:bg-gray-700 ${
              isActive ? 'bg-gray-700' : ''
            }`
          }
        >
          {/* Вот здесь мы либо показываем весь текст, либо только первую букву */}
          <span className="flex-shrink-0 w-6">
            {collapsed ? link.label[0] : link.label}
          </span>
        </NavLink>
      ))}
    </nav>
  )
}
