import { useEffect, useState } from 'react'
import client from '../api/client'
import { Card, Button, Input, Modal, EmptyState, money } from '../components/ui'

const EMPTY = { name: '', phone: '', cnic: '', email: '', address: '' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  function load() {
    client.get('/customers', { params: search ? { search } : {} }).then((res) => setCustomers(res.data))
  }

  useEffect(() => { load() }, [search])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setModalOpen(true)
  }

  function openEdit(c) {
    setEditing(c)
    setForm({ name: c.name, phone: c.phone, cnic: c.cnic, email: c.email, address: c.address })
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await client.put(`/customers/${editing.id}`, form)
      } else {
        await client.post('/customers', form)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this customer?')) return
    await client.delete(`/customers/${id}`)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold text-ink-900 animate-fadeInUp">Customers</h2>
          <p className="text-sm text-ink-600/60">Manage customer records</p>
        </div>
        <Button onClick={openCreate}>+ Add Customer</Button>
      </div>

      <Input placeholder="Search by name, phone, CNIC…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />

      <Card sheen className="overflow-x-auto animate-fadeInUp">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/60 text-left text-ink-600/70 uppercase text-[11px] tracking-wide">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">CNIC</th>
              <th className="px-4 py-3">Cars Purchased</th>
              <th className="px-4 py-3">Outstanding</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-ink-900/5 hover:bg-brand-50/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{c.name}</p>
                  <p className="text-xs text-ink-600/40">{c.email}</p>
                </td>
                <td className="px-4 py-3 text-ink-600/70">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-ink-600/70">{c.cnic || '—'}</td>
                <td className="px-4 py-3 text-ink-600/70">{c.cars_purchased}</td>
                <td className="px-4 py-3 text-ink-600/70">{money(c.outstanding_amount)}</td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => openEdit(c)} className="text-brand-700 text-xs font-semibold hover:underline">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-rose-500 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <EmptyState text="No customers found." />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="CNIC" value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full">{editing ? 'Save Changes' : 'Add Customer'}</Button>
        </form>
      </Modal>
    </div>
  )
}
