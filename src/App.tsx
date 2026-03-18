import { useState } from 'react'
import { useAccounts } from './hooks/useAccounts'
import { usePin } from './hooks/usePin'
import { TOTPCard } from './components/TOTPCard'
import { AddAccount } from './components/AddAccount'
import { DevModule } from './components/DevModule'
import { PinLock } from './components/PinLock'
import { Mascot, BlinkingGhost } from './components/Mascot'

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

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'vault', label: 'My Codes',    icon: <GridIcon /> },
  { key: 'dev',   label: 'Dev Tools',   icon: <CodeIcon /> },
]

export default function App() {
  const { accounts, addAccount, removeAccount } = useAccounts()
  const { pinSet, locked, setPin, verifyPin, lock } = usePin()
  const [tab, setTab]           = useState<Tab>('vault')
  const [showAdd, setShowAdd]   = useState(false)
  const [showSetPin, setShowSetPin] = useState(false)
  const [pinError, setPinError] = useState('')
  const [search, setSearch]     = useState('')

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
      {/* ── Full-screen aurora ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ background: '#edeaff', zIndex: 0 }}>
        <div className="aurora-orb aurora-1" />
        <div className="aurora-orb aurora-2" />
        <div className="aurora-orb aurora-3" />
      </div>

      {/* ── Viewport centering shell ── */}
      <div className="relative z-10 w-full min-h-screen flex flex-col sm:items-center sm:justify-center sm:p-5">

        {/* ════════════════════════════════════════
            MAIN PANEL
        ════════════════════════════════════════ */}
        <div
          className="w-full flex flex-col sm:flex-row sm:rounded-[28px] overflow-hidden min-h-screen sm:min-h-0"
          style={{
            maxWidth: 1160,
            /* fills viewport minus the 40px (2×p-5) padding on desktop */
            height: 'calc(100vh - 40px)',
            background: 'rgba(255,255,255,0.68)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow:
              '0 0 0 1px rgba(99,102,241,0.08),' +
              '0 32px 80px rgba(99,102,241,0.14),' +
              '0 8px 24px rgba(139,92,246,0.1)',
          }}
        >

          {/* ── Accent bar — top on mobile, left on desktop ── */}
          <div
            className="h-[3px] w-full sm:h-auto sm:w-[3px] flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7, #ec4899)' }}
          />

          {/* ══════════════════
              SIDEBAR (desktop)
          ══════════════════ */}
          <aside
            className="hidden sm:flex flex-col flex-shrink-0"
            style={{
              width: 260,
              borderRight: '1px solid rgba(139,92,246,0.1)',
              background: 'linear-gradient(180deg, rgba(238,232,255,0.6) 0%, rgba(255,255,255,0.2) 100%)',
            }}
          >
            {/* Logo */}
            <div className="px-6 pt-8 pb-6">
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 8px 24px rgba(99,102,241,0.45)',
                  }}
                >
                  <ShieldIcon size={20} />
                </div>
                <div>
                  <p className="font-bold text-base leading-tight" style={{ color: '#1e1b4b' }}>Heiyo</p>
                  <p className="text-xs font-medium" style={{ color: 'rgba(30,27,75,0.4)' }}>Authenticator</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 mb-4" style={{ height: 1, background: 'rgba(139,92,246,0.1)' }} />

            {/* Nav */}
            <nav className="px-4 flex flex-col gap-1">
              {TABS.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-left transition-all w-full"
                  style={tab === key ? {
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.1))',
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
            <div className="p-4">
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))',
                  border: '1px solid rgba(99,102,241,0.12)',
                }}
              >
                <p
                  className="text-3xl font-black mb-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {accounts.length}
                </p>
                <p className="text-xs font-semibold mb-4" style={{ color: 'rgba(30,27,75,0.45)' }}>
                  account{accounts.length !== 1 ? 's' : ''} secured
                </p>
                {[
                  { icon: <ShieldIcon size={11} />, label: 'No server needed' },
                  { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M12 20h.01"/></svg>, label: 'Works offline' },
                  { icon: <LockIcon />, label: 'Client-side only' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2 mb-2 last:mb-0">
                    <span style={{ color: '#6366f1', flexShrink: 0 }}>{icon}</span>
                    <span className="text-xs font-medium" style={{ color: 'rgba(30,27,75,0.55)' }}>{label}</span>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs mt-3" style={{ color: 'rgba(30,27,75,0.22)' }}>RFC 6238 · TOTP</p>
            </div>
          </aside>

          {/* ═════════════════════════════
              MAIN CONTENT AREA
          ═════════════════════════════ */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* ── Topbar ── */}
            <header
              className="flex items-center justify-between flex-shrink-0"
              style={{
                padding: '20px 32px',
                borderBottom: '1px solid rgba(139,92,246,0.09)',
                background: 'linear-gradient(180deg, rgba(238,232,255,0.3) 0%, transparent 100%)',
              }}
            >
              {/* Left: title (desktop shows page name, mobile shows app name) */}
              <div>
                {/* Mobile: app brand */}
                <div className="flex items-center gap-2.5 sm:hidden">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                    <ShieldIcon size={14} />
                  </div>
                  <h1 className="font-bold text-lg" style={{
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>Heiyo Authenticator</h1>
                </div>
                {/* Desktop: page title */}
                <div className="hidden sm:block">
                  <h2 className="font-bold text-xl" style={{ color: '#1a1740' }}>
                    {tab === 'vault' ? 'My Codes' : 'Developer Tools'}
                  </h2>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: 'rgba(30,27,75,0.38)' }}>
                    {tab === 'vault'
                      ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} · 30-second rotating codes`
                      : 'Generate secrets, scan QR codes, validate codes'}
                  </p>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-2.5">
                {/* Desktop search */}
                {tab === 'vault' && accounts.length > 0 && (
                  <div className="relative hidden sm:block">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(30,27,75,0.35)' }}><SearchIcon /></span>
                    <input
                      type="text"
                      placeholder="Search accounts…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="aurora-input rounded-xl pl-9 pr-8 py-2.5 text-sm"
                      style={{ width: 240 }}
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(30,27,75,0.35)' }}><XIcon /></button>
                    )}
                  </div>
                )}

                {/* PIN / Lock */}
                {pinSet ? (
                  <button
                    onClick={lock}
                    className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(139,92,246,0.2)', color: '#5b21b6' }}
                  >
                    <LockIcon />
                    <span className="hidden sm:inline">Lock</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSetPin(true)}
                    className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#4338ca' }}
                  >
                    <KeyIcon />
                    <span className="hidden sm:inline">Set PIN</span>
                  </button>
                )}

                {/* Add */}
                {tab === 'vault' && (
                  <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      boxShadow: '0 4px 16px rgba(99,102,241,0.45)',
                    }}
                  >
                    <PlusIcon size={16} />
                    <span className="hidden sm:inline">Add Account</span>
                  </button>
                )}
              </div>
            </header>

            {/* Mobile tab switcher */}
            <div className="sm:hidden px-5 py-3" style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
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

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto" style={{ padding: '28px 32px' }}>

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
                    /* ── Empty state ── */
                    <div className="flex flex-col items-center justify-center gap-7 h-full" style={{ minHeight: 420 }}>
                      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
                        <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
                        <div className="absolute" style={{ width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,212,240,0.35) 0%, transparent 70%)' }} />
                        <div style={{ animation: 'mascotFloat 3.2s ease-in-out infinite', position: 'relative' }}>
                          <BlinkingGhost width={120} height={96} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-2xl mb-2" style={{ color: '#1a1740' }}>Your vault is empty</p>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(30,27,75,0.45)', maxWidth: 300 }}>
                          Add your first account to start generating time-based 2FA codes — all processed locally, never leaves your browser.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          boxShadow: '0 12px 40px rgba(99,102,241,0.45), 0 4px 12px rgba(139,92,246,0.3)',
                          letterSpacing: '0.01em',
                        }}
                      >
                        <PlusIcon size={18} />
                        Add Your First Account
                      </button>
                      <div className="flex items-center gap-3">
                        {[
                          { icon: <ShieldIcon size={11} />, label: 'No server' },
                          { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M12 20h.01"/></svg>, label: 'Offline' },
                          { icon: <LockIcon />, label: 'Client-only' },
                        ].map(({ icon, label }) => (
                          <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.14)', color: 'rgba(30,27,75,0.55)' }}>
                            <span style={{ color: '#6366f1' }}>{icon}</span>{label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <p className="text-sm font-medium" style={{ color: 'rgba(30,27,75,0.45)' }}>No results for "{search}"</p>
                      <button onClick={() => setSearch('')} className="text-sm font-semibold" style={{ color: '#6366f1' }}>Clear search</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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

        </div>{/* end panel */}
      </div>{/* end centering shell */}

      {accounts.length > 0 && <Mascot />}

      {showAdd && <AddAccount onAdd={addAccount} onClose={() => setShowAdd(false)} />}
    </>
  )
}
