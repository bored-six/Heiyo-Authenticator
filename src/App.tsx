import { useState, useEffect } from 'react'
import { useAccounts } from './hooks/useAccounts'
import { usePin } from './hooks/usePin'
import { TOTPCard } from './components/TOTPCard'
import { AddAccount } from './components/AddAccount'
import { DevModule } from './components/DevModule'
import { PinLock } from './components/PinLock'

type Tab = 'vault' | 'dev'

function ShieldIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}
function CodeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  )
}
function PlusIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6M15.5 7.5l2 2M18 5l2 2" />
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  )
}
function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}
function WifiOffIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M12 20h.01" />
    </svg>
  )
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'vault', label: 'My Codes',  icon: <GridIcon /> },
  { key: 'dev',   label: 'Dev Tools', icon: <CodeIcon /> },
]

export default function App() {
  const { accounts, addAccount, removeAccount } = useAccounts()
  const { pinSet, locked, setPin, verifyPin, lock } = usePin()
  const [tab, setTab]               = useState<Tab>('vault')
  const [showAdd, setShowAdd]       = useState(false)
  const [showSetPin, setShowSetPin] = useState(false)
  const [pinError, setPinError]     = useState('')
  const [search, setSearch]         = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') setTab('dev')
      if (e.shiftKey && e.key === 'V') setTab('vault')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.issuer.toLowerCase().includes(search.toLowerCase())
  )

  if (locked) {
    return (
      <PinLock mode="verify" error={pinError}
        onSuccess={pin => {
          if (!verifyPin(pin)) setPinError('Wrong PIN. Try again.')
          else setPinError('')
        }}
      />
    )
  }
  if (showSetPin) {
    return (
      <PinLock mode="set"
        onSuccess={pin => { setPin(pin); setShowSetPin(false) }}
        onCancel={() => setShowSetPin(false)}
      />
    )
  }

  return (
    <>
      {/* ── Full-screen aurora background ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ background: '#edeaff', zIndex: 0 }}>
        <div className="aurora-orb aurora-1" />
        <div className="aurora-orb aurora-2" />
        <div className="aurora-orb aurora-3" />
      </div>

      {/* ── App shell: full viewport ── */}
      <div className="relative z-10 flex min-h-screen">

        {/* ══════════════════════════════
            SIDEBAR — desktop only
        ══════════════════════════════ */}
        <aside
          className="hidden sm:flex flex-col flex-shrink-0"
          style={{
            width: 300,
            background: 'rgba(243,240,255,0.88)',
            backdropFilter: 'blur(48px) saturate(180%)',
            WebkitBackdropFilter: 'blur(48px) saturate(180%)',
            borderRight: '1px solid rgba(139,92,246,0.13)',
          }}
        >
          {/* Logo */}
          <div className="px-7 pt-8 pb-6">
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 6px 20px rgba(99,102,241,0.42)',
                }}
              >
                <ShieldIcon size={18} />
              </div>
              <div>
                <p className="font-bold text-[15px] leading-tight" style={{ color: '#1e1b4b' }}>Heiyo</p>
                <p className="text-xs font-medium" style={{ color: 'rgba(30,27,75,0.42)' }}>Authenticator</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-6 mb-5" style={{ height: 1, background: 'rgba(139,92,246,0.12)' }} />

          {/* Nav */}
          <nav className="px-4 flex flex-col gap-1">
            {TABS.filter(t => t.key !== 'dev').map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold text-left transition-all w-full"
                style={tab === key ? {
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.13), rgba(139,92,246,0.09))',
                  color: '#4338ca',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.2)',
                } : {
                  color: 'rgba(30,27,75,0.5)',
                  border: '1px solid transparent',
                }}
              >
                <span>{icon}</span>
                {label}
                {key === 'vault' && accounts.length > 0 && (
                  <span
                    className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: tab === 'vault' ? 'rgba(99,102,241,0.15)' : 'rgba(30,27,75,0.08)',
                      color: tab === 'vault' ? '#4338ca' : 'rgba(30,27,75,0.4)',
                    }}
                  >
                    {accounts.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Stats card */}
          <div className="px-5 pb-7">
            <div
              className="rounded-2xl px-5 py-4 flex items-center gap-4"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))',
                border: '1px solid rgba(99,102,241,0.13)',
              }}
            >
              <p
                className="text-4xl font-black leading-none flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {accounts.length}
              </p>
              <div>
                <p className="text-sm font-semibold leading-tight" style={{ color: '#1a1740' }}>
                  account{accounts.length !== 1 ? 's' : ''} secured
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(30,27,75,0.38)' }}>RFC 6238 · TOTP</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ═══════════════════════════════════
            MAIN CONTENT AREA
        ═══════════════════════════════════ */}
        <div
          className="flex-1 flex flex-col min-w-0"
          style={{
            background: 'rgba(255,255,255,0.38)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >

          {/* ── Mobile header ── */}
          <div
            className="sm:hidden flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{
              background: 'rgba(243,240,255,0.88)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderBottom: '1px solid rgba(139,92,246,0.1)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}
              >
                <ShieldIcon size={14} />
              </div>
              <h1 className="font-bold text-lg" style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Heiyo Authenticator</h1>
            </div>
            <div className="flex items-center gap-2">
              {pinSet ? (
                <button onClick={lock} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(139,92,246,0.2)', color: '#5b21b6' }}>
                  <LockIcon />
                </button>
              ) : (
                <button onClick={() => setShowSetPin(true)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#4338ca' }}>
                  <KeyIcon />
                </button>
              )}
              {tab === 'vault' && (
                <button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                  <PlusIcon size={16} />
                </button>
              )}
            </div>
          </div>

          {/* ── Mobile tab switcher ── */}
          <div className="sm:hidden px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.1)' }}>
              {TABS.map(({ key, label }) => (
                <button
                  key={key} onClick={() => setTab(key)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={tab === key
                    ? { background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)', color: '#4338ca', boxShadow: '0 2px 8px rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.18)' }
                    : { background: 'transparent', color: 'rgba(30,27,75,0.38)', border: '1px solid transparent' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Desktop header ── */}
          <header
            className="hidden sm:flex items-center justify-between flex-shrink-0"
            style={{
              padding: '32px 52px',
              borderBottom: '1px solid rgba(139,92,246,0.09)',
            }}
          >
            <div>
              <h2 className="font-bold text-3xl" style={{ color: '#1a1740' }}>
                {tab === 'vault' ? 'My Codes' : 'Developer Tools'}
              </h2>
              <p className="text-sm mt-1 font-medium" style={{ color: 'rgba(30,27,75,0.38)' }}>
                {tab === 'vault'
                  ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} · 30-second rotating codes`
                  : 'Generate secrets, scan QR codes, validate codes'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {tab === 'vault' && accounts.length > 0 && (
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(30,27,75,0.35)' }}><SearchIcon /></span>
                  <input
                    type="text"
                    placeholder="Search accounts…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="aurora-input rounded-xl pl-10 pr-9 py-2.5 text-sm"
                    style={{ width: 260 }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(30,27,75,0.35)' }}>
                      <XIcon />
                    </button>
                  )}
                </div>
              )}

              {pinSet ? (
                <button
                  onClick={lock}
                  className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(139,92,246,0.2)', color: '#5b21b6', backdropFilter: 'blur(8px)' }}
                >
                  <LockIcon /> Lock
                </button>
              ) : (
                <button
                  onClick={() => setShowSetPin(true)}
                  className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#4338ca' }}
                >
                  <KeyIcon /> Set PIN
                </button>
              )}

              {tab === 'vault' && (
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.42)',
                  }}
                >
                  <PlusIcon size={16} /> Add Account
                </button>
              )}
            </div>
          </header>

          {/* ── Scrollable content ── */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '40px 52px' }}>

            {/* Mobile search */}
            {tab === 'vault' && accounts.length > 2 && (
              <div className="relative mb-5 sm:hidden">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(30,27,75,0.35)' }}><SearchIcon /></span>
                <input type="text" placeholder="Search accounts…" value={search} onChange={e => setSearch(e.target.value)} className="aurora-input w-full rounded-xl pl-9 pr-8 py-2.5 text-sm" />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(30,27,75,0.35)' }}><XIcon /></button>}
              </div>
            )}

            {tab === 'vault' ? (
              <>
                {accounts.length === 0 ? (

                  /* ── Empty state — desktop-native ── */
                  <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: 480 }}>

                    {/* Icon */}
                    <div className="mb-8">
                      <div
                        className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
                        style={{
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))',
                          border: '1px solid rgba(99,102,241,0.16)',
                          boxShadow: '0 8px 32px rgba(99,102,241,0.1)',
                          color: '#6366f1',
                        }}
                      >
                        <ShieldIcon size={36} />
                      </div>
                    </div>

                    <h2 className="font-bold text-center mb-3" style={{ color: '#1a1740', fontSize: '1.75rem' }}>
                      Your vault is empty
                    </h2>
                    <p
                      className="text-[15px] text-center mb-10 leading-relaxed"
                      style={{ color: 'rgba(30,27,75,0.45)', maxWidth: 460 }}
                    >
                      Add your first account to start generating time-based 2FA codes — all processed locally, never leaves your browser.
                    </p>

                    <button
                      onClick={() => setShowAdd(true)}
                      className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold text-white mb-12 transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        boxShadow: '0 12px 40px rgba(99,102,241,0.38), 0 4px 12px rgba(139,92,246,0.22)',
                        letterSpacing: '0.01em',
                      }}
                    >
                      <PlusIcon size={18} />
                      Add Your First Account
                    </button>

                    {/* Feature badges */}
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                      {[
                        { icon: <ShieldIcon size={12} />, label: 'No server needed' },
                        { icon: <WifiOffIcon size={12} />, label: 'Works offline' },
                        { icon: <LockIcon />,              label: 'Client-side only' },
                      ].map(({ icon, label }) => (
                        <span
                          key={label}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold"
                          style={{
                            background: 'rgba(255,255,255,0.6)',
                            border: '1px solid rgba(99,102,241,0.16)',
                            color: 'rgba(30,27,75,0.6)',
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          <span style={{ color: '#6366f1' }}>{icon}</span>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                ) : filtered.length === 0 ? (

                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <p className="text-sm font-medium" style={{ color: 'rgba(30,27,75,0.45)' }}>No results for "{search}"</p>
                    <button onClick={() => setSearch('')} className="text-sm font-semibold" style={{ color: '#6366f1' }}>Clear search</button>
                  </div>

                ) : (

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {filtered.map(account => (
                      <TOTPCard key={account.id} account={account} onDelete={removeAccount} />
                    ))}
                  </div>

                )}
              </>
            ) : (
              <DevModule />
            )}
          </div>
        </div>
      </div>

      {showAdd && <AddAccount onAdd={addAccount} onClose={() => setShowAdd(false)} />}
    </>
  )
}
