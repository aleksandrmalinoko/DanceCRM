import React, { useContext, useEffect, useState } from 'react'
import axios from '../api/apiClient'
import { AuthContext } from '../contexts/AuthContext'

export default function Profile() {
  const { user, loading } = useContext(AuthContext)
  const [qrUrl, setQrUrl] = useState(null)

  useEffect(() => {
    if (user?.role === 'student') {
      // только для учеников запрашиваем QR
      axios.get('/auth/qrcode', { responseType: 'blob' })
        .then(res => {
          const url = URL.createObjectURL(res.data)
          setQrUrl(url)
        })
        .catch(console.error)
    }
  }, [user])

  if (loading) return <p>Загрузка профиля…</p>

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Профиль</h1>
      <p><strong>Имя:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Роль:</strong> {user.role}</p>

      {user.role === 'student' && (
        <div className="mt-6">
          <h2 className="text-xl mb-2">Ваш QR-код</h2>
          {qrUrl
            ? <img src={qrUrl} alt="QR код" className="w-48 h-48" />
            : <p>Загрузка QR…</p>
          }
        </div>
      )}
    </div>
  )
}
