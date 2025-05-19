// dancecrm-frontend/src/pages/admin/AdminLayout.jsx
import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { FaBars } from 'react-icons/fa'  // иконка «бургер»

export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="flex h-screen">
      {/* Боковая панель */}
      <div
        className={`
          bg-gray-800 text-white
          transition-all duration-200
          ${isOpen ? 'w-64' : 'w-16'}
        `}
      >
        {/* Кнопка-тогглер */}
        <div className="flex justify-end p-2">
          <button
            onClick={() => setIsOpen(o => !o)}
            className="focus:outline-none"
          >
            <FaBars />
          </button>
        </div>
        {/* Сам Sidebar получает флаг collapsed */}
        <Sidebar collapsed={!isOpen} />
      </div>

      {/* Основная область */}
      <div className="flex-grow overflow-auto bg-gray-100">
        <Outlet />
      </div>
    </div>
  )
}
