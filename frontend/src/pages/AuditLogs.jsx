import { useEffect, useState } from 'react'
import client from '../api/client'
import { Card, Badge, EmptyState } from '../components/ui'

const TYPE_TONE = { create: 'green', update: 'blue', delete: 'red', auth: 'amber', view: 'slate' }

export default function AuditLogs() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    client.get('/audit-logs').then((res) => setLogs(res.data))
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-3xl font-bold text-ink-900 animate-fadeInUp">Audit Logs</h2>
        <p className="text-sm text-ink-600/60">A record of actions taken across the system</p>
      </div>

      <Card sheen className="overflow-x-auto animate-fadeInUp">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/60 text-left text-ink-600/70 uppercase text-[11px] tracking-wide">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-ink-900/5 hover:bg-brand-50/30 transition-colors">
                <td className="px-4 py-3 font-medium text-ink-900">{l.user_name}</td>
                <td className="px-4 py-3 capitalize text-ink-600/70">{l.module}</td>
                <td className="px-4 py-3"><Badge tone={TYPE_TONE[l.type] || 'slate'}>{l.type}</Badge></td>
                <td className="px-4 py-3 text-ink-600/70">{l.description}</td>
                <td className="px-4 py-3 text-ink-600/50 text-xs">{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <EmptyState text="No activity recorded yet." />}
      </Card>
    </div>
  )
}
