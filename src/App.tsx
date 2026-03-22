import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVault } from './hooks/useVault'
import { useClockSync } from './hooks/useClockSync'
import { TOTPCard } from './components/TOTPCard'
import { Toast } from './components/Toast'
import { AddAccount } from './components/AddAccount'
import { EditAccount } from './components/EditAccount'
import { DevModule } from './components/DevModule'
import { LockScreen } from './components/LockScreen'
import { exportVault, importVault, isValidBackup } from './lib/backup'
import type { Account } from './types'

// ── Framer Motion variants ──────────────────────────────────────────────────
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' as const } },
}

type Tab = 'vault' | 'dev'

// ── SVG Icons ───────────────────────────────────────────────────────────────
function ShieldIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
function GridIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}
function CodeIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  )
}
function PlusIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  )
}
function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}
function ClockWarnIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
      <line x1="12" y1="19" x2="12.01" y2="19" strokeWidth="3" />
    </svg>
  )
}
function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function EyeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function EyeOffIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
function ExportIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
function ImportIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

// ── Clock sync indicator (compact — lives in the pill) ──────────────────────
function PillSyncDot({ syncing, synced, drifted, offset }: {
  syncing: boolean; synced: boolean; drifted: boolean; offset: number
}) {
  const [showCheck, setShowCheck] = useState(false)
  const [checkOpacity, setCheckOpacity] = useState(1)

  useEffect(() => {
    if (synced && !drifted) {
      setShowCheck(true)
      setCheckOpacity(1)
      const f = setTimeout(() => setCheckOpacity(0), 2500)
      const h = setTimeout(() => setShowCheck(false), 3000)
      return () => { clearTimeout(f); clearTimeout(h) }
    }
  }, [synced, drifted])

  if (syncing) return (
    <div
      className="animate-pulse"
      style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,194,255,0.7)', flexShrink: 0 }}
      title="Syncing clock…"
    />
  )
  if (drifted) return (
    <div style={{ color: '#f59e0b', display: 'flex' }} title={`Clock off by ~${Math.round(Math.abs(offset)/1000)}s`}>
      <ClockWarnIcon />
    </div>
  )
  if (showCheck) return (
    <div
      style={{ color: '#10b981', display: 'flex', opacity: checkOpacity, transition: 'opacity 0.5s ease' }}
      title="Clock synced"
    >
      <CheckIcon size={11} />
    </div>
  )
  return null
}

// ── Background mesh ──────────────────────────────────────────────────────────
function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ background: '#020617', zIndex: 0 }}>
      <div className="absolute" style={{
        width: 700, height: 700, borderRadius: '50%',
        background: 'rgba(0,194,255,0.07)', filter: 'blur(130px)',
        top: -280, left: -180,
      }} />
      <div className="absolute" style={{
        width: 800, height: 800, borderRadius: '50%',
        background: 'rgba(124,58,237,0.08)', filter: 'blur(150px)',
        bottom: -300, right: -200,
      }} />
      <div className="bg-glow" />
    </div>
  )
}

export default function App() {
  const {
    status, accounts, legacyAccounts,
    createVault, unlock, lock, resetVault,
    addAccount, removeAccount, updateAccount, reorderAccounts,
  } = useVault()
  const clockSync = useClockSync()

  const [tab, setTab]             = useState<Tab>('vault')
  const [showAdd, setShowAdd]     = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [codesVisible, setCodesVisible] = useState(true)
  const [dragIndex, setDragIndex]       = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const handleCopied = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToastVisible(true)
    toastTimer.current = setTimeout(() => setToastVisible(false), 2000)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (import.meta.env.DEV && e.shiftKey && e.key === 'D') setTab('dev')
      if (e.shiftKey && e.key === 'V') setTab('vault')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Vault state gates ──────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <>
        <Background />
        <div className="fixed inset-0 z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
              style={{ background: 'linear-gradient(135deg, #00c2ff, #0090ff)', color: '#020617',
                boxShadow: '0 0 40px rgba(0,194,255,0.4)' }}
            >
              <ShieldIcon size={24} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'rgba(241,245,249,0.3)' }}>Loading vault…</p>
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
        onCreate={async (pw) => createVault(pw, status === 'migrating' ? (legacyAccounts ?? []) : [])}
        onUnlock={unlock}
        onReset={resetVault}
      />
    )
  }

  // ── Vault is unlocked ──────────────────────────────────────────────────────
  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.issuer.toLowerCase().includes(search.toLowerCase())
  )
  const dragEnabled = !search

  const handleDragStart = (i: number) => setDragIndex(i)
  const handleDragOver  = (i: number) => setDragOverIndex(i)
  const handleDrop = (dropIdx: number) => {
    if (dragIndex === null || dragIndex === dropIdx) return
    const next = [...accounts]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(dropIdx, 0, moved)
    reorderAccounts(next)
    setDragIndex(null)
    setDragOverIndex(null)
  }
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null) }

  const handleExport = async () => {
    try {
      await exportVault()
    } catch (err) {
      alert('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const parsed: unknown = JSON.parse(ev.target?.result as string)

        // ── New encrypted backup (v2) ──────────────────────────────────────
        if (isValidBackup(parsed)) {
          const ok = window.confirm(
            'Import encrypted vault backup?\n\n' +
            'Your current vault will be replaced. You will need your original ' +
            'master password to unlock the imported vault.'
          )
          if (!ok) return
          await importVault(parsed)
          lock() // Force re-authentication with the newly imported vault
          return
        }

        // ── Legacy plaintext backup (v1) ───────────────────────────────────
        const data = parsed as { version?: number; accounts?: Account[] } | Account[]
        const imported: Account[] = Array.isArray(data)
          ? data
          : (data.accounts ?? [])
        if (!Array.isArray(imported) || imported.length === 0) throw new Error('No accounts found in file.')
        const msg = accounts.length > 0
          ? `Replace your ${accounts.length} existing account(s) with ${imported.length} from this legacy backup?`
          : `Import ${imported.length} account(s) from legacy backup?`
        if (!window.confirm(msg)) return
        reorderAccounts(imported)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Invalid backup file. Please use a file exported from Heiyo.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const editingAccount = editingId ? accounts.find(a => a.id === editingId) ?? null : null

  // ── Pill tab button style ──────────────────────────────────────────────────
  const pillTab = (active: boolean) => ({
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 5,
    padding: '6px 12px',
    borderRadius: 9999,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer' as const,
    transition: 'all 0.18s ease',
    background: active ? 'rgba(0,194,255,0.13)' : 'transparent',
    color: active ? '#00c2ff' : 'rgba(241,245,249,0.35)',
  })

  return (
    <>
      <Background />

      {/* ══════════════════════════════════════════════
          FLOATING PILL NAV — fixed, top-center
      ══════════════════════════════════════════════ */}
      <nav
        className="fixed z-50 flex items-center gap-1"
        style={{
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(8,14,28,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 9999,
          padding: '5px 6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Brand logo */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00c2ff, #0090ff)',
            color: '#020617',
            boxShadow: '0 0 14px rgba(0,194,255,0.45)',
            marginRight: 2,
          }}
        >
          <ShieldIcon size={13} />
        </div>

        {/* Tab: My Codes */}
        <button style={pillTab(tab === 'vault')} onClick={() => setTab('vault')}>
          <GridIcon size={13} />
          <span className="hidden xs:inline sm:inline">My Codes</span>
        </button>

        {/* Tab: Dev Tools — hidden in production */}
        {import.meta.env.DEV && (
          <button style={pillTab(tab === 'dev')} onClick={() => setTab('dev')}>
            <CodeIcon size={13} />
            <span className="hidden sm:inline">Dev</span>
          </button>
        )}

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 4px', flexShrink: 0 }} />

        {/* Clock sync indicator */}
        <PillSyncDot
          syncing={clockSync.syncing}
          synced={clockSync.synced}
          drifted={clockSync.drifted}
          offset={clockSync.offset}
        />

        {/* Lock */}
        <button
          onClick={lock}
          title="Lock vault"
          className="flex items-center justify-center transition-all hover:opacity-70 active:scale-95"
          style={{ width: 30, height: 30, borderRadius: '50%', color: 'rgba(241,245,249,0.35)' }}
        >
          <LockIcon size={13} />
        </button>

        {/* Add Account — vault tab only */}
        {tab === 'vault' && (
          <button
            onClick={() => setShowAdd(true)}
            title="Add account"
            className="flex items-center justify-center transition-all active:scale-95"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00c2ff, #0090ff)',
              color: '#020617',
              boxShadow: '0 0 14px rgba(0,194,255,0.5)',
            }}
          >
            <PlusIcon size={13} />
          </button>
        )}
      </nav>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT — full width, centered column
      ══════════════════════════════════════════════ */}
      <main
        className="relative z-10 min-h-screen"
        style={{ paddingTop: 88, paddingBottom: 60 }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>

          {/* ── Vault tab ── */}
          {tab === 'vault' && (
            <>
              {/* Content toolbar — only when there are accounts */}
              {accounts.length > 0 && (
                <div className="flex items-center justify-between mb-6">
                  {/* Stat */}
                  <div>
                    <h1 className="font-bold text-xl" style={{ color: '#f1f5f9' }}>
                      {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                    </h1>
                    <p className="text-xs mt-0.5 font-medium" style={{ color: 'rgba(241,245,249,0.28)' }}>
                      RFC 6238 · TOTP · All local
                    </p>
                  </div>

                  {/* Actions — grouped in a single frosted pill */}
                  <div
                    className="flex items-center"
                    style={{
                      background: 'rgba(8,14,28,0.72)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 9999,
                      padding: '3px 4px',
                      gap: 2,
                    }}
                  >
                    <input ref={importRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />

                    {/* Eye toggle */}
                    {[
                      { icon: codesVisible ? <EyeIcon /> : <EyeOffIcon />, action: () => setCodesVisible(v => !v), title: codesVisible ? 'Hide codes' : 'Show codes', active: !codesVisible },
                      { icon: <ExportIcon />, action: handleExport, title: 'Export backup', active: false },
                      { icon: <ImportIcon />, action: () => importRef.current?.click(), title: 'Import backup', active: false },
                    ].map(({ icon, action, title, active }) => (
                      <button
                        key={title}
                        onClick={action}
                        title={title}
                        className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:opacity-80 active:scale-95"
                        style={{ color: active ? '#00c2ff' : 'rgba(241,245,249,0.38)', background: active ? 'rgba(0,194,255,0.1)' : 'transparent' }}
                      >
                        {icon}
                      </button>
                    ))}

                    {/* Divider */}
                    <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', margin: '0 2px', flexShrink: 0 }} />

                    {/* Search — borderless inside the pill */}
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5" style={{ color: 'rgba(241,245,249,0.28)', pointerEvents: 'none' }}>
                        <SearchIcon />
                      </span>
                      <input
                        type="text"
                        placeholder="Search…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="text-sm bg-transparent outline-none"
                        style={{
                          width: search ? 140 : 90,
                          paddingLeft: 26,
                          paddingRight: search ? 24 : 8,
                          paddingTop: 6,
                          paddingBottom: 6,
                          color: '#f1f5f9',
                          transition: 'width 0.2s ease',
                        }}
                      />
                      {search && (
                        <button
                          onClick={() => setSearch('')}
                          className="absolute right-1.5 flex items-center justify-center transition-opacity hover:opacity-70"
                          style={{ color: 'rgba(241,245,249,0.3)' }}
                        >
                          <XIcon />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Empty state ── */}
              {accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 480, paddingTop: 40 }}>
                  <div
                    className="flex items-center justify-center mb-8"
                    style={{
                      width: 96, height: 96, borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(0,194,255,0.12) 0%, rgba(0,100,200,0.03) 100%)',
                      border: '1px solid rgba(0,194,255,0.2)',
                      boxShadow: '0 0 48px rgba(0,194,255,0.2)',
                      color: '#00c2ff',
                    }}
                  >
                    <ShieldIcon size={40} />
                  </div>
                  <h2 className="font-bold mb-3" style={{ color: '#f1f5f9', fontSize: '1.75rem' }}>
                    Your vault is empty
                  </h2>
                  <p className="text-sm mb-10 leading-relaxed" style={{ color: 'rgba(241,245,249,0.35)', maxWidth: 400 }}>
                    Add your first account to start generating 2FA codes — encrypted, local, never leaves your browser.
                  </p>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="btn-glow flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm"
                  >
                    <PlusIcon size={16} />
                    Add Your First Account
                  </button>
                </div>

              ) : filtered.length === 0 ? (
                /* ── No search results ── */
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <p className="text-sm font-medium" style={{ color: 'rgba(241,245,249,0.35)' }}>
                    No results for "{search}"
                  </p>
                  <button
                    onClick={() => setSearch('')}
                    className="text-sm font-semibold"
                    style={{ color: '#00c2ff' }}
                  >
                    Clear search
                  </button>
                </div>

              ) : (
                /* ── Card list ── */
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-3"
                >
                  {filtered.map((account, index) => (
                    <motion.div key={account.id} variants={itemVariants}>
                      <TOTPCard
                        account={account}
                        codesVisible={codesVisible}
                        clockOffset={clockSync.offset}
                        onDelete={removeAccount}
                        onEdit={setEditingId}
                        onCopied={handleCopied}
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
          )}

          {/* ── Dev tab — dev only ── */}
          {import.meta.env.DEV && tab === 'dev' && (
            <div>
              <h1 className="font-bold text-xl mb-6" style={{ color: '#f1f5f9' }}>Developer Tools</h1>
              <DevModule />
            </div>
          )}
        </div>
      </main>

      {/* ── Toast ── */}
      <Toast visible={toastVisible} />

      {/* ── Modals ── */}
      <AnimatePresence>
        {showAdd && (
          <AddAccount onAdd={addAccount} onClose={() => setShowAdd(false)} accounts={accounts} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingAccount && (
          <EditAccount
            account={editingAccount}
            onSave={(name, issuer) => updateAccount(editingAccount.id, { name, issuer })}
            onClose={() => setEditingId(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
