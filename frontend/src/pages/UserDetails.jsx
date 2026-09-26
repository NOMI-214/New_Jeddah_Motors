import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import client from '../api/client'
import { Badge, Button, Card, money } from '../components/ui'
import PageLoader from '../components/PageLoader'

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-600/60">{label}</p>
      <p className="text-sm font-medium text-ink-900 break-words">{value || '—'}</p>
    </div>
  )
}

export default function UserDetails() {
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [sales, setSales] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([client.get(`/users/${userId}`), client.get('/sales')])
      .then(([userRes, salesRes]) => {
        setUser(userRes.data)
        setSales(salesRes.data.filter((sale) => sale.salesperson_id === Number(userId)))
      })
      .catch((err) => setError(err.response?.data?.detail || 'Could not load staff details'))
  }, [userId])

  if (error) return <p className="text-rose-600">{error}</p>
  if (!user) return <PageLoader label="Loading staff profile" />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-ink-600/50"><Link to="/dashboard" className="hover:text-brand-700">Dashboard</Link> / Staff</p>
          <h2 className="font-display text-3xl font-bold text-ink-900">{user.name}</h2>
          <p className="text-sm text-ink-600/60">Staff profile and performance</p>
        </div>
        <Button variant="secondary" onClick={() => window.history.back()}>Back</Button>
      </div>

      <Card sheen className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <h3 className="font-display text-lg font-semibold text-ink-900">Profile details</h3>
          <Badge tone={user.status === 'active' ? 'green' : 'red'}>{user.status}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Detail label="Email" value={user.email} />
          <Detail label="Phone" value={user.phone} />
          <Detail label="Role" value={user.role} />
          <Detail label="Branch" value={user.branch} />
          <Detail label="Address" value={user.address} />
          <Detail label="Joined" value={user.join_date} />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs text-ink-600/60">Cars sold</p><p className="text-xl font-bold text-ink-900">{user.cars_sold}</p></Card>
        <Card className="p-4"><p className="text-xs text-ink-600/60">Revenue generated</p><p className="text-xl font-bold text-emerald-700">{money(user.revenue_generated)}</p></Card>
        <Card className="p-4"><p className="text-xs text-ink-600/60">Recorded sales</p><p className="text-xl font-bold text-ink-900">{sales.length}</p></Card>
      </div>

      <Card sheen className="overflow-x-auto">
        <div className="px-5 pt-5"><h3 className="font-display text-lg font-semibold text-ink-900">Sales handled</h3></div>
        <table className="w-full text-sm">
          <thead className="text-left text-ink-600/60 uppercase text-[11px]"><tr><th className="px-5 py-3">Vehicle</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Sale price</th></tr></thead>
          <tbody>{sales.map((sale) => <tr key={sale.id} className="border-t border-ink-900/5"><td className="px-5 py-3 font-medium">{sale.car_name || 'Vehicle'}</td><td className="px-5 py-3">{sale.customer_name || '—'}</td><td className="px-5 py-3">{new Date(sale.date).toLocaleDateString()}</td><td className="px-5 py-3">{money(sale.sale_price)}</td></tr>)}</tbody>
        </table>
        {sales.length === 0 && <p className="px-5 py-5 text-sm text-ink-600/50">No sales recorded for this staff member.</p>}
      </Card>
    </div>
  )
}
