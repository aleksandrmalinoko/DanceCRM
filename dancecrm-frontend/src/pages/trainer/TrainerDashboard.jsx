// dancecrm-frontend/src/pages/trainer/TrainerDashboard.jsx

import React, { useContext, useEffect, useState } from 'react'
import axios from '../../api/apiClient'
import { AuthContext } from '../../contexts/AuthContext'
import Select from 'react-select'
import {
  format,
  addWeeks,
  addMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameMonth
} from 'date-fns'
import Modal from 'react-modal'
import QrReader from 'react-qr-reader'

Modal.setAppElement('#root')

function getDateRange(startDate, endDate) {
  const dates = []
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d))
  }
  return dates
}

export default function TrainerDashboard() {
  const { user, loading: authLoading } = useContext(AuthContext)

  // фильтры
  const [types, setTypes]                 = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])

  // календарь
  const [period, setPeriod]         = useState('week')
  const [anchorDate, setAnchorDate] = useState(new Date())
  const [events, setEvents]         = useState([])

  // модалка
  const [modalOpen, setModalOpen]     = useState(false)
  const [modalDate, setModalDate]     = useState('')
  const [modalEvents, setModalEvents] = useState([])

  // сканер и подтверждение
  const [scannerOpen, setScannerOpen]       = useState(false)
  const [scannedStudent, setScannedStudent] = useState(null)

  // Загрузка типов занятий
  useEffect(() => {
    axios.get('/schedule/types')
      .then(res => {
        const opts = res.data.map(t => ({ value: t.id, label: t.name }))
        setTypes(opts)
        setSelectedTypes(opts)
      })
      .catch(console.error)
  }, [])

  // Загрузка событий по фильтрам
  useEffect(() => {
    if (!types.length) return

    let start, end
    if (period === 'week') {
      start = startOfWeek(anchorDate, { weekStartsOn: 1 })
      end   = endOfWeek(anchorDate,   { weekStartsOn: 1 })
    } else {
      start = startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 })
      end   = endOfWeek(endOfMonth(anchorDate),     { weekStartsOn: 1 })
    }

    axios.get('/schedule/', {
      params: {
        from:       format(start, 'yyyy-MM-dd'),
        to:         format(end,   'yyyy-MM-dd'),
        types:      selectedTypes.map(t => t.value).join(','),
        trainerId:  user.id
      }
    })
      .then(res => setEvents(res.data))
      .catch(console.error)
  }, [anchorDate, period, selectedTypes, types, user.id])

  if (authLoading) return <p>Загрузка…</p>

  // Навигация по периодам
  const shift = dir => {
    if (period === 'week')      setAnchorDate(d => addWeeks(d, dir))
    else /* month */            setAnchorDate(d => addMonths(d, dir))
  }
  const getIntervalString = () => {
    let start, end
    if (period === 'week') {
      start = startOfWeek(anchorDate, { weekStartsOn: 1 })
      end   = endOfWeek(anchorDate,   { weekStartsOn: 1 })
    } else {
      start = startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 })
      end   = endOfWeek(endOfMonth(anchorDate),     { weekStartsOn: 1 })
    }
    return `${format(start, 'dd.MM.yyyy')} – ${format(end, 'dd.MM.yyyy')}`
  }

  // Модалка с занятиями на день
  const openModal = iso => {
    setModalDate(iso)
    setModalEvents(events.filter(e => e.date === iso))
    setModalOpen(true)
    setScannerOpen(false)
    setScannedStudent(null)
  }
  const closeModal = () => {
    setModalOpen(false)
    setScannerOpen(false)
    setScannedStudent(null)
  }

  // Сканер QR
  const handleError = err => {
    console.error(err)
    setScannerOpen(false)
  }
  const handleScan = data => {
    if (!data) return
    axios.get('/users', { params: { uid: data, role: 'student' } })
      .then(res => {
        const stu = res.data[0]
        setScannedStudent(stu)
      })
      .catch(console.error)
      .finally(() => setScannerOpen(false))
  }
  const confirmAttendance = async () => {
    if (!scannedStudent) return
    await axios.post('/attendance/mark/', {
      studentId: scannedStudent.id
    })
    closeModal()
  }

  // Рендер календаря
  const renderCalendar = () => {
    // Вертикальная таблица для недели
    if (period === 'week') {
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 })
      const weekDates = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(d.getDate() + i)
        weekDates.push(d)
      }
      return (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2 text-left">День</th>
              <th className="border px-4 py-2 text-left">Занятия</th>
            </tr>
          </thead>
          <tbody>
            {weekDates.map(day => {
              const iso = format(day, 'yyyy-MM-dd')
              const dayEvents = events.filter(e => e.date === iso)
              return (
                <tr key={iso}>
                  <td
                    className="border px-4 py-2 cursor-pointer"
                    onClick={() => openModal(iso)}
                  >
                    {format(day, 'EEEE, dd.MM')}
                  </td>
                  <td className="border px-4 py-2">
                    {dayEvents.length > 0
                      ? dayEvents.map(e => (
                          <div key={e.id} className="mb-1">
                            {e.startTime.slice(0,5)} – {types.find(t => t.value === e.typeId)?.label}
                          </div>
                        ))
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )
    }

    // Сетка для месяца (как было ранее)
    const mStart = startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 })
    const mEnd   = endOfWeek(endOfMonth(anchorDate),     { weekStartsOn: 1 })
    const allDates = getDateRange(mStart, mEnd)
    const weeks = []
    for (let i = 0; i < allDates.length; i += 7) {
      weeks.push(allDates.slice(i, i + 7))
    }
    const dowNames = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

    return (
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            {dowNames.map(d => (
              <th key={d} className="border px-2 py-1">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map(day => {
                const iso = format(day, 'yyyy-MM-dd')
                const inMonth = isSameMonth(day, anchorDate)
                const dayEvents = events.filter(e => e.date === iso)
                return (
                  <td
                    key={iso}
                    className={`border px-2 py-1 align-top ${inMonth ? '' : 'bg-gray-100'}`}
                    onClick={() => openModal(iso)}
                  >
                    <div className="text-xs font-medium mb-1">
                      {format(day, 'dd.MM')}
                    </div>
                    {dayEvents.map(e => (
                      <div key={e.id} className="text-2xs">
                        {e.startTime.slice(0,5)} – {types.find(t => t.value === e.typeId)?.label}
                      </div>
                    ))}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl">Здравствуйте, {user.name}!</h1>

      <div className="flex items-center space-x-4 mb-4">
        <div className="w-1/3">
          <Select
            isMulti
            options={types}
            value={selectedTypes}
            onChange={setSelectedTypes}
            placeholder="Фильтр по типам…"
          />
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="week">Неделя</option>
          <option value="month">Месяц</option>
        </select>
        <button onClick={() => shift(-1)} className="px-2">← Пред.</button>
        <span className="font-semibold">{getIntervalString()}</span>
        <button onClick={() => shift(+1)} className="px-2">След. →</button>
      </div>

      {renderCalendar()}

      <Modal
        isOpen={modalOpen}
        onRequestClose={closeModal}
        className="p-6 bg-white rounded shadow-lg max-w-md mx-auto"
      >
        <h2 className="text-lg mb-4">Занятия на {modalDate}</h2>
        <ul className="mb-4 space-y-2">
          {modalEvents.map(e => (
            <li key={e.id} className="flex justify-between items-center">
              <span>
                {e.startTime.slice(0,5)} – {types.find(t => t.value === e.typeId)?.label}
              </span>
              {e.trainerId === user.id && (
                <button
                  onClick={() => setScannerOpen(true)}
                  className="px-2 py-1 bg-blue-600 text-white rounded"
                >
                  Сканировать QR
                </button>
              )}
            </li>
          ))}
          {modalEvents.length === 0 && <p>Нет занятий</p>}
        </ul>

        {scannerOpen && !scannedStudent && (
          <QrReader
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%' }}
          />
        )}

        {scannedStudent && (
          <div className="border p-4 rounded space-y-2">
            <h3 className="text-lg">{scannedStudent.name}</h3>
            <p>Осталось занятий: <strong>{scannedStudent.remainingCredits}</strong></p>
            <button
              onClick={confirmAttendance}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Подтвердить посещение
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
