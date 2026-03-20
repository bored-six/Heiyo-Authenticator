import { useState } from 'react'
import type { Account } from '../types'

interface Props {
  account: Account
  onSave: (name: string, issuer: string) => void
  onClose: () => void
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export function EditAccount({ account, onSave, onClose }: Props) {
  const [name, setName] = useState(account.name)
  const [issuer, setIssuer] = useState(account.issuer)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return setError('Account name is required')
    onSave(name.trim(), issuer.trim() || name.trim())
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
        <div className="sm:hidden w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.15)' }} />

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg" style={{ color: '#f1f5f9' }}>Edit Account</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(241,245,249,0.5)' }}
          >
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium px-1" style={{ color: 'rgba(241,245,249,0.45)' }}>Account name</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              className="aurora-input w-full rounded-xl px-4 py-3 text-sm"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium px-1" style={{ color: 'rgba(241,245,249,0.45)' }}>Issuer</label>
            <input
              type="text"
              value={issuer}
              onChange={e => setIssuer(e.target.value)}
              className="aurora-input w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>
          {error && <p className="text-xs px-1" style={{ color: '#f87171' }}>{error}</p>}
          <p className="text-xs px-1" style={{ color: 'rgba(241,245,249,0.3)' }}>
            The secret key cannot be changed. Delete and re-add the account to use a new secret.
          </p>
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-sm mt-1 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #00c2ff 0%, #0090ff 100%)',
              boxShadow: '0 4px 20px rgba(0,194,255,0.3)',
              color: '#060b18',
            }}
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  )
}
