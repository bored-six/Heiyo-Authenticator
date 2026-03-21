import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { Account } from '../types'
import { QRScanner } from './QRScanner'
import type { ScannedAccount } from './QRScanner'

interface Props {
  onAdd: (name: string, issuer: string, secret: string) => void
  onClose: () => void
  accounts?: Account[]
  // Edit-mode props (kept for compatibility — used by EditAccount flow)
  editMode?: boolean
  initialValues?: { name: string; issuer: string }
  onSave?: (name: string, issuer: string) => void
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function QrIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h1v1h-1zM17 14h1v1h-1zM14 17h1v1h-1zM17 17h4v4h-4z" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddAccount({ onAdd, onClose, accounts = [], editMode, initialValues, onSave }: Props) {
  const [tab, setTab]               = useState<'manual' | 'scan'>('manual')
  const [showScanner, setShowScanner] = useState(false)
  const [name, setName]             = useState(initialValues?.name ?? '')
  const [issuer, setIssuer]         = useState(initialValues?.issuer ?? '')
  const [secret, setSecret]         = useState('')
  const [error, setError]           = useState('')

  // Auto-open scanner when user switches to the scan tab
  useEffect(() => {
    if (tab === 'scan') setShowScanner(true)
  }, [tab])

  const handleScan = (result: ScannedAccount) => {
    setShowScanner(false)
    const normalized = result.secret.replace(/\s/g, '').toUpperCase()
    const isDuplicate = accounts.some(
      a => a.secret.replace(/\s/g, '').toUpperCase() === normalized
    )
    if (isDuplicate) {
      setError('This account is already in your vault.')
      setTab('manual')
      return
    }
    setName(result.name)
    setIssuer(result.issuer)
    setSecret(result.secret)
    setError('')
    setTab('manual')
  }

  const handleScannerClose = () => {
    setShowScanner(false)
    setTab('manual')
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return setError('Account name is required')
    if (editMode) {
      onSave?.(name.trim(), issuer.trim() || name.trim())
      onClose()
    } else {
      if (!secret.trim()) return setError('Secret key is required')
      onAdd(name.trim(), issuer.trim() || name.trim(), secret.trim())
      onClose()
    }
  }

  return (
    <>
      {/* QR Scanner — rendered as a portal above everything */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner onScan={handleScan} onClose={handleScannerClose} />
        )}
      </AnimatePresence>

      {/* Sheet backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-md"
          style={{
            background: 'rgba(10, 15, 30, 0.95)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderBottom: 'none',
            borderRadius: '24px 24px 0 0',
            padding: '28px 24px 36px',
            boxShadow: '0 -16px 64px rgba(0,0,0,0.6)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Mobile drag handle */}
          <div
            className="sm:hidden mx-auto mb-6 rounded-full"
            style={{ width: 36, height: 3, background: 'rgba(255,255,255,0.12)' }}
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg" style={{ color: '#f1f5f9' }}>
              {editMode ? 'Edit Account' : 'Add Account'}
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:opacity-70 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(241,245,249,0.45)' }}
            >
              <XIcon />
            </button>
          </div>

          {/* Tab switcher — hidden in edit mode */}
          {!editMode && (
            <div
              className="flex gap-1 mb-6 p-1"
              style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 9999 }}
            >
              {([
                ['manual', 'Manual Entry', <EditIcon key="edit" />] as const,
                ['scan',   'Scan QR',      <QrIcon key="qr" />]   as const,
              ]).map(([t, label, icon]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-all"
                  style={{
                    borderRadius: 9999,
                    background: tab === t ? 'rgba(0,194,255,0.13)' : 'transparent',
                    color: tab === t ? '#00c2ff' : 'rgba(241,245,249,0.35)',
                  }}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Manual form */}
          {(tab === 'manual' || editMode) ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Account name — e.g. john@gmail.com"
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                className="aurora-input w-full rounded-2xl px-4 py-3.5 text-sm"
                autoFocus
              />
              <input
                type="text"
                placeholder="Issuer — e.g. Google, GitHub"
                value={issuer}
                onChange={e => setIssuer(e.target.value)}
                className="aurora-input w-full rounded-2xl px-4 py-3.5 text-sm"
              />
              {!editMode && (
                <input
                  type="text"
                  placeholder="Secret key — Base32 from your service"
                  value={secret}
                  onChange={e => { setSecret(e.target.value); setError('') }}
                  className="aurora-input w-full rounded-2xl px-4 py-3.5 text-sm font-mono"
                  autoComplete="off"
                />
              )}

              {error && (
                <p className="text-xs px-1" style={{ color: '#f87171' }}>{error}</p>
              )}

              <button type="submit" className="btn-glow w-full py-3.5 rounded-2xl text-sm mt-1">
                {editMode ? 'Save Changes' : 'Add Account'}
              </button>
            </form>
          ) : (
            /* Scan tab placeholder — scanner opens as overlay */
            <div className="flex flex-col items-center gap-4 py-8">
              <button
                onClick={() => setShowScanner(true)}
                className="btn-glow flex items-center gap-2 px-6 py-3 rounded-2xl text-sm"
              >
                <QrIcon />
                Open Scanner
              </button>
              <p className="text-xs text-center" style={{ color: 'rgba(241,245,249,0.3)' }}>
                Tap to open the camera scanner
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
