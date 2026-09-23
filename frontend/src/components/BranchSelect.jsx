import { useState } from 'react'
import { Select, Input } from './ui'

const PRESET_BRANCHES = ['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Multan', 'Faisalabad']

/**
 * A branch picker that never silently assumes a value: it opens on an
 * empty "Select a branch" option, and picking "Other" reveals a free-text
 * field so multi-city showrooms aren't limited to the preset list.
 */
export default function BranchSelect({ label = 'Branch', value, onChange, required = true, dark = false }) {
  const isPreset = PRESET_BRANCHES.includes(value)
  const [mode, setMode] = useState(value && !isPreset ? 'other' : 'preset')

  function handleSelectChange(v) {
    if (v === '__other__') {
      setMode('other')
      onChange('')
    } else {
      setMode('preset')
      onChange(v)
    }
  }

  if (dark) {
    return (
      <div className="space-y-2">
        <div>
          <span className="block text-xs font-medium text-white/50 mb-1">{label}</span>
          <select
            required={required && mode === 'preset'}
            value={mode === 'other' ? '__other__' : value}
            onChange={(e) => handleSelectChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white transition focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 [&>option]:text-ink-900"
          >
            <option value="" disabled>Select a branch…</option>
            {PRESET_BRANCHES.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
            <option value="__other__">Other (type manually)</option>
          </select>
        </div>
        {mode === 'other' && (
          <input
            placeholder="Enter branch / city name"
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 transition focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Select
        label={label}
        required={required && mode === 'preset'}
        value={mode === 'other' ? '__other__' : value}
        onChange={(e) => handleSelectChange(e.target.value)}
      >
        <option value="" disabled>Select a branch…</option>
        {PRESET_BRANCHES.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
        <option value="__other__">Other (type manually)</option>
      </Select>
      {mode === 'other' && (
        <Input
          placeholder="Enter branch / city name"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
