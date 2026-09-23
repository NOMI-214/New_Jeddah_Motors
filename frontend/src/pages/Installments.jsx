import { useEffect, useState } from 'react'
import client from '../api/client'
import { Card, Button, Input, Modal, Badge, EmptyState, money } from '../components/ui'

const STATUS_TONE = { current: 'blue', overdue: 'red', completed: 'green' }

export default function Installments() {
  const [installments, setInstallments] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [active, setActive] = useState(null)
  const [amount, setAmount] = useState('')
  const [nextDue, setNextDue] = useState('')
  const [error, setError] = useState('')

  function load() {
    client.get('/installments').then((res) => setInstallments(res.data))
  }

  useEffect(() => { load() }, [])

  function openPay(inst) {
    setActive(inst)
    setAmount('')
    setNextDue('')
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = { amount: Number(amount) }
      if (nextDue) payload.next_due_date = nextDue
      await client.post(`/installments/${active.id}/payments`, payload)
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-3xl font-bold text-ink-900 animate-fadeInUp">Installments</h2>
        <p className="text-sm text-ink-600/60">Track installment plans and collect payments</p>
      </div>

      <Card sheen className="overflow-x-auto animate-fadeInUp">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/60 text-left text-ink-600/70 uppercase text-[11px] tracking-wide">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Car</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Remaining</th>
              <th className="px-4 py-3">Next Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {installments.map((i) => (
              <tr key={i.id} className="border-t border-ink-900/5 hover:bg-brand-50/30 transition-colors">
                <td className="px-4 py-3 font-medium text-ink-900">{i.customer_name}</td>
                <td className="px-4 py-3 text-ink-600/70">{i.car_name}</td>
                <td className="px-4 py-3 text-ink-600/70">{money(i.total_amount)}</td>
                <td className="px-4 py-3 text-ink-600/70">{money(i.paid_amount)}</td>
                <td className="px-4 py-3 font-medium text-ink-900">{money(i.remaining_amount)}</td>
                <td className="px-4 py-3 text-ink-600/50 text-xs">
                  {i.next_due_date ? new Date(i.next_due_date).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3"><Badge tone={STATUS_TONE[i.status]}>{i.status}</Badge></td>
                <td className="px-4 py-3 text-right">
                  {i.status !== 'completed' && (
                    <button onClick={() => openPay(i)} className="text-brand-700 text-xs font-semibold hover:underline">Record Payment</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {installments.length === 0 && <EmptyState text="No installment plans yet." />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Record Payment — ${active?.customer_name || ''}`}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm text-ink-600/60">Remaining: {money(active?.remaining_amount)}</p>
          <Input label="Payment Amount" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input label="Next Due Date (optional)" type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full">Record Payment</Button>
        </form>
      </Modal>
    </div>
  )
}
