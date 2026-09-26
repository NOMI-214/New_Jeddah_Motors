import { useEffect, useState } from 'react'
import client from '../api/client'
import { Card, money } from './ui'
import PageLoader from './PageLoader'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const CASH_COLORS = ['#15803D', '#BE123C', '#D97706']

export default function DashboardTrends() {
  const [period, setPeriod] = useState('year')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [trends, setTrends] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const params = { period, year: selectedYear }
    if (period === 'month') params.month = selectedMonth

    setTrends(null)
    setError('')
    client.get('/reports/dashboard-trends', { params })
      .then((response) => {
        if (!cancelled) setTrends(response.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || 'Could not load this period\'s report')
      })

    return () => { cancelled = true }
  }, [period, selectedYear, selectedMonth])

  const cashMovement = trends
    ? trends.totals.cash_in + trends.totals.cash_out + trends.totals.expenses
    : 0

  return (
    <Card sheen className="p-5 space-y-5 animate-fadeInUp">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-ink-900">Showroom performance</h3>
          <p className="text-xs text-ink-600/60">Sales growth and actual cash movements for the selected period</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="inline-flex rounded-lg border border-ink-900/10 bg-ink-900/[0.03] p-1" role="group" aria-label="Report period">
            {['month', 'year'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                aria-pressed={period === value}
                className={`px-3 py-1.5 text-xs font-semibold capitalize transition ${period === value ? 'rounded-md bg-white text-ink-900 shadow-sm' : 'text-ink-600/60 hover:text-ink-900'}`}
              >
                {value}
              </button>
            ))}
          </div>
          {period === 'month' && (
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              aria-label="Select month"
              className="rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm"
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month}>{new Date(2000, month - 1, 1).toLocaleString('en', { month: 'long' })}</option>
              ))}
            </select>
          )}
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            aria-label="Select year"
            className="rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm"
          >
            {Array.from({ length: 7 }, (_, index) => new Date().getFullYear() - index).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : !trends ? (
        <PageLoader label="Loading performance report" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="border-l-2 border-emerald-600 pl-3">
              <p className="text-xs text-ink-600/60">Sales revenue</p>
              <p className="text-base font-bold text-ink-900">{money(trends.totals.revenue)}</p>
            </div>
            <div className="border-l-2 border-brand-500 pl-3">
              <p className="text-xs text-ink-600/60">Sales profit</p>
              <p className="text-base font-bold text-ink-900">{money(trends.totals.profit)}</p>
            </div>
            <div className="border-l-2 border-amber-500 pl-3">
              <p className="text-xs text-ink-600/60">Cash change</p>
              <p className="text-base font-bold text-ink-900">{money(trends.totals.net_cash_change)}</p>
            </div>
            <div className="border-l-2 border-sky-600 pl-3">
              <p className="text-xs text-ink-600/60">Revenue vs previous {period}</p>
              <p className={`text-base font-bold ${trends.totals.revenue_growth_percent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {trends.totals.revenue_growth_percent == null ? 'No prior data' : `${trends.totals.revenue_growth_percent >= 0 ? '+' : ''}${trends.totals.revenue_growth_percent.toFixed(1)}%`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)]">
            <section aria-label="Revenue and profit trend">
              <h4 className="mb-2 text-sm font-semibold text-ink-800">Revenue and profit trend</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#15803D" stopOpacity={0.28} /><stop offset="95%" stopColor="#15803D" stopOpacity={0.02} /></linearGradient>
                      <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C9A961" stopOpacity={0.28} /><stop offset="95%" stopColor="#C9A961" stopOpacity={0.02} /></linearGradient>
                    </defs>
                    <CartesianGrid stroke="#0B0D10" strokeOpacity={0.08} vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#60666D' }} minTickGap={18} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#60666D' }} tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}m` : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value} width={42} />
                    <Tooltip formatter={(value) => money(value)} contentStyle={{ borderRadius: 8, borderColor: '#E5E2DA', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="revenue" name="Sales revenue" stroke="#15803D" strokeWidth={2} fill="url(#revenueFill)" activeDot={{ r: 4 }} />
                    <Area type="monotone" dataKey="profit" name="Sales profit" stroke="#B08A3E" strokeWidth={2} fill="url(#profitFill)" activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section aria-label="Cash movement composition">
              <h4 className="mb-2 text-sm font-semibold text-ink-800">Cash movement composition</h4>
              <p className="text-xs text-ink-600/60">Posted cash transactions and expenses only. Outstanding account balances are excluded.</p>
              <div className="relative h-56 w-full">
                {cashMovement === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-ink-600/50">No cash movement for this period</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Cash in', value: trends.totals.cash_in },
                          { name: 'Cash out', value: trends.totals.cash_out },
                          { name: 'Expenses', value: trends.totals.expenses },
                        ].filter((item) => item.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="58%"
                        outerRadius="82%"
                        paddingAngle={3}
                        stroke="none"
                      >
                        {CASH_COLORS.map((color) => <Cell key={color} fill={color} />)}
                      </Pie>
                      <Tooltip formatter={(value) => money(value)} contentStyle={{ borderRadius: 8, borderColor: '#E5E2DA', fontSize: 12 }} />
                      <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {cashMovement > 0 && (
                  <div className="pointer-events-none absolute inset-x-0 top-[38%] text-center">
                    <p className="text-[10px] text-ink-600/50">NET CASH CHANGE</p>
                    <p className="text-sm font-bold text-ink-900">{money(trends.totals.net_cash_change)}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </Card>
  )
}
