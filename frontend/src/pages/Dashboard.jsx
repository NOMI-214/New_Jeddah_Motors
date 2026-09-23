import { useEffect, useState } from 'react'
import client from '../api/client'
import { StatCard, Card, money } from '../components/ui'
import { useCountUp } from '../components/useCountUp'

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
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/reports/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load dashboard stats'))
  }, [])

  if (error) return <p className="text-rose-600">{error}</p>
  if (!stats) return <p className="text-ink-600/50 animate-pulse">Loading dashboard…</p>

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
        <AnimatedStat label="Net Balance" value={stats.net_balance} icon="🏦" tone="brand" delay={180} format={money} />
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
    </div>
  )
}
