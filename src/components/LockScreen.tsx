import { useState } from 'react'

interface Props {
  mode: 'setup' | 'migrate' | 'unlock'
  legacyCount?: number
  onCreate: (password: string) => Promise<void>
  onUnlock: (password: string) => Promise<boolean>
  onReset: () => Promise<void>
}

function ShieldIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function MigrateIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
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
      if (password.length < 8) { setError('Minimum 8 characters.'); return }
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
    mode === 'unlock'  ? 'Enter your master password to access your vault.' :
    mode === 'migrate' ? `Secure your ${legacyCount} account${legacyCount !== 1 ? 's' : ''} with a master password.` :
                         'Create a master password to protect your 2FA secrets.'

  const submitLabel =
    loading
      ? isCreating
        ? mode === 'migrate' ? 'Encrypting…' : 'Creating vault…'
        : 'Unlocking…'
      : isCreating
        ? mode === 'migrate' ? 'Encrypt & Migrate' : 'Create Vault'
        : 'Unlock Vault'

  return (
    <>
      {/* ── Background — deep night mesh ── */}
      <div className="fixed inset-0" style={{ background: '#020617', zIndex: 0 }}>
        {/* Blue blob — top-left */}
        <div className="absolute" style={{
          width: 600, height: 600, borderRadius: '50%',
          background: 'rgba(0,194,255,0.08)', filter: 'blur(120px)',
          top: -200, left: -150,
        }} />
        {/* Purple blob — bottom-right */}
        <div className="absolute" style={{
          width: 700, height: 700, borderRadius: '50%',
          background: 'rgba(124,58,237,0.09)', filter: 'blur(140px)',
          bottom: -250, right: -200,
        }} />
        <div className="bg-glow" />
      </div>

      {/* ── Centered portal — no card, just floats ── */}
      <div className="fixed inset-0 z-10 flex items-center justify-center px-5">
        <div className="w-full flex flex-col items-center" style={{ maxWidth: 320 }}>

          {/* Glowing shield icon */}
          <div
            className="flex items-center justify-center mb-7"
            style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,194,255,0.18) 0%, rgba(0,100,200,0.04) 100%)',
              border: '1px solid rgba(0,194,255,0.22)',
              boxShadow: '0 0 48px rgba(0,194,255,0.45), 0 0 96px rgba(0,194,255,0.15)',
              color: '#00c2ff',
            }}
          >
            <ShieldIcon size={36} />
          </div>

          {/* Title */}
          <h1
            className="text-2xl font-bold tracking-tight mb-2 text-center"
            style={{
              background: 'linear-gradient(135deg, #00c2ff, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Heiyo Authenticator
          </h1>

          {/* Subtitle */}
          <p
            className="text-sm text-center mb-8 leading-relaxed"
            style={{ color: 'rgba(241,245,249,0.38)', maxWidth: 280 }}
          >
            {subtitle}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">

            {/* Password field */}
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null) }}
                placeholder={isCreating ? 'At least 8 characters' : 'Master password'}
                className="aurora-input w-full rounded-2xl px-4 py-3.5 text-sm pr-12"
                autoFocus
                autoComplete={isCreating ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: 'rgba(241,245,249,0.3)' }}
              >
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* Confirm field */}
            {isCreating && (
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(null) }}
                  placeholder="Confirm password"
                  className="aurora-input w-full rounded-2xl px-4 py-3.5 text-sm pr-12"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: 'rgba(241,245,249,0.3)' }}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs px-1" style={{ color: '#f87171' }}>{error}</p>
            )}

            {/* Migration info */}
            {mode === 'migrate' && (
              <div
                className="flex gap-2 px-3.5 py-3 rounded-2xl text-xs"
                style={{ background: 'rgba(0,194,255,0.06)', color: 'rgba(0,194,255,0.75)' }}
              >
                <MigrateIcon />
                <span>Your existing accounts will be encrypted and migrated to secure storage.</span>
              </div>
            )}

            {/* Warning */}
            {isCreating && (
              <div
                className="flex gap-2 px-3.5 py-3 rounded-2xl text-xs"
                style={{ background: 'rgba(245,158,11,0.06)', color: 'rgba(245,158,11,0.75)' }}
              >
                <WarningIcon />
                <span>We cannot recover your password. If lost, your accounts are gone.</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-glow w-full py-3.5 rounded-2xl text-sm mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon />
                  {submitLabel}
                </span>
              ) : submitLabel}
            </button>
          </form>

          {/* Forgot password */}
          {mode === 'unlock' && (
            <div className="mt-7 w-full">
              {!showReset ? (
                <div className="text-center">
                  <button
                    onClick={() => setShowReset(true)}
                    className="text-xs transition-opacity hover:opacity-70"
                    style={{ color: 'rgba(241,245,249,0.2)' }}
                  >
                    Forgot password?
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl px-4 py-4" style={{ background: 'rgba(220,38,38,0.07)' }}>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: 'rgba(248,113,113,0.75)' }}>
                    This will permanently delete all encrypted accounts. This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReset(false)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(241,245,249,0.4)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={loading}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ background: 'rgba(220,38,38,0.14)', color: '#f87171' }}
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
