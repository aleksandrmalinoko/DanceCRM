// C:\Users\alexandr\PycharmProjects\DanceCRM\dancecrm-frontend\src\pages\admin\Schedule.jsx
import React, { useEffect, useState, useContext } from 'react'
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
  isSameMonth,
  parseISO
} from 'date-fns'
import { AuthContext } from '../../contexts/AuthContext'
import Modal from 'react-modal'

Modal.setAppElement('#root')

function getDateRange(startDate, endDate) {
  const dates = []
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d))
  }
  return dates
}

export default function Schedule() {
  const { user } = useContext(AuthContext)

  const [types, setTypes]                 = useState([])
  const [trainers, setTrainers]           = useState([])
  const [newType, setNewType]             = useState('')
  const [selectedTypes, setSelectedTypes] = useState([])
  const [period, setPeriod]               = useState('week')
  const [anchorDate, setAnchorDate]       = useState(new Date())
  const [events, setEvents]               = useState([])

  const [isModalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate]   = useState('')
  const [seriesForm, setSeriesForm] = useState({
    typeId:     null,
    trainerId:  null,
    daysOfWeek: {},
    startTime:  '18:00',
    endTime:    '19:00'
  })

  // Загрузка типов и тренеров
  useEffect(() => {
    axios.get('/schedule/types')
      .then(res => {
        const opts = res.data.map(t => ({ value: t.id, label: t.name }))
        setTypes(opts)
        setSelectedTypes(opts)
      })
      .catch(console.error)

    axios.get('/users', { params: { role: 'trainer' } })
      .then(res => {
        const opts = res.data.map(u => ({ value: u.id, label: u.name }))
        setTrainers(opts)
        setSeriesForm(f => ({ ...f, trainerId: opts[0]?.value || null }))
      })
      .catch(console.error)
  }, [])

  // Создание нового типа
  const addType = async () => {
    if (!newType.trim()) return
    const res = await axios.post('/schedule/types', { name: newType })
    const opt = { value: res.data.id, label: res.data.name }
    setTypes(prev => [...prev, opt])
    setSelectedTypes(prev => [...prev, opt])
    setNewType('')
  }

  // Загрузка событий
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
  }, [anchorDate, period, selectedTypes, types, user])

  const shift = dir => {
    if (period === 'week') setAnchorDate(d => addWeeks(d, dir))
    else                   setAnchorDate(d => addMonths(d, dir))
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

  // Открытие модалки
  const openModal = isoDate => {
    setModalDate(isoDate)
    const dow = format(parseISO(isoDate), 'eee') // 'Mon','Tue',...
    setSeriesForm(f => ({
      ...f,
      daysOfWeek: { [dow]: true }
    }))
    setModalOpen(true)
  }

  const submitSeries = async e => {
    e.preventDefault()
    await axios.post('/schedule/', {
      ...seriesForm,
      startDate: modalDate
    })
    setModalOpen(false)
    shift(0)
  }

  const cancelInstance = async id => {
    await axios.post(`/schedule/${id}/cancel_instance`, { date: modalDate })
    setModalOpen(false)
    shift(0)
  }
  const cancelSeries = async id => {
    await axios.post(`/schedule/${id}/cancel_series`, { from: modalDate })
    setModalOpen(false)
    shift(0)
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
                    {dayEvents.length > 0 ? (
                      dayEvents.map(e => (
                        <div key={e.id} className="mb-1">
                          {e.startTime.slice(0,5)} – {types.find(t => t.value === e.typeId)?.label}
                          {' '}({e.trainerName})
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )
    }

    // Сетка для месяца
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
      {/* Фильтры */}
      <div className="flex items-center space-x-2">
        <Select
          isMulti
          options={types}
          value={selectedTypes}
          onChange={setSelectedTypes}
          className="w-1/3"
        />
        <input
          value={newType}
          onChange={e => setNewType(e.target.value)}
          placeholder="Новый тип…"
          className="p-2 border rounded"
        />
        <button
          onClick={addType}
          className="px-3 py-1 bg-green-600 text-white rounded"
        >
          Добавить тип
        </button>
      </div>

      {/* Навигация */}
      <div className="flex items-center space-x-4 mb-4">
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

      {/* Модалка */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setModalOpen(false)}
        className="p-6 bg-white rounded shadow-lg max-w-md mx-auto"
      >
        <h2 className="text-lg mb-4">Занятия на {modalDate}</h2>
        <ul className="mb-4">
          {events.filter(e => e.date === modalDate).map(e => (
            <li key={e.id} className="flex justify-between mb-2">
              <span>
                {e.startTime.slice(0,5)} – {types.find(t => t.value === e.typeId)?.label}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => cancelInstance(e.id)}
                  className="px-2 py-1 bg-yellow-500 rounded"
                >
                  Отменить один
                </button>
                <button
                  onClick={() => cancelSeries(e.id)}
                  className="px-2 py-1 bg-red-600 rounded text-white"
                >
                  Отменить серию
                </button>
              </div>
            </li>
          ))}
          {events.filter(e => e.date === modalDate).length === 0 && (
            <p className="text-gray-500">Нет серий</p>
          )}
        </ul>

        <h3 className="text-md mb-2">Создать серию/разовое занятие</h3>
        <form onSubmit={submitSeries} className="space-y-2">
          <Select
            options={trainers}
            value={trainers.find(t => t.value === seriesForm.trainerId) || null}
            onChange={opt => setSeriesForm(f => ({ ...f, trainerId: opt.value }))}
            placeholder="Выберите тренера…"
          />

          <select
            required
            value={seriesForm.typeId || ''}
            onChange={e => setSeriesForm(f => ({ ...f, typeId: +e.target.value }))}
            className="p-2 border rounded w-full"
          >
            <option value="" disabled>Тип занятия</option>
            {types.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <div className="flex space-x-2">
            <input
              type="time"
              value={seriesForm.startTime}
              onChange={e => setSeriesForm(f => ({ ...f, startTime: e.target.value }))}
              className="p-2 border rounded flex-1"
            />
            <input
              type="time"
              value={seriesForm.endTime}
              onChange={e => setSeriesForm(f => ({ ...f, endTime: e.target.value }))}
              className="p-2 border rounded flex-1"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded"
          >
            Создать
          </button>
        </form>
      </Modal>
    </div>
  )
}
