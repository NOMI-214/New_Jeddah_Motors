import { Fragment, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import client from '../api/client'
import { Badge, Button, Card, EmptyState, Input, Modal, Select, money } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const EMPTY_ACCOUNT = {
  customer_id: '',
  direction: 'receivable',
  amount: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  due_date: '',
  payment_method: 'cash',
}

const EMPTY_PAYMENT = { amount: '', payment_method: 'cash', payment_date: new Date().toISOString().slice(0, 10), notes: '' }
const STATUS_TONE = { unpaid: 'red', partially_paid: 'amber', paid: 'green', overdue: 'red' }

function toDateTime(value) {
  return value ? new Date(`${value}T12:00:00`).toISOString() : null
}

export default function CustomerAccounts() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const canManage = ['owner', 'manager'].includes(user?.role)
  const selectedCustomerId = searchParams.get('customer_id') || ''
  const [accounts, setAccounts] = useState([])
  const [customers, setCustomers] = useState([])
  const [expandedAccountId, setExpandedAccountId] = useState(null)
  const [accountModal, setAccountModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [activeAccount, setActiveAccount] = useState(null)
  const [accountForm, setAccountForm] = useState({ ...EMPTY_ACCOUNT, customer_id: selectedCustomerId })
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT)
  const [error, setError] = useState('')

  function load() {
    const params = selectedCustomerId ? { customer_id: selectedCustomerId } : {}
    client.get('/customer-accounts', { params }).then((res) => setAccounts(res.data))
  }

  useEffect(() => {
    client.get('/customers').then((res) => setCustomers(res.data))
    load()
  }, [selectedCustomerId])

  function openCreate() {
    setError('')
    setAccountForm({ ...EMPTY_ACCOUNT, customer_id: selectedCustomerId || customers[0]?.id || '' })
    setAccountModal(true)
  }

  function openPayment(account) {
    setError('')
    setActiveAccount(account)
    setPaymentForm({ ...EMPTY_PAYMENT, amount: '', payment_date: new Date().toISOString().slice(0, 10) })
    setPaymentModal(true)
  }

  async function saveAccount(event) {
    event.preventDefault()
    setError('')
    try {
      await client.post('/customer-accounts', {
        ...accountForm,
        customer_id: Number(accountForm.customer_id),
        amount: Number(accountForm.amount),
        date: toDateTime(accountForm.date),
        due_date: toDateTime(accountForm.due_date),
      })
      setAccountModal(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save account')
    }
  }

  async function savePayment(event) {
    event.preventDefault()
    setError('')
    try {
      await client.post(`/customer-accounts/${activeAccount.id}/payments`, {
        ...paymentForm,
        amount: Number(paymentForm.amount),
        payment_date: toDateTime(paymentForm.payment_date),
      })
      setPaymentModal(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not record payment')
    }
  }

  async function deleteAccount(id) {
    if (!confirm('Delete this customer account record?')) return
    try {
      await client.delete(`/customer-accounts/${id}`)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete account')
    }
  }

  const receivable = accounts.filter((account) => account.direction === 'receivable').reduce((sum, account) => sum + account.remaining_amount, 0)
  const payable = accounts.filter((account) => account.direction === 'payable').reduce((sum, account) => sum + account.remaining_amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold text-ink-900 animate-fadeInUp">Customer Accounts</h2>
          <p className="text-sm text-ink-600/60">Track what customers owe and what the showroom owes them</p>
        </div>
        {canManage && <Button onClick={openCreate}>+ Add Account</Button>}
      </div>

      <div className="border-l-4 border-brand-400 bg-brand-50/70 px-4 py-3 text-sm text-ink-700">
        Account balances are amounts still owed, not cash on hand. Recording a payment updates the balance and automatically posts the cash movement to Transactions.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs text-ink-600/70">Due to showroom</p>
          <p className="text-xl font-bold text-emerald-700">{money(receivable)}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-rose-400">
          <p className="text-xs text-ink-600/70">Due from showroom</p>
          <p className="text-xl font-bold text-rose-600">{money(payable)}</p>
        </Card>
      </div>

      <Card sheen className="overflow-x-auto animate-fadeInUp">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/60 text-left text-ink-600/70 uppercase text-[11px] tracking-wide">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Direction</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Original</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Remaining</th>
              <th className="px-4 py-3">Due date</th>
              <th className="px-4 py-3">Status</th>
              {canManage && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <Fragment key={account.id}>
              <tr key={account.id} className="border-t border-ink-900/5 hover:bg-brand-50/30 transition-colors">
                <td className="px-4 py-3 font-medium text-ink-900">{account.customer_name}</td>
                <td className={`px-4 py-3 text-xs font-semibold ${account.direction === 'receivable' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {account.direction === 'receivable' ? 'Customer owes' : 'Showroom owes'}
                </td>
                <td className="px-4 py-3 text-ink-600/70">{account.description || '—'}</td>
                <td className="px-4 py-3 text-ink-600/70">{money(account.amount)}</td>
                <td className="px-4 py-3 text-ink-600/70">{money(account.paid_amount)}</td>
                <td className="px-4 py-3 font-semibold text-ink-900">{money(account.remaining_amount)}</td>
                <td className="px-4 py-3 text-xs text-ink-600/60">{account.due_date ? new Date(account.due_date).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3"><Badge tone={STATUS_TONE[account.status]}>{account.status.replace('_', ' ')}</Badge></td>
                {canManage && (
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                    {account.remaining_amount > 0 && <button onClick={() => openPayment(account)} className="text-brand-700 text-xs font-semibold hover:underline">Record payment</button>}
                    <button onClick={() => setExpandedAccountId(expandedAccountId === account.id ? null : account.id)} className="text-ink-600 text-xs font-medium hover:underline">{expandedAccountId === account.id ? 'Hide history' : `History (${account.payments.length})`}</button>
                    <button onClick={() => deleteAccount(account.id)} className="text-rose-500 text-xs font-medium">Archive</button>
                  </td>
                )}
              </tr>
              {expandedAccountId === account.id && (
                <tr className="border-t border-ink-900/5 bg-ink-900/[0.02]">
                  <td colSpan={canManage ? 9 : 8} className="px-5 py-4">
                    <div className="space-y-3">
                      <p className="text-xs text-ink-600/60">Account #{account.id} created {new Date(account.date).toLocaleString()} by {account.created_by_name || 'unknown user'}</p>
                      {account.payments.length ? (
                        <div className="divide-y divide-ink-900/10">
                          {account.payments.map((payment) => (
                            <div key={payment.id} className="grid grid-cols-1 gap-1 py-3 text-sm sm:grid-cols-5 sm:items-start sm:gap-3">
                              <span className="font-semibold text-ink-900">Payment #{payment.id}: {money(payment.amount)}</span>
                              <span className="text-ink-600/70">{new Date(payment.payment_date).toLocaleString()}</span>
                              <span className="capitalize text-ink-600/70">{payment.payment_method.replace('_', ' ')}</span>
                              <span className="text-ink-600/70">Recorded by {payment.recorded_by_name || 'unknown user'}</span>
                              <span className="text-ink-600/70">{payment.notes || 'No notes'}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-ink-600/60">No payments recorded yet.</p>}
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {accounts.length === 0 && <EmptyState text="No customer account records found." />}
      </Card>

      <Modal open={accountModal} onClose={() => setAccountModal(false)} title="Add Customer Account">
        <form onSubmit={saveAccount} className="space-y-3">
          <Select label="Customer" required value={accountForm.customer_id} onChange={(e) => setAccountForm({ ...accountForm, customer_id: e.target.value })}>
            <option value="">Select a customer</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </Select>
          <Select label="Account direction" value={accountForm.direction} onChange={(e) => setAccountForm({ ...accountForm, direction: e.target.value })}>
            <option value="receivable">Customer owes showroom</option>
            <option value="payable">Showroom owes customer</option>
          </Select>
          <Input label="Original amount" type="number" min="0.01" step="0.01" required value={accountForm.amount} onChange={(e) => setAccountForm({ ...accountForm, amount: e.target.value })} />
          <Input label="Description / reason" required value={accountForm.description} onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Date" type="date" required value={accountForm.date} onChange={(e) => setAccountForm({ ...accountForm, date: e.target.value })} />
            <Input label="Due date" type="date" value={accountForm.due_date} onChange={(e) => setAccountForm({ ...accountForm, due_date: e.target.value })} />
          </div>
          <Select label="Preferred payment method" value={accountForm.payment_method} onChange={(e) => setAccountForm({ ...accountForm, payment_method: e.target.value })}>
            <option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="cheque">Cheque</option><option value="other">Other</option>
          </Select>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full">Save Account</Button>
        </form>
      </Modal>

      <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Record Account Payment">
        <form onSubmit={savePayment} className="space-y-3">
          <p className="text-sm text-ink-600/70">Remaining balance: <strong>{money(activeAccount?.remaining_amount)}</strong></p>
          <Input label="Payment amount" type="number" min="0.01" step="0.01" max={activeAccount?.remaining_amount} required value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
          <Select label="Payment method" value={paymentForm.payment_method} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}>
            <option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="cheque">Cheque</option><option value="other">Other</option>
          </Select>
          <Input label="Payment date" type="date" required value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
          <Input label="Notes" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full">Record Payment</Button>
        </form>
      </Modal>
    </div>
  )
}
