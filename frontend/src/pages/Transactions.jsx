import { useEffect, useState } from 'react'
import client from '../api/client'
import { Card, Button, Input, Select, Modal, Badge, EmptyState, money } from '../components/ui'

const EMPTY = { type: 'cashIn', amount: '', party: '', category: '', notes: '' }

export default function Transactions() {
  const [txns, setTxns] = useState([])
  const [filter, setFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  function load() {
    client.get('/transactions', { params: filter ? { type: filter } : {} }).then((res) => setTxns(res.data))
  }

  useEffect(() => { load() }, [filter])

  function openCreate() {
    setForm(EMPTY)
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await client.post('/transactions', { ...form, amount: Number(form.amount) })
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this transaction?')) return
    await client.delete(`/transactions/${id}`)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-ink-900 animate-fadeInUp">Transactions</h2>
          <p className="text-sm text-ink-600/60">Cash in / cash out ledger</p>
        </div>
        <Button onClick={openCreate}>+ Add Transaction</Button>
      </div>

      <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-[180px]">
        <option value="">All types</option>
        <option value="cashIn">Cash In</option>
        <option value="cashOut">Cash Out</option>
      </Select>

      <Card sheen className="overflow-x-auto animate-fadeInUp">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/60 text-left text-ink-600/70 uppercase text-[11px] tracking-wide">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Recorded By</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t.id} className="border-t border-ink-900/5 hover:bg-brand-50/30 transition-colors">
                <td className="px-4 py-3">
                  <Badge tone={t.type === 'cashIn' ? 'green' : 'red'}>{t.type === 'cashIn' ? 'Cash In' : 'Cash Out'}</Badge>
                </td>
                <td className="px-4 py-3 font-medium text-ink-900">{money(t.amount)}</td>
                <td className="px-4 py-3 text-ink-600/70">{t.party || '—'}</td>
                <td className="px-4 py-3 text-ink-600/70">{t.category || '—'}</td>
                <td className="px-4 py-3 text-ink-600/70">{t.creator_name}</td>
                <td className="px-4 py-3 text-ink-600/50 text-xs">{new Date(t.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(t.id)} className="text-rose-500 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {txns.length === 0 && <EmptyState text="No transactions recorded." />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Transaction">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="cashIn">Cash In</option>
            <option value="cashOut">Cash Out</option>
          </Select>
          <Input label="Amount" type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input label="Party" value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full">Save Transaction</Button>
        </form>
      </Modal>
    </div>
  )
}
