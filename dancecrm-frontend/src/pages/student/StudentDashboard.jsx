// dancecrm-frontend/src/pages/student/StudentDashboard.jsx

import React, { useContext, useEffect, useState } from 'react'
import axios from '../../api/apiClient'
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
import { AuthContext } from '../../contexts/AuthContext'

// Генерация массива дат между startDate и endDate включительно
function getDateRange(startDate, endDate) {
  const dates = []
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d))
  }
  return dates
}

export default function StudentDashboard() {
  const { user, loading: authLoading } = useContext(AuthContext)

  const [credits, setCredits]             = useState(null)
  const [types, setTypes]                 = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [period, setPeriod]               = useState('week')
  const [anchorDate, setAnchorDate]       = useState(new Date())
  const [events, setEvents]               = useState([])
  const [loading, setLoading]             = useState(true)

  // 1) Загружаем кредиты и типы занятий
  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      try {
        const credRes  = await axios.get(`/users/${user.id}/credits`)
        setCredits(credRes.data.remainingCredits)

        const typesRes = await axios.get('/schedule/types')
        const opts = typesRes.data.map(t => ({
          value: t.id,
          label: t.name
        }))
        setTypes(opts)
        setSelectedTypes(opts)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  // 2) Загружаем расписание при изменении фильтров или периода
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

    const from = format(start, 'yyyy-MM-dd')
    const to   = format(end,   'yyyy-MM-dd')

    axios.get('/schedule/', {
      params: {
        from,
        to,
        types: selectedTypes.map(t => t.value).join(',')
      }
    })
    .then(res => setEvents(res.data))
    .catch(console.error)
  }, [anchorDate, period, selectedTypes, types])

  if (authLoading || loading) {
    return <p>Загрузка…</p>
  }

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
    return `${format(start,'dd.MM.yyyy')} – ${format(end,'dd.MM.yyyy')}`
  }

  // Рендер календаря
  const renderCalendar = () => {
    // Вертикальная таблица для «недели»
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
                  <td className="border px-4 py-2">{format(day, 'EEEE, dd.MM')}</td>
                  <td className="border px-4 py-2">
                    {dayEvents.length > 0
                      ? dayEvents.map(e => (
                          <div key={e.id}>
                            {e.startTime.slice(0,5)} – {types.find(t=>t.value===e.typeId)?.label}
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

    // Сетка для «месяца» (без изменений)
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
            {dowNames.map(dow => (
              <th key={dow} className="border px-2 py-1">{dow}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map(day => {
                const iso = format(day, 'yyyy-MM-dd')
                const inMonth = period==='month'
                  ? isSameMonth(day, anchorDate)
                  : true
                const dayEvents = events.filter(e => e.date === iso)
                return (
                  <td
                    key={iso}
                    className={`border px-2 py-1 align-top ${inMonth ? '' : 'bg-gray-100'}`}
                  >
                    <div className="text-xs font-medium mb-1">
                      {format(day,'dd.MM')}
                    </div>
                    {dayEvents.map(e => (
                      <div key={e.id} className="text-2xs">
                        {e.startTime.slice(0,5)} – {types.find(t=>t.value===e.typeId)?.label}
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
      <h1 className="text-2xl">Привет, {user.name}!</h1>

      <div className="mb-4">
        <strong>Осталось занятий:</strong>{' '}
        <span className="font-bold">{credits}</span>
      </div>

      <section>
        <h2 className="text-xl mb-4">Расписание занятий</h2>
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
      </section>
    </div>
  )
}
