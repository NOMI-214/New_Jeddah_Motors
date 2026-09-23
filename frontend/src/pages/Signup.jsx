import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui'
import BranchSelect from '../components/BranchSelect'

const OTP_LENGTH = 6

export default function Signup() {
  const navigate = useNavigate()
  const { completeSignup, user } = useAuth()

  const [checking, setChecking] = useState(true)
  const [step, setStep] = useState('form') // form | otp
  const [form, setForm] = useState({ name: '', email: '', phone: '', branch: '', password: '', confirm: '' })
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const otpRefs = useRef([])

  useEffect(() => setChecking(false), [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleRequestOtp(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!form.branch.trim()) {
      setError('Please select a branch')
      return
    }
    setLoading(true)
    try {
      await client.post('/auth/signup/request-otp', {
        name: form.name,
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        branch: form.branch.trim(),
        password: form.password,
      })
      setStep('otp')
      setCooldown(30)
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(i, val) {
    if (!/^\d?$/.test(val)) return
    const next = [...otpDigits]
    next[i] = val
    setOtpDigits(next)
    if (val && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus()
  }

  function handleOtpKeyDown(i, e) {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }

  function handleOtpPaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!text) return
    e.preventDefault()
    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < text.length; i++) next[i] = text[i]
    setOtpDigits(next)
    otpRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus()
  }

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    const code = otpDigits.join('')
    if (code.length < OTP_LENGTH) {
      setError('Please enter the full 6-digit code')
      return
    }
    setLoading(true)
    try {
      const res = await client.post('/auth/signup/verify-otp', {
        email: form.email.trim().toLowerCase(),
        otp: code,
      })
      completeSignup(res.data)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0) return
    setError('')
    try {
      await client.post('/auth/signup/resend-otp', { email: form.email.trim().toLowerCase() })
      setCooldown(30)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not resend code.')
    }
  }

  if (checking) {
    return <div className="min-h-screen bg-ink-900 flex items-center justify-center text-white/40">Loading…</div>
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-ink-900 px-4 overflow-hidden py-10">
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl animate-glowPulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-brand-600/10 blur-3xl animate-glowPulse" style={{ animationDelay: '1.2s' }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]" />

      <div className="relative w-full max-w-sm animate-fadeInUp">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-gold animate-float mb-4">
            <img src="/logo.png" alt="New Jeddah Motors" className="w-full h-full object-cover" />
            <div className="absolute inset-0 shimmer-surface animate-shimmer" />
          </div>
          <h1 className="font-display text-2xl font-bold text-brand-400 tracking-wide text-center">New Jeddah Motors</h1>
          <p className="text-xs text-white/40 tracking-[0.15em] mt-1 text-center">CREATE YOUR ADMIN ACCOUNT</p>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8">
          {step === 'form' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-xs text-white/40 leading-relaxed -mt-1 mb-2">
                This is a one-time setup. Use a real email address — you'll get a verification code there.
              </p>
              <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Email Address" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="you@yourcompany.com" required />
              <Field label="Phone (optional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <BranchSelect dark value={form.branch} onChange={(v) => setForm({ ...form, branch: v })} />
              <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
              <Field label="Confirm Password" type="password" value={form.confirm} onChange={(v) => setForm({ ...form, confirm: v })} required />
              {error && <p className="text-sm text-rose-400 animate-fadeIn">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending code…' : 'Send Verification Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <p className="text-sm text-white/70">We sent a 6-digit code to</p>
                <p className="text-sm text-brand-300 font-medium">{form.email}</p>
              </div>
              <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    inputMode="numeric"
                    maxLength={1}
                    className="w-full aspect-square min-w-0 text-center text-lg font-semibold bg-white/5 border border-white/15 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition"
                  />
                ))}
              </div>
              {error && <p className="text-sm text-rose-400 animate-fadeIn">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying…' : 'Verify & Create Account'}
              </Button>
              <div className="flex items-center justify-between text-xs pt-1">
                <button type="button" onClick={() => setStep('form')} className="text-white/40 hover:text-white/70 transition">
                  ← Edit details
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="text-brand-400 hover:text-brand-300 disabled:text-white/25 transition"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <div>
      <span className="block text-xs font-medium text-white/50 mb-1">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 transition focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
      />
    </div>
  )
}
