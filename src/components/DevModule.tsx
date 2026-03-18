import { useState } from 'react'
import { generateSecret, generateURI, verifySync } from 'otplib'
import { QRCodeSVG } from 'qrcode.react'

export function DevModule() {
  const [appName, setAppName] = useState('MyApp')
  const [userEmail, setUserEmail] = useState('user@example.com')
  const [generatedSecret, setGeneratedSecret] = useState('')
  const [validateSecret, setValidateSecret] = useState('')
  const [validateCode, setValidateCode] = useState('')
  const [validateResult, setValidateResult] = useState<boolean | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const handleGenerateSecret = () => {
    setGeneratedSecret(generateSecret())
  }

  const getOtpauthUri = () =>
    generateURI({
      issuer: appName,
      label: userEmail,
      secret: generatedSecret,
    })

  const copySecret = async () => {
    await navigator.clipboard.writeText(generatedSecret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 1500)
  }

  const validateToken = () => {
    try {
      const result = verifySync({
        secret: validateSecret,
        token: validateCode.replace(/\s/g, ''),
      })
      setValidateResult(result.valid)
    } catch {
      setValidateResult(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div>
        <h1 className="font-bold text-xl" style={{ color: '#1e1b4b' }}>Developer Module</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(30,27,75,0.45)' }}>Tools to add 2FA to your own apps</p>
      </div>

      {/* Generate Section */}
      <div className="rounded-2xl p-4 flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(139,92,246,0.12)' }}>
        <h2 className="font-semibold text-sm" style={{ color: '#1e1b4b' }}>1. Generate Secret for a User</h2>

        <input
          type="text"
          placeholder="App name"
          value={appName}
          onChange={e => setAppName(e.target.value)}
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(139,92,246,0.18)', color: '#1e1b4b' }}
        />
        <input
          type="text"
          placeholder="User email"
          value={userEmail}
          onChange={e => setUserEmail(e.target.value)}
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(139,92,246,0.18)', color: '#1e1b4b' }}
        />

        <button
          onClick={handleGenerateSecret}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          Generate Secret Key
        </button>

        {generatedSecret && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-3 flex items-center justify-between gap-2" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.22)' }}>
              <code className="text-xs font-mono break-all" style={{ color: '#6d28d9' }}>{generatedSecret}</code>
              <button onClick={copySecret} className="text-xs font-medium flex-shrink-0" style={{ color: '#6d28d9' }}>
                {copiedSecret ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-xs" style={{ color: 'rgba(30,27,75,0.45)' }}>Show this QR code to your user</p>
              <div className="p-3 rounded-xl bg-white">
                <QRCodeSVG value={getOtpauthUri()} size={160} />
              </div>
              <p className="text-xs text-center" style={{ color: 'rgba(30,27,75,0.35)' }}>User scans this in any authenticator app</p>
            </div>

            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(139,92,246,0.12)' }}>
              <p className="text-xs mb-2" style={{ color: 'rgba(30,27,75,0.45)' }}>Backend validation snippet</p>
              <pre className="text-xs overflow-auto whitespace-pre-wrap" style={{ color: '#15803d' }}>
{`import { verifySync } from 'otplib'

// Store this secret in your DB per user:
const secret = "${generatedSecret}"

// On login, verify the user's code:
const result = verifySync({
  token: userSubmittedCode,
  secret: secret
})
if (result.valid) { /* allow login */ }`}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Validate Section */}
      <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(139,92,246,0.12)' }}>
        <h2 className="font-semibold text-sm" style={{ color: '#1e1b4b' }}>2. Test Code Validation</h2>
        <input
          type="text"
          placeholder="Secret key"
          value={validateSecret}
          onChange={e => { setValidateSecret(e.target.value); setValidateResult(null) }}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-mono outline-none"
          style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(139,92,246,0.18)', color: '#1e1b4b' }}
        />
        <input
          type="text"
          placeholder="6-digit code to verify"
          value={validateCode}
          onChange={e => { setValidateCode(e.target.value); setValidateResult(null) }}
          maxLength={7}
          className="w-full rounded-xl px-4 py-2.5 text-sm tabular-nums outline-none"
          style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(139,92,246,0.18)', color: '#1e1b4b' }}
        />
        <button
          onClick={validateToken}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}
        >
          Validate Code
        </button>
        {validateResult !== null && (
          <div
            className="rounded-xl p-3 text-center font-semibold text-sm"
            style={{
              background: validateResult ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${validateResult ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: validateResult ? '#10b981' : '#ef4444',
            }}
          >
            {validateResult ? '✓ Valid code' : '✗ Invalid or expired code'}
          </div>
        )}
      </div>
    </div>
  )
}
