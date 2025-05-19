import React, { useEffect, useState } from 'react'
import axios from '../../api/apiClient'

export default function Trainers() {
  const [trainers, setTrainers] = useState([])
  const [newUser, setNewUser]   = useState({ name: '', email: '', password: '' })
  const [selected, setSelected] = useState(null)
  const [stats, setStats]       = useState(null)

  const fetchTrainers = () => {
    axios.get('/users', { params: { role: 'trainer' } })
      .then(res => setTrainers(res.data))
      .catch(console.error)
  }

  useEffect(fetchTrainers, [])

  const createTrainer = async () => {
    await axios.post('/users', {
      ...newUser,
      role: 'trainer'
    })
    setNewUser({ name: '', email: '', password: '' })
    fetchTrainers()
  }

  useEffect(() => {
    axios
      .get('/users', { params: { role: 'trainer' } })
      .then(res => setTrainers(res.data))
      .catch(console.error)
  }, [])

  const selectTrainer = async t => {
    setSelected(t)
    const res = await axios.get(`/users/${t.id}/stats`, { params: { role: 'trainer' } })
    setStats(res.data)
  }

  return (
      <div className="p-6">
        <h1 className="text-2xl mb-4">Тренеры</h1>
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl mb-2">Новый тренер</h2>
          <div className="space-y-2">
            <input
                value={newUser.name}
                onChange={e => setNewUser(u => ({...u, name: e.target.value}))}
                placeholder="Имя"
                className="w-full p-2 border rounded"
            />
            <input
                value={newUser.email}
                onChange={e => setNewUser(u => ({...u, email: e.target.value}))}
                placeholder="Email"
                className="w-full p-2 border rounded"
            />
            <input
                type="password"
                value={newUser.password}
                onChange={e => setNewUser(u => ({...u, password: e.target.value}))}
                placeholder="Пароль"
                className="w-full p-2 border rounded"
            />
            <button
                onClick={createTrainer}
                className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Создать тренера
            </button>
          </div>
        </div>
        <div className="flex">
          <ul className="w-1/3 border rounded p-2">
            {trainers.map(t => (
                <li key={t.id}>
                  <button
                      className="text-blue-600 hover:underline"
                      onClick={() => selectTrainer(t)}
                  >
                    {t.name}
                  </button>
                </li>
            ))}
          </ul>
          <div className="flex-1 p-4">
            {selected ? (
                <div>
                  <h2 className="text-xl mb-2">Статистика: {selected.name}</h2>
                  <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(stats, null, 2)}</pre>
                </div>
            ) : (
                <p>Выберите тренера</p>
            )}
          </div>
        </div>
      </div>
  )
}
