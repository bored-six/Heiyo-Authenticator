import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface Props {
  onAdd: (name: string, issuer: string, secret: string) => void
  onClose: () => void
}

function parseOtpAuthUri(uri: string) {
  try {
    const url = new URL(uri)
    if (url.protocol !== 'otpauth:') return null
    const label = decodeURIComponent(url.pathname.replace('//', ''))
    const parts = label.includes(':') ? label.split(':') : ['', label]
    const issuer = url.searchParams.get('issuer') || parts[0] || 'Unknown'
    const name = parts[parts.length - 1] || label
    const secret = url.searchParams.get('secret') || ''
    return { name, issuer, secret }
  } catch {
    return null
  }
}

function QrIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h1v1h-1zM17 14h1v1h-1zM14 17h1v1h-1zM17 17h4v4h-4z" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export function AddAccount({ onAdd, onClose }: Props) {
  const [tab, setTab]       = useState<'manual' | 'scan'>('manual')
  const [name, setName]     = useState('')
  const [issuer, setIssuer] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError]   = useState('')
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const scanDivId  = 'qr-scanner'

  useEffect(() => {
    if (tab === 'scan') {
      setTimeout(() => {
        scannerRef.current = new Html5QrcodeScanner(
          scanDivId,
          { fps: 10, qrbox: { width: 220, height: 220 } },
          false
        )
        scannerRef.current.render(
          (decodedText) => {
            const parsed = parseOtpAuthUri(decodedText)
            if (parsed) {
              onAdd(parsed.name, parsed.issuer, parsed.secret)
              onClose()
            } else {
              setError('Invalid QR code. Must be an otpauth:// URI.')
            }
            scannerRef.current?.clear()
          },
          () => {}
        )
      }, 100)
    }
    return () => { scannerRef.current?.clear().catch(() => {}) }
  }, [tab])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim())   return setError('Account name is required')
    if (!secret.trim()) return setError('Secret key is required')
    onAdd(name.trim(), issuer.trim() || name.trim(), secret.trim())
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 pb-10 sm:pb-6"
        style={{
          background: 'rgba(13, 20, 38, 0.97)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderBottom: 'none',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,194,255,0.06)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.15)' }} />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg" style={{ color: '#f1f5f9' }}>Add Account</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(241,245,249,0.5)' }}
          >
            <XIcon />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          className="flex gap-1 mb-5 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {([
            ['manual', 'Manual Entry', <EditIcon />] as const,
            ['scan',   'Scan QR',      <QrIcon />]   as const,
          ]).map(([t, label, icon]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
              style={tab === t ? {
                background: 'rgba(0,194,255,0.12)',
                color: '#00c2ff',
                border: '1px solid rgba(0,194,255,0.2)',
              } : {
                background: 'transparent',
                color: 'rgba(241,245,249,0.38)',
                border: '1px solid transparent',
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {tab === 'manual' ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium px-1" style={{ color: 'rgba(241,245,249,0.45)' }}>Account name</label>
              <input
                type="text"
                placeholder="e.g. john@gmail.com"
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                className="aurora-input w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium px-1" style={{ color: 'rgba(241,245,249,0.45)' }}>Issuer</label>
              <input
                type="text"
                placeholder="e.g. Google, GitHub, Dropbox"
                value={issuer}
                onChange={e => setIssuer(e.target.value)}
                className="aurora-input w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium px-1" style={{ color: 'rgba(241,245,249,0.45)' }}>Secret key</label>
              <input
                type="text"
                placeholder="Base32 secret from your service"
                value={secret}
                onChange={e => { setSecret(e.target.value); setError('') }}
                className="aurora-input w-full rounded-xl px-4 py-3 text-sm font-mono"
                autoComplete="off"
              />
            </div>
            {error && (
              <p className="text-xs px-1" style={{ color: '#f87171' }}>{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-sm mt-1 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #00c2ff 0%, #0090ff 100%)',
                boxShadow: '0 4px 20px rgba(0,194,255,0.3)',
                color: '#060b18',
              }}
            >
              Add Account
            </button>
          </form>
        ) : (
          <div>
            <div id={scanDivId} className="rounded-xl overflow-hidden" />
            {error && <p className="text-xs mt-2" style={{ color: '#f87171' }}>{error}</p>}
            <p className="text-xs text-center mt-3" style={{ color: 'rgba(241,245,249,0.35)' }}>
              Point your camera at a 2FA QR code
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
