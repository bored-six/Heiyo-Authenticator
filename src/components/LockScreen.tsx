import { useState } from 'react'

interface Props {
  mode: 'setup' | 'migrate' | 'unlock'
  legacyCount?: number
  onCreate: (password: string) => Promise<void>
  onUnlock: (password: string) => Promise<boolean>
  onReset: () => Promise<void>
}

function ShieldIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

function MigrateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  )
}

export function LockScreen({ mode, legacyCount = 0, onCreate, onUnlock, onReset }: Props) {
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [showReset, setShowReset]     = useState(false)

  const isCreating = mode !== 'unlock'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password) { setError('Password is required.'); return }

    if (isCreating) {
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
      if (password !== confirm) { setError('Passwords do not match.'); return }
      setLoading(true)
      try {
        await onCreate(password)
      } catch {
        setError('Failed to create vault. Please try again.')
        setLoading(false)
      }
    } else {
      setLoading(true)
      const ok = await onUnlock(password)
      if (!ok) {
        setError('Incorrect password.')
        setLoading(false)
      }
    }
  }

  const handleReset = async () => {
    setLoading(true)
    await onReset()
    setLoading(false)
    setShowReset(false)
  }

  const subtitle =
    mode === 'unlock'  ? 'Enter your master password to unlock your vault.' :
    mode === 'migrate' ? `Create a master password to secure your ${legacyCount} existing account${legacyCount !== 1 ? 's' : ''}.` :
                         'Create a master password to protect your 2FA secrets.'

  return (
    <>
      <div className="fixed inset-0 pointer-events-none" style={{ background: '#060b18', zIndex: 0 }}>
        <div className="bg-glow" />
      </div>

      <div className="fixed inset-0 z-10 flex items-center justify-center p-5">
        <div
          className="w-full max-w-sm rounded-3xl p-8"
          style={{
            background: 'rgba(8, 14, 28, 0.97)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,194,255,0.06)',
          }}
        >
          {/* Brand */}
          <div className="flex flex-col items-center mb-7">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #00c2ff 0%, #0090ff 100%)',
                boxShadow: '0 0 40px rgba(0, 194, 255, 0.4)',
                color: '#060b18',
              }}
            >
              <ShieldIcon />
            </div>
            <h1
              className="text-2xl font-black mb-1.5"
              style={{
                background: 'linear-gradient(135deg, #00c2ff, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Heiyo Authenticator
            </h1>
            <p className="text-sm text-center leading-relaxed" style={{ color: 'rgba(241,245,249,0.42)', maxWidth: 280 }}>
              {subtitle}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold px-1" style={{ color: 'rgba(241,245,249,0.45)' }}>
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder={isCreating ? 'At least 8 characters' : 'Enter your password'}
                  className="aurora-input w-full rounded-xl px-4 py-3 text-sm pr-11"
                  autoFocus
                  autoComplete={isCreating ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                  style={{ color: 'rgba(241,245,249,0.35)' }}
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Confirm password (setup/migrate only) */}
            {isCreating && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold px-1" style={{ color: 'rgba(241,245,249,0.45)' }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError(null) }}
                    placeholder="Re-enter your password"
                    className="aurora-input w-full rounded-xl px-4 py-3 text-sm pr-11"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                    style={{ color: 'rgba(241,245,249,0.35)' }}
                  >
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="px-3 py-2.5 rounded-xl text-xs font-medium"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
              >
                {error}
              </div>
            )}

            {/* Migration info box */}
            {mode === 'migrate' && (
              <div
                className="flex gap-2.5 px-3 py-3 rounded-xl text-xs"
                style={{ background: 'rgba(0,194,255,0.06)', border: '1px solid rgba(0,194,255,0.15)', color: 'rgba(0,194,255,0.8)' }}
              >
                <MigrateIcon />
                <span>Your existing accounts will be encrypted and migrated to secure storage.</span>
              </div>
            )}

            {/* Warning (setup/migrate) */}
            {isCreating && (
              <div
                className="flex gap-2.5 px-3 py-3 rounded-xl text-xs"
                style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', color: 'rgba(245,158,11,0.8)' }}
              >
                <WarningIcon />
                <span>We do not store your password. If you lose it, your accounts <strong>cannot</strong> be recovered.</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm mt-0.5 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #00c2ff 0%, #0090ff 100%)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(0,194,255,0.3)',
                color: '#060b18',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon />
                  {isCreating ? (mode === 'migrate' ? 'Encrypting & migrating…' : 'Creating vault…') : 'Unlocking…'}
                </span>
              ) : (
                isCreating ? (mode === 'migrate' ? 'Encrypt & Migrate' : 'Create Vault') : 'Unlock Vault'
              )}
            </button>
          </form>

          {/* Forgot password — unlock mode only */}
          {mode === 'unlock' && (
            <div className="mt-5">
              {!showReset ? (
                <div className="text-center">
                  <button
                    onClick={() => setShowReset(true)}
                    className="text-xs transition-opacity hover:opacity-80"
                    style={{ color: 'rgba(241,245,249,0.28)' }}
                  >
                    Forgot password?
                  </button>
                </div>
              ) : (
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)' }}
                >
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: 'rgba(248,113,113,0.85)' }}>
                    This will permanently delete all your encrypted accounts and reset the vault. This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReset(false)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(241,245,249,0.45)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={loading}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171' }}
                    >
                      Reset Vault
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
