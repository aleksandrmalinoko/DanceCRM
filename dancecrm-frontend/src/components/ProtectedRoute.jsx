// src/components/ProtectedRoute.jsx
import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext)

  if (loading) {
    // Можно показать спиннер или просто ничего
    return <p>Загрузка…</p>
  }
  return user
    ? children
    : <Navigate to="/" replace />
}
