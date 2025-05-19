// dancecrm-frontend/src/pages/admin/Students.jsx

import React, { useEffect, useState } from 'react'
import axios from '../../api/apiClient'

export default function Students() {
  const [students, setStudents] = useState([])
  const [newUser, setNewUser]   = useState({ name: '', email: '', password: '' })
  const [selected, setSelected] = useState(null)
  const [stats, setStats]       = useState(null)
  const [credits, setCredits]   = useState(0)
  const [editMode, setEditMode] = useState(false)

  // Загрузка списка учеников
  const fetchStudents = () => {
    axios.get('/users', { params: { role: 'student' } })
      .then(res => setStudents(res.data))
      .catch(console.error)
  }

  useEffect(fetchStudents, [])

  // Создание нового ученика
  const createStudent = async () => {
    await axios.post('/users', {
      ...newUser,
      role: 'student'
    })
    setNewUser({ name: '', email: '', password: '' })
    fetchStudents()
  }

  // Выбор ученика и загрузка его статистики и кредитов
  const selectStudent = async s => {
    setSelected(s)
    setEditMode(false)

    try {
      const [{ data: stat }, { data: cred }] = await Promise.all([
        // статистика посещений
        axios.get(`/users/${s.id}/stats`, { params: { role: 'student' } }),
        // правильный endpoint для оставшихся занятий
        axios.get(`/users/${s.id}/credits`)
      ])
      setStats(stat)
      // здесь используем правильное поле remainingCredits
      setCredits(cred.remainingCredits)
    } catch (err) {
      console.error(err)
    }
  }

  // Сохранение обновлённого количества занятий
  const saveCredits = async () => {
    try {
      await axios.put(`/users/${selected.id}/credits`, {
        // в теле PUT должно быть поле remainingCredits
        remainingCredits: credits
      })
      setEditMode(false)
      // по идее, можно обновить список и детали:
      fetchStudents()
      selectStudent(selected)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Ученики</h1>

      {/* Форма создания нового ученика */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl mb-2">Новый ученик</h2>
        <div className="space-y-2">
          <input
            value={newUser.name}
            onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
            placeholder="Имя"
            className="w-full p-2 border rounded"
          />
          <input
            value={newUser.email}
            onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
            placeholder="Email"
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            value={newUser.password}
            onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
            placeholder="Пароль"
            className="w-full p-2 border rounded"
          />
          <button
            onClick={createStudent}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Создать ученика
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Список учеников */}
        <ul className="w-1/3 border rounded p-2">
          {students.map(s => (
            <li key={s.id} className="mb-1">
              <button
                className="text-blue-600 hover:underline"
                onClick={() => selectStudent(s)}
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>

        {/* Панель выбранного ученика */}
        <div className="flex-1 p-4">
          {selected ? (
            <>
              <h2 className="text-xl mb-2">Профиль: {selected.name}</h2>
              <p>Email: {selected.email}</p>

              {/* Блок редактирования оставшихся занятий */}
              <div className="mt-4">
                <label className="block">Осталось занятий:</label>
                {editMode ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={credits}
                      onChange={e => setCredits(+e.target.value)}
                      className="p-1 border rounded w-20"
                    />
                    <button
                      onClick={saveCredits}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-3 py-1 bg-gray-400 rounded"
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>{credits}</span>
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-2 py-1 bg-blue-600 text-white rounded"
                    >
                      Редактировать
                    </button>
                  </div>
                )}
              </div>

              {/* Статистика посещений */}
              <div className="mt-6">
                <h3 className="text-lg mb-2">Статистика посещений</h3>
                <pre className="bg-gray-100 p-4 rounded">
                  {JSON.stringify(stats, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <p>Выберите ученика</p>
          )}
        </div>
      </div>
    </div>
  )
}
