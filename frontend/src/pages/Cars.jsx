import { useEffect, useState } from 'react'
import client from '../api/client'
import { Card, Button, Input, Select, Modal, Badge, EmptyState, money } from '../components/ui'

const EMPTY = {
  name: '', brand: '', model: '', year: '', registration_number: '',
  chassis_number: '', engine_number: '', color: '', purchase_price: '', sale_price: '', status: 'available',
}

const STATUS_TONE = { available: 'green', reserved: 'amber', sold: 'red' }

export default function Cars() {
  const [cars, setCars] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  function load() {
    const params = {}
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    client.get('/cars', { params }).then((res) => setCars(res.data))
  }

  useEffect(() => { load() }, [search, statusFilter])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setModalOpen(true)
  }

  function openEdit(car) {
    setEditing(car)
    setForm({ ...car })
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const payload = { ...form, purchase_price: Number(form.purchase_price) || 0, sale_price: Number(form.sale_price) || 0 }
    try {
      if (editing) {
        await client.put(`/cars/${editing.id}`, payload)
      } else {
        await client.post('/cars', payload)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this car?')) return
    await client.delete(`/cars/${id}`)
    load()
  }

  async function handleStatus(id, status) {
    await client.patch(`/cars/${id}/status`, { status })
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold text-ink-900 animate-fadeInUp">Cars</h2>
          <p className="text-sm text-ink-600/60">Manage your showroom inventory</p>
        </div>
        <Button onClick={openCreate}>+ Add Car</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search by name, brand, reg #…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </Select>
      </div>

      <Card sheen className="overflow-x-auto animate-fadeInUp">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/60 text-left text-ink-600/70 uppercase text-[11px] tracking-wide">
            <tr>
              <th className="px-4 py-3">Car</th>
              <th className="px-4 py-3">Reg #</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Purchase</th>
              <th className="px-4 py-3">Sale Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cars.map((c) => (
              <tr key={c.id} className="border-t border-ink-900/5 hover:bg-brand-50/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{c.name}</p>
                  <p className="text-xs text-ink-600/40">{c.brand} {c.model} · {c.color}</p>
                </td>
                <td className="px-4 py-3 text-ink-600/70">{c.registration_number || '—'}</td>
                <td className="px-4 py-3 text-ink-600/70">{c.year || '—'}</td>
                <td className="px-4 py-3 text-ink-600/70">{money(c.purchase_price)}</td>
                <td className="px-4 py-3 text-ink-600/70">{money(c.sale_price)}</td>
                <td className="px-4 py-3">
                  <select
                    value={c.status}
                    onChange={(e) => handleStatus(c.id, e.target.value)}
                    className="text-xs border-0 bg-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                  <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => openEdit(c)} className="text-brand-700 text-xs font-semibold hover:underline">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-rose-500 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cars.length === 0 && <EmptyState text="No cars found." />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Car' : 'Add Car'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Name / Title" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            <Input label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <Input label="Registration Number" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Chassis Number" value={form.chassis_number} onChange={(e) => setForm({ ...form, chassis_number: e.target.value })} />
            <Input label="Engine Number" value={form.engine_number} onChange={(e) => setForm({ ...form, engine_number: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Purchase Price" type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} />
            <Input label="Asking Sale Price" type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} />
          </div>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </Select>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full">{editing ? 'Save Changes' : 'Add Car'}</Button>
        </form>
      </Modal>
    </div>
  )
}
