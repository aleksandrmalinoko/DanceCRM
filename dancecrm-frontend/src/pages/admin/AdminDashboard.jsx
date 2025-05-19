// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react'
import axios from '../../api/apiClient'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function AdminDashboard() {
  const [txs, setTxs] = useState([])
  const [chartData, setChartData] = useState(null)
  const [filters, setFilters] = useState({ category: '', from: '', to: '' })
  const [form, setForm] = useState({
    type: 'income',
    category: '',
    amount: '',
    date: '',
    description: ''
  })

  // Для отладки: что именно приходит
  console.log('Loaded transactions:', txs)

  // Загрузка транзакций
  const fetchTxs = async () => {
    const params = {}
    if (filters.category) params.category = filters.category
    if (filters.from)     params.from = filters.from
    if (filters.to)       params.to = filters.to

    try {
      const res = await axios.get('/finance/transactions', { params })
      setTxs(res.data)
    } catch (err) {
      console.error('Error fetching transactions', err)
    }
  }

  // Группировка и подготовка данных для графика
  useEffect(() => {
    if (txs.length === 0) {
      console.log('Нет транзакций для графика');
      setChartData(null)
      return
    }

    const incomes = {}
    const expenses = {}

    txs.forEach(t => {
      // Убедимся, что t.type точно строка 'income' или 'expense'
      const type = t.type?.toLowerCase()
      const date = new Date(t.date)
      if (isNaN(date)) return  // пропускаем некорректные даты

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      const amount = parseFloat(t.amount) || 0

      if (type === 'income') {
        incomes[monthKey] = (incomes[monthKey] || 0) + amount
      } else if (type === 'expense') {
        expenses[monthKey] = (expenses[monthKey] || 0) + amount
      }
    })
    console.log('Группировка по месяцам → incomes:', incomes, 'expenses:', expenses)

    const labels = Array.from(
      new Set([...Object.keys(incomes), ...Object.keys(expenses)])
    ).sort()

    const incomeValues = labels.map(l => incomes[l] || 0)
    const expenseValues = labels.map(l => expenses[l] || 0)

    console.log('Месяцы (labels):', labels)
    console.log('Значения доходов:', incomeValues)
    console.log('Значения расходов:', expenseValues)

    const newChartData = {
      labels,
      datasets: [
        {
          label: 'Доходы',
          data: incomeValues,
          tension: 0.4,
          borderColor: 'green',
          backgroundColor: 'rgba(0,128,0,0.2)'
        },
        {
          label: 'Расходы',
          data: expenseValues,
          tension: 0.4,
          borderColor: 'red',
          backgroundColor: 'rgba(255,0,0,0.2)'
        }
      ]
    }
    console.log('chartData для Chart.js:', newChartData)

    setChartData({
      labels,
      datasets: [
        {
          label: 'Доходы',
          data: incomeValues,
          tension: 0.4,
          borderColor: 'green',
          backgroundColor: 'rgba(0,128,0,0.2)'
        },
        {
          label: 'Расходы',
          data: expenseValues,
          tension: 0.4,
          borderColor: 'red',
          backgroundColor: 'rgba(255,0,0,0.2)'
        }
      ]
    })
  }, [txs])

  // Первый вызов
  useEffect(() => {
    fetchTxs()
  }, [])

  const handleFilterChange = e =>
    setFilters(f => ({ ...f, [e.target.name]: e.target.value }))

  const applyFilters = () => {
    fetchTxs()
  }

  const handleFormChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submitTx = async e => {
    e.preventDefault()
    await axios.post('/finance/transactions', {
      type: form.type,
      category: form.category,
      amount: parseFloat(form.amount),
      date: form.date,
      description: form.description
    })
    setForm({ type: 'income', category: '', amount: '', date: '', description: '' })
    fetchTxs()
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl">Админ: Финансовая статистика</h1>

      {/* График */}
      <div className="bg-white p-4 rounded shadow">
        {chartData ? (
          <Line
            data={chartData}
            options={{
              responsive: true,
              scales: { y: { beginAtZero: true } },
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Доходы и расходы по месяцам' }
              }
            }}
          />
        ) : (
          <p>Нет данных для графика.</p>
        )}
      </div>

      {/* Фильтры */}
      <section>
        <h2 className="text-xl mb-2">Фильтры</h2>
        <div className="flex space-x-4 mb-4">
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          >
            <option value="">Все категории</option>
            {Array.from(new Set(txs.map(t => t.category))).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="date"
            name="from"
            value={filters.from}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          />
          <input
            type="date"
            name="to"
            value={filters.to}
            onChange={handleFilterChange}
            className="p-2 border rounded"
          />
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Применить
          </button>
        </div>
      </section>

      {/* Таблица */}
      <section>
        <h2 className="text-xl mb-2">Транзакции</h2>
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left">Тип</th>
              <th className="py-2 px-4 text-left">Категория</th>
              <th className="py-2 px-4 text-left">Сумма</th>
              <th className="py-2 px-4 text-left">Дата</th>
              <th className="py-2 px-4 text-left">Описание</th>
            </tr>
          </thead>
          <tbody>
            {txs.map(t => (
              <tr key={t.id} className="border-t">
                <td className="py-2 px-4">{t.type}</td>
                <td className="py-2 px-4">{t.category}</td>
                <td className="py-2 px-4">
                  {t.type === 'expense' ? '-' : '+'}{t.amount}
                </td>
                <td className="py-2 px-4">{new Date(t.date).toLocaleDateString()}</td>
                <td className="py-2 px-4">{t.description}</td>
              </tr>
            ))}
            {txs.length === 0 && (
              <tr>
                <td colSpan="5" className="py-4 text-center">Нет транзакций</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Форма добавления */}
      <section>
        <h2 className="text-xl mb-2">Добавить транзакцию</h2>
        <form onSubmit={submitTx} className="space-y-4 max-w-md">
          <div className="flex items-center space-x-4">
            <label>
              <input
                type="radio"
                name="type"
                value="income"
                checked={form.type === 'income'}
                onChange={handleFormChange}
              /> Доход
            </label>
            <label>
              <input
                type="radio"
                name="type"
                value="expense"
                checked={form.type === 'expense'}
                onChange={handleFormChange}
              /> Расход
            </label>
          </div>
          <input
            name="category"
            placeholder="Категория"
            value={form.category}
            onChange={handleFormChange}
            required
            className="w-full p-2 border rounded"
          />
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="Сумма"
            value={form.amount}
            onChange={handleFormChange}
            required
            className="w-full p-2 border rounded"
          />
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleFormChange}
            required
            className="w-full p-2 border rounded"
          />
          <input
            name="description"
            placeholder="Описание (необязательно)"
            value={form.description}
            onChange={handleFormChange}
            className="w-full p-2 border rounded"
          />
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
            Добавить
          </button>
        </form>
      </section>
    </div>
  )
}
