import { useEffect, useState } from 'react'
import client from '../api/client'
import { Card, Button, Input, Modal, EmptyState, money } from '../components/ui'

const EMPTY = { category: '', amount: '', description: '' }

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  function load() {
    client.get('/expenses').then((res) => setExpenses(res.data))
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(EMPTY)
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await client.post('/expenses', { ...form, amount: Number(form.amount) })
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense?')) return
    await client.delete(`/expenses/${id}`)
    load()
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-ink-900 animate-fadeInUp">Expenses</h2>
          <p className="text-sm text-ink-600/60">Total recorded: {money(total)}</p>
        </div>
        <Button onClick={openCreate}>+ Add Expense</Button>
      </div>

      <Card sheen className="overflow-x-auto animate-fadeInUp">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/60 text-left text-ink-600/70 uppercase text-[11px] tracking-wide">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Recorded By</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-t border-ink-900/5 hover:bg-brand-50/30 transition-colors">
                <td className="px-4 py-3 font-medium text-ink-900">{e.category}</td>
                <td className="px-4 py-3 text-ink-600/70">{money(e.amount)}</td>
                <td className="px-4 py-3 text-ink-600/70">{e.description || '—'}</td>
                <td className="px-4 py-3 text-ink-600/70">{e.creator_name}</td>
                <td className="px-4 py-3 text-ink-600/50 text-xs">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(e.id)} className="text-rose-500 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <EmptyState text="No expenses recorded." />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Expense">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label="Amount" type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full">Save Expense</Button>
        </form>
      </Modal>
    </div>
  )
}
