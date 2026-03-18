import { useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useEffect, useRef } from 'react'

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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h1v1h-1zM17 14h1v1h-1zM14 17h1v1h-1zM17 17h4v4h-4z" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function AddAccount({ onAdd, onClose }: Props) {
  const [tab, setTab] = useState<'manual' | 'scan'>('manual')
  const [name, setName] = useState('')
  const [issuer, setIssuer] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const scanDivId = 'qr-scanner'

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
    return () => {
      scannerRef.current?.clear().catch(() => {})
    }
  }, [tab])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Account name is required')
    if (!secret.trim()) return setError('Secret key is required')
    onAdd(name.trim(), issuer.trim() || name.trim(), secret.trim())
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl p-6 pb-10"
        style={{
          background: 'rgba(248,246,255,0.97)',
          backdropFilter: 'blur(32px) saturate(160%)',
          WebkitBackdropFilter: 'blur(32px) saturate(160%)',
          border: '1px solid rgba(139,92,246,0.15)',
          borderBottom: 'none',
          boxShadow: '0 -8px 48px rgba(139,92,246,0.12)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div
          className="w-10 h-1 rounded-full mx-auto mb-6"
          style={{ background: 'rgba(139,92,246,0.2)' }}
        />

        <h2 className="font-bold text-lg mb-4" style={{ color: '#1e1b4b' }}>Add Account</h2>

        {/* Tab switcher */}
        <div
          className="flex gap-1.5 mb-5 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(139,92,246,0.12)' }}
        >
          {([
            ['manual', 'Manual Entry', <EditIcon />] as const,
            ['scan', 'Scan QR', <QrIcon />] as const,
          ]).map(([t, label, icon]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
              style={tab === t ? {
                background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(129,140,248,0.25))',
                color: '#7c3aed',
                border: '1px solid rgba(139,92,246,0.25)',
              } : {
                background: 'transparent',
                color: 'rgba(30,27,75,0.4)',
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
            <input
              type="text"
              placeholder="Account name (e.g. john@gmail.com)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="aurora-input w-full rounded-xl px-4 py-3 text-sm"
            />
            <input
              type="text"
              placeholder="Issuer (e.g. Google, GitHub)"
              value={issuer}
              onChange={e => setIssuer(e.target.value)}
              className="aurora-input w-full rounded-xl px-4 py-3 text-sm"
            />
            <input
              type="text"
              placeholder="Secret key"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              className="aurora-input w-full rounded-xl px-4 py-3 text-sm font-mono"
              autoComplete="off"
            />
            {error && (
              <p className="text-red-400 text-xs px-1">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-white mt-1 transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              }}
            >
              Add Account
            </button>
          </form>
        ) : (
          <div>
            <div id={scanDivId} className="rounded-xl overflow-hidden" />
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            <p className="text-xs text-center mt-3" style={{ color: 'rgba(30,27,75,0.4)' }}>
              Point your camera at a 2FA QR code
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
