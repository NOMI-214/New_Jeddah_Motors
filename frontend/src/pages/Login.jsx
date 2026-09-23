import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import { Button } from '../components/ui'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
      return
    }
    client
      .get('/auth/setup-status')
      .then((res) => {
        if (res.data.needs_setup) {
          navigate('/signup', { replace: true })
        }
      })
      .finally(() => setChecking(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const dest = location.state?.from || '/'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return <div className="min-h-screen bg-ink-900 flex items-center justify-center text-white/40">Loading…</div>
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-ink-900 px-4 overflow-hidden">
      {/* Ambient gold glow — "showroom spotlighting" */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl animate-glowPulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-brand-600/10 blur-3xl animate-glowPulse" style={{ animationDelay: '1.2s' }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]" />

      <div className="relative w-full max-w-sm animate-fadeInUp">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-gold animate-float mb-4">
            <img src="/logo.png" alt="New Jeddah Motors" className="w-full h-full object-cover" />
            <div className="absolute inset-0 shimmer-surface animate-shimmer" />
          </div>
          <h1 className="font-display text-2xl font-bold text-brand-400 tracking-wide">New Jeddah Motors</h1>
          <p className="text-xs text-white/40 tracking-[0.2em] mt-1">SHOWROOM MANAGEMENT SYSTEM</p>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="block text-xs font-medium text-white/50 mb-1">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourcompany.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 transition focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              />
            </div>
            <div>
              <span className="block text-xs font-medium text-white/50 mb-1">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 transition focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              />
            </div>
            {error && <p className="text-sm text-rose-400 animate-fadeIn">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
        <p className="text-center text-white/30 text-xs mt-6">
          New here?{' '}
          <Link to="/signup" className="text-brand-400 hover:text-brand-300">Create the admin account</Link>
        </p>
        <p className="text-center text-white/25 text-xs mt-2">© {new Date().getFullYear()} New Jeddah Motors. All rights reserved.</p>
      </div>
    </div>
  )
}
