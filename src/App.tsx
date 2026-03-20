import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useVault } from './hooks/useVault'
import { useClockSync } from './hooks/useClockSync'
import { TOTPCard } from './components/TOTPCard'
import { AddAccount } from './components/AddAccount'
import { EditAccount } from './components/EditAccount'
import { DevModule } from './components/DevModule'
import { LockScreen } from './components/LockScreen'
import type { Account } from './types'

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' as const } },
}

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
function ClockWarnIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
      <line x1="12" y1="19" x2="12.01" y2="19" strokeWidth="3" />
    </svg>
  )
}
function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
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
function EyeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function EyeOffIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
function ExportIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
function ImportIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function SyncStatus({ syncing, synced, drifted, offset }: { syncing: boolean; synced: boolean; drifted: boolean; offset: number }) {
  const [showCheck, setShowCheck] = useState(false)
  const [checkOpacity, setCheckOpacity] = useState(1)

  useEffect(() => {
    if (synced && !drifted) {
      setShowCheck(true)
      setCheckOpacity(1)
      const fadeTimer = setTimeout(() => setCheckOpacity(0), 2500)
      const hideTimer = setTimeout(() => setShowCheck(false), 3000)
      return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
    }
  }, [synced, drifted])

  if (syncing) {
    return (
      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold animate-pulse"
        style={{ background: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.15)', color: 'rgba(0,194,255,0.7)' }}
      >
        <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="currentColor" /></svg>
        Syncing…
      </div>
    )
  }

  if (drifted) {
    return (
      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', color: '#f59e0b' }}
        title={`System clock is off by ~${Math.round(Math.abs(offset) / 1000)}s — codes may be incorrect`}
      >
        <ClockWarnIcon />
        Clock drifted
      </div>
    )
  }

  if (showCheck) {
    return (
      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
        style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          color: '#10b981',
          opacity: checkOpacity,
          transition: 'opacity 0.5s ease',
        }}
      >
        <CheckIcon />
        Clock synced
      </div>
    )
  }

  return null
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'vault', label: 'My Codes',  icon: <GridIcon /> },
  { key: 'dev',   label: 'Dev Tools', icon: <CodeIcon /> },
]

export default function App() {
  const {
    status, accounts, legacyAccounts,
    createVault, unlock, lock, resetVault,
    addAccount, removeAccount, updateAccount, reorderAccounts,
  } = useVault()
  const clockSync = useClockSync()
  const [tab, setTab]           = useState<Tab>('vault')
  const [showAdd, setShowAdd]   = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [codesVisible, setCodesVisible] = useState(true)
  const [dragIndex, setDragIndex]       = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  // Must be before any conditional returns (Rules of Hooks)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') setTab('dev')
      if (e.shiftKey && e.key === 'V') setTab('vault')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Vault state gates ─────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <>
        <div className="fixed inset-0" style={{ background: '#020617', zIndex: 0 }}>
          <div className="bg-glow" />
        </div>
        <div className="fixed inset-0 z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00c2ff, #0090ff)', color: '#020617' }}
            >
              <ShieldIcon size={24} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'rgba(241,245,249,0.38)' }}>Loading vault…</p>
          </div>
        </div>
      </>
    )
  }

  if (status === 'setup' || status === 'migrating' || status === 'locked') {
    return (
      <LockScreen
        mode={status === 'locked' ? 'unlock' : status === 'migrating' ? 'migrate' : 'setup'}
        legacyCount={legacyAccounts?.length ?? 0}
        onCreate={async (password) => createVault(password, status === 'migrating' ? (legacyAccounts ?? []) : [])}
        onUnlock={unlock}
        onReset={resetVault}
      />
    )
  }

  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.issuer.toLowerCase().includes(search.toLowerCase())
  )

  // Drag is disabled while search is active (indices would mismatch)
  const dragEnabled = !search

  const handleDragStart = (index: number) => setDragIndex(index)
  const handleDragOver  = (index: number) => setDragOverIndex(index)
  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return
    const newOrder = [...accounts]
    const [moved] = newOrder.splice(dragIndex, 1)
    newOrder.splice(dropIndex, 0, moved)
    reorderAccounts(newOrder)
    setDragIndex(null)
    setDragOverIndex(null)
  }
  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleExport = () => {
    const data = JSON.stringify({ version: 1, accounts }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `heiyo-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        const imported: Account[] = Array.isArray(parsed) ? parsed : (parsed.accounts ?? [])
        if (!Array.isArray(imported) || imported.length === 0) throw new Error('No accounts found')
        const msg = accounts.length > 0
          ? `Replace your ${accounts.length} existing account(s) with ${imported.length} from this backup?`
          : `Import ${imported.length} account(s) from this backup?`
        if (!window.confirm(msg)) return
        reorderAccounts(imported)
      } catch {
        alert('Invalid backup file. Please use a file exported from Heiyo.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const editingAccount = editingId ? accounts.find(a => a.id === editingId) ?? null : null

  // Shared icon button style helper
  const iconBtnStyle = (active = false) => ({
    background: active ? 'rgba(0,194,255,0.12)' : 'rgba(255,255,255,0.06)',
    border: active ? '1px solid rgba(0,194,255,0.2)' : '1px solid rgba(255,255,255,0.09)',
    color: active ? '#00c2ff' : 'rgba(241,245,249,0.45)',
  })

  return (
    <>
      {/* ── Deep background with mesh blobs ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: '#020617', zIndex: 0 }}>
        {/* Blue blob — top-left */}
        <div className="absolute" style={{
          width: 700, height: 700, borderRadius: '50%',
          background: 'rgba(0,194,255,0.07)',
          filter: 'blur(130px)',
          top: -280, left: -180,
        }} />
        {/* Purple blob — bottom-right */}
        <div className="absolute" style={{
          width: 800, height: 800, borderRadius: '50%',
          background: 'rgba(124,58,237,0.08)',
          filter: 'blur(150px)',
          bottom: -300, right: -200,
        }} />
        <div className="bg-glow" />
      </div>

      {/* ── App shell ── */}
      <div className="relative z-10 flex min-h-screen">

        {/* ══════════════════════
            SIDEBAR — desktop
        ══════════════════════ */}
        <aside
          className="hidden sm:flex flex-col flex-shrink-0"
          style={{
            width: 260,
            background: 'rgba(8, 14, 28, 0.96)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Brand */}
          <div className="px-6 pt-8 pb-7">
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #00c2ff 0%, #0090ff 100%)',
                  boxShadow: '0 0 24px rgba(0, 194, 255, 0.45)',
                  color: '#020617',
                }}
              >
                <ShieldIcon size={18} />
              </div>
              <div>
                <p className="font-bold text-[15px] leading-tight" style={{ color: '#f1f5f9' }}>Heiyo</p>
                <p className="text-xs font-medium" style={{ color: 'rgba(241,245,249,0.35)' }}>Authenticator</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 mb-5" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Nav */}
          <nav className="px-3 flex flex-col gap-1">
            {TABS.filter(t => t.key !== 'dev').map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-left transition-all w-full"
                style={tab === key ? {
                  background: 'rgba(0, 194, 255, 0.1)',
                  color: '#00c2ff',
                  border: '1px solid rgba(0, 194, 255, 0.2)',
                } : {
                  color: 'rgba(241,245,249,0.4)',
                  border: '1px solid transparent',
                }}
              >
                <span>{icon}</span>
                {label}
                {key === 'vault' && accounts.length > 0 && (
                  <span
                    className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: tab === 'vault' ? 'rgba(0,194,255,0.15)' : 'rgba(255,255,255,0.08)',
                      color: tab === 'vault' ? '#00c2ff' : 'rgba(241,245,249,0.4)',
                    }}
                  >
                    {accounts.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Lock vault */}
          <div className="px-5 pb-3">
            <button
              onClick={lock}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(241,245,249,0.32)',
              }}
            >
              <LockIcon />
              Lock Vault
            </button>
          </div>

          {/* Bottom stat */}
          <div className="px-5 pb-7">
            <div
              className="rounded-xl px-4 py-4 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p
                className="text-3xl font-black leading-none flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #00c2ff, #a78bfa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {accounts.length}
              </p>
              <div>
                <p className="text-sm font-semibold leading-tight" style={{ color: '#f1f5f9' }}>
                  account{accounts.length !== 1 ? 's' : ''} secured
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.3)' }}>RFC 6238 · TOTP</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ═══════════════════════
            MAIN CONTENT
        ═══════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* ── Mobile header ── */}
          <div
            className="sm:hidden flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{
              background: 'rgba(8,14,28,0.96)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #00c2ff, #0090ff)', boxShadow: '0 0 14px rgba(0,194,255,0.4)', color: '#020617' }}
              >
                <ShieldIcon size={14} />
              </div>
              <h1 className="font-bold text-lg" style={{
                background: 'linear-gradient(135deg, #00c2ff, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Heiyo Authenticator</h1>
              <SyncStatus syncing={clockSync.syncing} synced={clockSync.synced} drifted={clockSync.drifted} offset={clockSync.offset} />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={lock}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
                style={iconBtnStyle()}
                title="Lock vault"
              >
                <LockIcon />
              </button>
              {tab === 'vault' && accounts.length > 0 && (
                <button
                  onClick={() => setCodesVisible(v => !v)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  style={iconBtnStyle(!codesVisible)}
                  title={codesVisible ? 'Hide codes' : 'Show codes'}
                >
                  {codesVisible ? <EyeIcon size={15} /> : <EyeOffIcon size={15} />}
                </button>
              )}
              {tab === 'vault' && (
                <>
                  <input ref={importRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  <button
                    onClick={() => importRef.current?.click()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
                    style={iconBtnStyle()}
                    title="Import backup"
                  >
                    <ImportIcon size={15} />
                  </button>
                </>
              )}
              {tab === 'vault' && accounts.length > 0 && (
                <button
                  onClick={handleExport}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  style={iconBtnStyle()}
                  title="Export backup"
                >
                  <ExportIcon size={15} />
                </button>
              )}
              {tab === 'vault' && (
                <button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #00c2ff, #0090ff)', boxShadow: '0 4px 12px rgba(0,194,255,0.35)', color: '#020617' }}>
                  <PlusIcon size={16} />
                </button>
              )}
            </div>
          </div>

          {/* ── Mobile tab switcher ── */}
          <div className="sm:hidden px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {TABS.filter(t => t.key !== 'dev').map(({ key, label }) => (
                <button
                  key={key} onClick={() => setTab(key)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={tab === key
                    ? { background: 'rgba(0,194,255,0.12)', color: '#00c2ff', border: '1px solid rgba(0,194,255,0.2)' }
                    : { background: 'transparent', color: 'rgba(241,245,249,0.38)', border: '1px solid transparent' }
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
            style={{ padding: '32px 52px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-bold text-3xl" style={{ color: '#f1f5f9' }}>
                  {tab === 'vault' ? 'My Codes' : 'Developer Tools'}
                </h2>
                <SyncStatus syncing={clockSync.syncing} synced={clockSync.synced} drifted={clockSync.drifted} offset={clockSync.offset} />
              </div>
              <p className="text-sm mt-1.5 font-medium" style={{ color: 'rgba(241,245,249,0.38)' }}>
                {tab === 'vault'
                  ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} · 30-second rotating codes`
                  : 'Generate secrets, scan QR codes, validate codes'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Eye toggle */}
              {tab === 'vault' && accounts.length > 0 && (
                <button
                  onClick={() => setCodesVisible(v => !v)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                  style={iconBtnStyle(!codesVisible)}
                  title={codesVisible ? 'Hide codes' : 'Show codes'}
                >
                  {codesVisible ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              )}

              {/* Export */}
              {tab === 'vault' && accounts.length > 0 && (
                <button
                  onClick={handleExport}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                  style={iconBtnStyle()}
                  title="Export backup"
                >
                  <ExportIcon />
                </button>
              )}

              {/* Import */}
              {tab === 'vault' && (
                <>
                  <input ref={importRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  <button
                    onClick={() => importRef.current?.click()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                    style={iconBtnStyle()}
                    title="Import backup"
                  >
                    <ImportIcon />
                  </button>
                </>
              )}

              {/* Search */}
              {tab === 'vault' && accounts.length > 0 && (
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(241,245,249,0.3)' }}><SearchIcon /></span>
                  <input
                    type="text"
                    placeholder="Search accounts…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="aurora-input rounded-xl pl-10 pr-9 py-2.5 text-sm"
                    style={{ width: 260 }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(241,245,249,0.3)' }}>
                      <XIcon />
                    </button>
                  )}
                </div>
              )}

              {/* Add Account */}
              {tab === 'vault' && (
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #00c2ff 0%, #0090ff 100%)',
                    boxShadow: '0 4px 16px rgba(0, 194, 255, 0.35)',
                    color: '#020617',
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(241,245,249,0.3)' }}><SearchIcon /></span>
                <input type="text" placeholder="Search accounts…" value={search} onChange={e => setSearch(e.target.value)} className="aurora-input w-full rounded-xl pl-9 pr-8 py-2.5 text-sm" />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(241,245,249,0.3)' }}><XIcon /></button>}
              </div>
            )}

            {tab === 'vault' ? (
              <>
                {accounts.length === 0 ? (

                  /* ── Empty state ── */
                  <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: 480 }}>

                    <div className="mb-8">
                      <div
                        className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto"
                        style={{
                          background: 'rgba(0, 194, 255, 0.07)',
                          border: '1px solid rgba(0, 194, 255, 0.15)',
                          boxShadow: '0 0 52px rgba(0, 194, 255, 0.12)',
                          color: '#00c2ff',
                        }}
                      >
                        <ShieldIcon size={40} />
                      </div>
                    </div>

                    <h2 className="font-bold text-center mb-3" style={{ color: '#f1f5f9', fontSize: '1.875rem' }}>
                      Your vault is empty
                    </h2>
                    <p
                      className="text-[15px] text-center mb-10 leading-relaxed"
                      style={{ color: 'rgba(241,245,249,0.38)', maxWidth: 460 }}
                    >
                      Add your first account to start generating time-based 2FA codes — all processed locally, never leaves your browser.
                    </p>

                    <button
                      onClick={() => setShowAdd(true)}
                      className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold mb-12 transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #00c2ff 0%, #0090ff 100%)',
                        boxShadow: '0 12px 40px rgba(0, 194, 255, 0.3), 0 4px 12px rgba(0, 144, 255, 0.2)',
                        color: '#020617',
                      }}
                    >
                      <PlusIcon size={18} />
                      Add Your First Account
                    </button>

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
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            color: 'rgba(241,245,249,0.45)',
                          }}
                        >
                          <span style={{ color: '#00c2ff' }}>{icon}</span>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                ) : filtered.length === 0 ? (

                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <p className="text-sm font-medium" style={{ color: 'rgba(241,245,249,0.4)' }}>No results for "{search}"</p>
                    <button onClick={() => setSearch('')} className="text-sm font-semibold" style={{ color: '#00c2ff' }}>Clear search</button>
                  </div>

                ) : (

                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                    variants={gridVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {filtered.map((account, index) => (
                      <motion.div key={account.id} variants={cardVariants}>
                        <TOTPCard
                          account={account}
                          codesVisible={codesVisible}
                          clockOffset={clockSync.offset}
                          onDelete={removeAccount}
                          onEdit={setEditingId}
                          isDragging={dragIndex === index}
                          isDragOver={dragOverIndex === index && dragIndex !== index}
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={() => handleDragOver(index)}
                          onDrop={() => handleDrop(index)}
                          onDragEnd={handleDragEnd}
                          dragEnabled={dragEnabled}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                )}
              </>
            ) : (
              <DevModule />
            )}
          </div>
        </div>
      </div>

      {showAdd && <AddAccount onAdd={addAccount} onClose={() => setShowAdd(false)} />}
      {editingAccount && (
        <EditAccount
          account={editingAccount}
          onSave={(name, issuer) => updateAccount(editingAccount.id, { name, issuer })}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  )
}
