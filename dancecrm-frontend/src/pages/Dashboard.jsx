import { useEffect, useState } from 'react'
import axios from '../api/apiClient'

export default function Dashboard() {
  const [me, setMe] = useState(null)

  useEffect(() => {
    axios.get('/auth/me').then(res => setMe(res.data))
  }, [])

  if (!me) return <p>Загрузка…</p>

  return (
    <div className="p-6">
      <h1 className="text-2xl">Привет, {me.name}!</h1>
      <p>Ваша роль: {me.role}</p>
      {/* тут будет дальше рендериться Student/Trainer/Admin Dashboard */}
    </div>
  )
}
