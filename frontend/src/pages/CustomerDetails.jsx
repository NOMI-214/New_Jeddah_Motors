import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import client from '../api/client'
import { Badge, Button, Card, money } from '../components/ui'

const STATUS_TONE = { unpaid: 'red', partially_paid: 'amber', paid: 'green', overdue: 'red' }

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-600/60">{label}</p>
      <p className="text-sm font-medium text-ink-900 break-words">{value || '—'}</p>
    </div>
  )
}

export default function CustomerDetails() {
  const { customerId } = useParams()
  const [customer, setCustomer] = useState(null)
  const [sales, setSales] = useState([])
  const [installments, setInstallments] = useState([])
  const [accounts, setAccounts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      client.get(`/customers/${customerId}`),
      client.get('/sales'),
      client.get('/installments'),
      client.get(`/customer-accounts/customer/${customerId}`),
    ])
      .then(([customerRes, salesRes, installmentRes, accountRes]) => {
        setCustomer(customerRes.data)
        setSales(salesRes.data.filter((sale) => sale.customer_id === Number(customerId)))
        setInstallments(installmentRes.data.filter((plan) => plan.customer_id === Number(customerId)))
        setAccounts(accountRes.data)
      })
      .catch((err) => setError(err.response?.data?.detail || 'Could not load customer details'))
  }, [customerId])

  if (error) return <p className="text-rose-600">{error}</p>
  if (!customer) return <p className="text-ink-600/50 animate-pulse">Loading customer…</p>

  const receivable = accounts.filter((account) => account.direction === 'receivable').reduce((sum, account) => sum + account.remaining_amount, 0)
  const payable = accounts.filter((account) => account.direction === 'payable').reduce((sum, account) => sum + account.remaining_amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-ink-600/50"><Link to="/customers" className="hover:text-brand-700">Customers</Link> / Profile</p>
          <h2 className="font-display text-3xl font-bold text-ink-900">{customer.name}</h2>
          <p className="text-sm text-ink-600/60">Customer profile and account history</p>
        </div>
        <Button variant="secondary" onClick={() => window.history.back()}>Back</Button>
      </div>

      <Card sheen className="p-5">
        <h3 className="font-display text-lg font-semibold text-ink-900 mb-4">Contact details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Detail label="Phone" value={customer.phone} />
          <Detail label="Email" value={customer.email} />
          <Detail label="CNIC" value={customer.cnic} />
          <Detail label="Branch" value={customer.branch} />
          <Detail label="Address" value={customer.address} />
          <Detail label="Customer since" value={new Date(customer.created_at).toLocaleDateString()} />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xs text-ink-600/60">Cars purchased</p><p className="text-xl font-bold text-ink-900">{customer.cars_purchased}</p></Card>
        <Card className="p-4"><p className="text-xs text-ink-600/60">Customer owes showroom</p><p className="text-xl font-bold text-emerald-700">{money(receivable)}</p></Card>
        <Card className="p-4"><p className="text-xs text-ink-600/60">Showroom owes customer</p><p className="text-xl font-bold text-rose-600">{money(payable)}</p></Card>
      </div>

      <Card sheen className="overflow-x-auto">
        <div className="px-5 pt-5"><h3 className="font-display text-lg font-semibold text-ink-900">Purchases</h3></div>
        <table className="w-full text-sm">
          <thead className="text-left text-ink-600/60 uppercase text-[11px]"><tr><th className="px-5 py-3">Vehicle</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Sale price</th></tr></thead>
          <tbody>{sales.map((sale) => <tr key={sale.id} className="border-t border-ink-900/5"><td className="px-5 py-3 font-medium">{sale.car_name || 'Vehicle'}</td><td className="px-5 py-3">{new Date(sale.date).toLocaleDateString()}</td><td className="px-5 py-3 capitalize">{sale.payment_type.replace('_', ' ')}</td><td className="px-5 py-3">{money(sale.sale_price)}</td></tr>)}</tbody>
        </table>
        {sales.length === 0 && <p className="px-5 py-5 text-sm text-ink-600/50">No purchases recorded.</p>}
      </Card>

      <Card sheen className="overflow-x-auto">
        <div className="px-5 pt-5"><h3 className="font-display text-lg font-semibold text-ink-900">Installment plans</h3></div>
        <table className="w-full text-sm">
          <thead className="text-left text-ink-600/60 uppercase text-[11px]"><tr><th className="px-5 py-3">Vehicle</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Paid</th><th className="px-5 py-3">Remaining</th><th className="px-5 py-3">Status</th></tr></thead>
          <tbody>{installments.map((plan) => <tr key={plan.id} className="border-t border-ink-900/5"><td className="px-5 py-3 font-medium">{plan.car_name || 'Vehicle'}</td><td className="px-5 py-3">{money(plan.total_amount)}</td><td className="px-5 py-3">{money(plan.paid_amount)}</td><td className="px-5 py-3">{money(plan.remaining_amount)}</td><td className="px-5 py-3"><Badge tone={plan.status === 'completed' ? 'green' : plan.status === 'overdue' ? 'red' : 'amber'}>{plan.status}</Badge></td></tr>)}</tbody>
        </table>
        {installments.length === 0 && <p className="px-5 py-5 text-sm text-ink-600/50">No installment plans recorded.</p>}
      </Card>

      <Card sheen className="overflow-x-auto">
        <div className="px-5 pt-5"><h3 className="font-display text-lg font-semibold text-ink-900">Customer Accounts</h3></div>
        <table className="w-full text-sm">
          <thead className="text-left text-ink-600/60 uppercase text-[11px]"><tr><th className="px-5 py-3">Direction</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Remaining</th><th className="px-5 py-3">Status</th></tr></thead>
          <tbody>{accounts.map((account) => <tr key={account.id} className="border-t border-ink-900/5"><td className="px-5 py-3">{account.direction === 'receivable' ? 'Customer owes' : 'Showroom owes'}</td><td className="px-5 py-3">{account.description || '—'}</td><td className="px-5 py-3">{money(account.amount)}</td><td className="px-5 py-3">{money(account.remaining_amount)}</td><td className="px-5 py-3"><Badge tone={STATUS_TONE[account.status]}>{account.status.replace('_', ' ')}</Badge></td></tr>)}</tbody>
        </table>
        {accounts.length === 0 && <p className="px-5 py-5 text-sm text-ink-600/50">No customer accounts recorded.</p>}
      </Card>
    </div>
  )
}
