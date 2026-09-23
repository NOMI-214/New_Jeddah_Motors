import { useEffect, useState } from 'react'
import client from '../api/client'
import { Card, Button, Input, Select, Modal, Badge, EmptyState, money } from '../components/ui'
import BranchSelect from '../components/BranchSelect'
import { useAuth } from '../context/AuthContext'

const EMPTY = { name: '', email: '', phone: '', password: '', role: 'salesperson', branch: '', address: '' }

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  function load() {
    client.get('/users').then((res) => setUsers(res.data))
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setModalOpen(true)
  }

  function openEdit(u) {
    setEditing(u)
    setForm({ name: u.name, email: u.email, phone: u.phone, password: '', role: u.role, branch: u.branch, address: u.address })
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await client.put(`/users/${editing.id}`, payload)
      } else {
        await client.post('/users', form)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    }
  }

  async function toggleStatus(u) {
    const status = u.status === 'active' ? 'inactive' : 'active'
    await client.patch(`/users/${u.id}/status`, { status })
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this user?')) return
    await client.delete(`/users/${id}`)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold text-ink-900 animate-fadeInUp">Users</h2>
          <p className="text-sm text-ink-600/60">Manage staff accounts and roles</p>
        </div>
        <Button onClick={openCreate}>+ Add User</Button>
      </div>

      <Card sheen className="overflow-x-auto animate-fadeInUp">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/60 text-left text-ink-600/70 uppercase text-[11px] tracking-wide">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Cars Sold</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-ink-900/5 hover:bg-brand-50/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{u.name}</p>
                  <p className="text-xs text-ink-600/40">{u.email}</p>
                </td>
                <td className="px-4 py-3 capitalize text-ink-600/70">{u.role}</td>
                <td className="px-4 py-3 text-ink-600/70">{u.branch}</td>
                <td className="px-4 py-3 text-ink-600/70">{u.cars_sold}</td>
                <td className="px-4 py-3 text-ink-600/70">{money(u.revenue_generated)}</td>
                <td className="px-4 py-3">
                  <Badge tone={u.status === 'active' ? 'green' : 'red'}>{u.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => openEdit(u)} className="text-brand-700 text-xs font-semibold hover:underline">Edit</button>
                  <button onClick={() => toggleStatus(u)} className="text-amber-600 text-xs font-medium">
                    {u.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  {me?.role === 'owner' && u.id !== me.id && (
                    <button onClick={() => handleDelete(u.id)} className="text-rose-500 text-xs font-medium">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <EmptyState text="No users found." />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" required disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input
            label={editing ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            required={!editing}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="accountant">Accountant</option>
            <option value="salesperson">Salesperson</option>
            <option value="admin">Admin</option>
          </Select>
          <BranchSelect value={form.branch} onChange={(v) => setForm({ ...form, branch: v })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full">{editing ? 'Save Changes' : 'Add User'}</Button>
        </form>
      </Modal>
    </div>
  )
}
