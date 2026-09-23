import { useEffect, useState } from 'react'
import client from '../api/client'
import { Card, Button, Input, Select, Modal, Badge, EmptyState, money } from '../components/ui'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [cars, setCars] = useState([])
  const [customers, setCustomers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState('')

  const [carId, setCarId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [paymentType, setPaymentType] = useState('cash')
  const [notes, setNotes] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [monthlyAmount, setMonthlyAmount] = useState('')
  const [nextDueDate, setNextDueDate] = useState('')

  function load() {
    client.get('/sales').then((res) => setSales(res.data))
  }

  function loadOptions() {
    client.get('/cars', { params: { status: 'available' } }).then((res) => setCars(res.data))
    client.get('/customers').then((res) => setCustomers(res.data))
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setError('')
    setCarId(''); setCustomerId(''); setSalePrice(''); setPaymentType('cash')
    setNotes(''); setDownPayment(''); setMonthlyAmount(''); setNextDueDate('')
    loadOptions()
    setModalOpen(true)
  }

  function handleCarChange(id) {
    setCarId(id)
    const car = cars.find((c) => String(c.id) === String(id))
    if (car) setSalePrice(car.sale_price || '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const payload = {
      car_id: Number(carId),
      customer_id: Number(customerId),
      sale_price: Number(salePrice),
      payment_type: paymentType,
      notes,
    }
    if (paymentType === 'installment') {
      payload.installment_data = {
        down_payment: Number(downPayment) || 0,
        monthly_amount: Number(monthlyAmount) || 0,
        next_due_date: nextDueDate || null,
      }
    }
    try {
      await client.post('/sales', payload)
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold text-ink-900 animate-fadeInUp">Sales</h2>
          <p className="text-sm text-ink-600/60">Record and track car sales</p>
        </div>
        <Button onClick={openCreate}>+ New Sale</Button>
      </div>

      <Card sheen className="overflow-x-auto animate-fadeInUp">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/60 text-left text-ink-600/70 uppercase text-[11px] tracking-wide">
            <tr>
              <th className="px-4 py-3">Car</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Sale Price</th>
              <th className="px-4 py-3">Profit</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Salesperson</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-ink-900/5 hover:bg-brand-50/30 transition-colors">
                <td className="px-4 py-3 font-medium text-ink-900">{s.car_name}</td>
                <td className="px-4 py-3 text-ink-600/70">{s.customer_name}</td>
                <td className="px-4 py-3 text-ink-600/70">{money(s.sale_price)}</td>
                <td className={`px-4 py-3 font-medium ${s.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{money(s.profit)}</td>
                <td className="px-4 py-3"><Badge tone="blue">{s.payment_type}</Badge></td>
                <td className="px-4 py-3 text-ink-600/70">{s.salesperson_name}</td>
                <td className="px-4 py-3 text-ink-600/50 text-xs">{new Date(s.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && <EmptyState text="No sales recorded yet." />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record New Sale">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select label="Car" required value={carId} onChange={(e) => handleCarChange(e.target.value)}>
            <option value="">Select an available car</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {money(c.sale_price)}</option>
            ))}
          </Select>
          <Select label="Customer" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
            ))}
          </Select>
          <Input label="Sale Price" type="number" required value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
          <Select label="Payment Type" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
            <option value="installment">Installment</option>
          </Select>

          {paymentType === 'installment' && (
            <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Down Payment" type="number" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} />
                <Input label="Monthly Amount" type="number" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} />
              </div>
              <Input label="Next Due Date" type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
            </div>
          )}

          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full">Record Sale</Button>
        </form>
      </Modal>
    </div>
  )
}
