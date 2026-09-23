import { createPortal } from 'react-dom'

export function Card({ children, className = '', sheen = false, hover = true }) {
  return (
    <div
      className={`relative bg-white rounded-2xl border border-ink-900/5 shadow-card overflow-hidden ${
        hover ? 'lift-hover' : ''
      } ${className}`}
    >
      {sheen && <div className="sheen-line absolute top-0 left-0 right-0" />}
      {children}
    </div>
  )
}

export function StatCard({ label, value, icon, tone = 'brand', delay = 0 }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
  }
  return (
    <Card hover className="p-4 flex items-center gap-4 animate-fadeInUp cursor-default group">
      <div style={{ animationDelay: `${delay}ms` }} className="contents">
        <div className={`stat-icon w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${tones[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-ink-600/70 tracking-wide">{label}</p>
          <p className="text-xl font-bold text-ink-900 truncate">{value}</p>
        </div>
        <div className="sheen-line absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </Card>
  )
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-ink-900/5 text-ink-600',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-rose-100 text-rose-700',
    blue: 'bg-brand-100 text-brand-800',
  }
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary:
      'bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-ink-900 shadow-gold',
    secondary: 'bg-ink-900/5 hover:bg-ink-900/10 text-ink-800',
    danger: 'bg-rose-50 hover:bg-rose-100 text-rose-600',
    dark: 'bg-ink-900 hover:bg-ink-800 text-brand-400',
  }
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-[0.97] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-ink-600 mb-1">{label}</span>}
      <input
        className={`w-full border border-ink-900/10 rounded-lg px-3 py-2 text-sm bg-white transition focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ${className}`}
        {...props}
      />
    </label>
  )
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-ink-600 mb-1">{label}</span>}
      <select
        className={`w-full border border-ink-900/10 rounded-lg px-3 py-2 text-sm bg-white transition focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 p-3 pt-16 backdrop-blur-sm animate-fadeIn sm:items-center sm:p-6 sm:pt-6"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg min-h-0 max-h-[calc(100dvh-4.75rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-fadeInUp sm:max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheen-line shrink-0" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-900/5 shrink-0 bg-white">
          <h3 id="modal-title" className="font-display text-xl font-semibold text-ink-900 pr-4">{title}</h3>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-ink-400 hover:text-ink-800 hover:bg-ink-900/5 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function EmptyState({ text }) {
  return (
    <div className="text-center py-14">
      <div className="text-3xl mb-2 opacity-30">🚘</div>
      <p className="text-sm text-ink-600/60">{text}</p>
    </div>
  )
}

export function money(v) {
  const n = Number(v || 0)
  return 'Rs ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 })
}
