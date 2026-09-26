export default function PageLoader({ fullScreen = false, label = 'Loading page' }) {
  return (
    <div
      className={`flex items-center justify-center ${fullScreen ? 'min-h-screen bg-ink-900' : 'min-h-[45vh]'}`}
      role="status"
      aria-label={label}
    >
      <div className="relative h-14 w-14 overflow-hidden rounded-2xl shadow-gold animate-float">
        <img src="/logo.png" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 shimmer-surface animate-shimmer" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
