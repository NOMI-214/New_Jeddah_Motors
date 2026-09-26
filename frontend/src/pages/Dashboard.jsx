import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { StatCard, Card, EmptyState, money } from '../components/ui'
import { useCountUp } from '../components/useCountUp'
import { useAuth } from '../context/AuthContext'
import PageLoader from '../components/PageLoader'

const DashboardTrends = lazy(() => import('../components/DashboardTrends'))

function AnimatedStat({ label, value, icon, tone, delay, format }) {
  const animated = useCountUp(value)
  return (
    <StatCard
      label={label}
      value={format ? format(animated) : Math.round(animated).toLocaleString()}
      icon={icon}
      tone={tone}
      delay={delay}
    />
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [customers, setCustomers] = useState([])
  const [staff, setStaff] = useState([])
  const [error, setError] = useState('')
  const canViewStaff = ['owner', 'manager'].includes(user?.role)

  useEffect(() => {
    client
      .get('/reports/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load dashboard stats'))
  }, [])

  useEffect(() => {
    client.get('/customers').then((res) => setCustomers(res.data.slice(0, 6))).catch(() => {})
    if (canViewStaff) {
      client.get('/users').then((res) => setStaff(res.data.slice(0, 6))).catch(() => {})
    }
  }, [canViewStaff])

  if (error) return <p className="text-rose-600">{error}</p>
  if (!stats) return <PageLoader label="Loading dashboard" />

  return (
    <div className="space-y-6">
      <div className="animate-fadeInUp">
        <h2 className="font-display text-3xl font-bold text-ink-900">Dashboard</h2>
        <p className="text-sm text-ink-600/60">Overview of your showroom's performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStat label="Total Cars" value={stats.total_cars} icon="🚗" tone="brand" delay={0} />
        <AnimatedStat label="Available" value={stats.available_cars} icon="✅" tone="green" delay={60} />
        <AnimatedStat label="Reserved" value={stats.reserved_cars} icon="⏳" tone="amber" delay={120} />
        <AnimatedStat label="Sold" value={stats.sold_cars} icon="🏁" tone="red" delay={180} />
      </div>

      <Suspense fallback={<PageLoader label="Loading performance charts" />}>
        <DashboardTrends />
      </Suspense>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStat label="Total Customers" value={stats.total_customers} icon="👥" tone="brand" delay={0} />
        <AnimatedStat label="Total Sales" value={stats.total_sales} icon="💰" tone="green" delay={60} />
        <AnimatedStat label="Total Revenue" value={stats.total_revenue} icon="📈" tone="brand" delay={120} format={money} />
        <AnimatedStat label="Total Profit" value={stats.total_profit} icon="💎" tone="green" delay={180} format={money} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStat label="Cash In" value={stats.cash_in} icon="⬆️" tone="green" delay={0} format={money} />
        <AnimatedStat label="Cash Out" value={stats.cash_out} icon="⬇️" tone="red" delay={60} format={money} />
        <AnimatedStat label="Total Expenses" value={stats.total_expenses} icon="🧾" tone="amber" delay={120} format={money} />
        <AnimatedStat label="Cash Balance" value={stats.net_balance} icon="🏦" tone="brand" delay={180} format={money} />
      </div>

      <Card sheen className="p-5 animate-fadeInUp">
        <h3 className="font-display text-lg font-semibold text-ink-900 mb-3">Installments</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-ink-600/60">Pending Plans</p>
            <p className="text-lg font-bold text-ink-900">{stats.pending_installments}</p>
          </div>
          <div>
            <p className="text-xs text-ink-600/60">Outstanding Amount</p>
            <p className="text-lg font-bold text-ink-900">{money(stats.outstanding_amount)}</p>
          </div>
        </div>
      </Card>

      <div className={`grid grid-cols-1 ${canViewStaff ? 'lg:grid-cols-2' : ''} gap-5`}>
        <Card sheen className="p-5 animate-fadeInUp">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink-900">Recent customers</h3>
              <p className="text-xs text-ink-600/60">Select a customer to view their full profile</p>
            </div>
            <button onClick={() => navigate('/customers')} className="text-xs font-semibold text-brand-700 hover:underline">All customers</button>
          </div>
          {customers.length ? (
            <div className="divide-y divide-ink-900/5">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-brand-50/50 px-2 rounded-md transition"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink-900">{customer.name}</span>
                    <span className="block truncate text-xs text-ink-600/60">{customer.phone || customer.email || customer.branch}</span>
                  </span>
                  <span className="shrink-0 text-xs text-ink-600/60">{customer.cars_purchased} purchases</span>
                </button>
              ))}
            </div>
          ) : <EmptyState text="No customers to show." />}
        </Card>

        {canViewStaff && (
          <Card sheen className="p-5 animate-fadeInUp">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink-900">Staff users</h3>
                <p className="text-xs text-ink-600/60">Select a staff member to view their profile and sales</p>
              </div>
              <button onClick={() => navigate('/users')} className="text-xs font-semibold text-brand-700 hover:underline">All staff</button>
            </div>
            {staff.length ? (
              <div className="divide-y divide-ink-900/5">
                {staff.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => navigate(`/users/${member.id}`)}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-brand-50/50 px-2 rounded-md transition"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">{member.name}</span>
                      <span className="block truncate text-xs text-ink-600/60">{member.email}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-xs capitalize text-ink-600/70">{member.role}</span>
                      <span className="block text-[11px] text-ink-600/50">{member.branch}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : <EmptyState text="No staff users to show." />}
          </Card>
        )}
      </div>

      <Card sheen className="p-5 animate-fadeInUp">
        <h3 className="font-display text-lg font-semibold text-ink-900 mb-3">Customer Accounts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-ink-600/60">Due to showroom</p>
            <p className="text-lg font-bold text-emerald-700">{money(stats.accounts_receivable)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-600/60">Due from showroom</p>
            <p className="text-lg font-bold text-rose-600">{money(stats.accounts_payable)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-600/60">Overdue accounts</p>
            <p className="text-lg font-bold text-ink-900">{stats.overdue_accounts}</p>
          </div>
          <div>
            <p className="text-xs text-ink-600/60">Estimated net position</p>
            <p className="text-lg font-bold text-ink-900">{money(stats.net_position)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-600/50">Cash balance + customer receivables + unpaid installments − showroom payables. Account entries change this estimate; only recorded payments change cash.</p>
      </Card>
    </div>
  )
}
