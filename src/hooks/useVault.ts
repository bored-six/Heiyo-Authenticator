import { useState, useEffect, useRef, useCallback } from 'react'
import type { Account } from '../types'
import { generateSalt, createMasterKey, verifyAndDeriveKey, encryptData, decryptData } from '../lib/crypto'
import {
  getVaultMeta, setVaultMeta,
  getEncryptedAccounts, setEncryptedAccounts,
  clearVault,
} from '../lib/db'

export type VaultStatus = 'loading' | 'setup' | 'migrating' | 'locked' | 'unlocked'

const STORAGE_KEY = 'auth_accounts'
const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
]
const AUTO_LOCK_MS = 60_000

export function useVault() {
  const [status, setStatus] = useState<VaultStatus>('loading')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [legacyAccounts, setLegacyAccounts] = useState<Account[] | null>(null)
  const masterKeyRef = useRef<CryptoKey | null>(null)
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Auto-lock ──────────────────────────────────────────────────────────────
  const lock = useCallback(() => {
    masterKeyRef.current = null
    setAccounts([])
    setStatus('locked')
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
  }, [])

  const resetLockTimer = useCallback(() => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
    lockTimerRef.current = setTimeout(lock, AUTO_LOCK_MS)
  }, [lock])

  useEffect(() => {
    if (status !== 'unlocked') return
    const handler = () => resetLockTimer()
    const events = ['mousemove', 'keydown', 'click', 'touchstart'] as const
    events.forEach(e => window.addEventListener(e, handler, { passive: true }))
    resetLockTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, handler))
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
    }
  }, [status, resetLockTimer])

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const meta = await getVaultMeta()
        if (meta) { setStatus('locked'); return }
        // No vault — check for legacy localStorage data to migrate
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) {
            const parsed = JSON.parse(raw) as Account[]
            if (Array.isArray(parsed) && parsed.length > 0) {
              setLegacyAccounts(parsed)
              setStatus('migrating')
              return
            }
          }
        } catch { /* ignore parse errors */ }
        setStatus('setup')
      } catch {
        setStatus('setup')
      }
    }
    init()
  }, [])

  // ── Persist (encrypt + save to IndexedDB) ─────────────────────────────────
  const persistAccounts = useCallback(async (list: Account[]) => {
    if (!masterKeyRef.current) throw new Error('Vault is locked')
    const { ciphertext, iv } = await encryptData(JSON.stringify(list), masterKeyRef.current)
    await setEncryptedAccounts({ ciphertext, iv })
    setAccounts(list)
  }, [])

  // ── Create vault (setup or migration) ─────────────────────────────────────
  const createVault = useCallback(async (password: string, initialAccounts: Account[] = []) => {
    const salt = generateSalt()
    const { key, verificationHash, saltBase64 } = await createMasterKey(password, salt)
    await setVaultMeta({ salt: saltBase64, verificationHash })
    masterKeyRef.current = key
    const { ciphertext, iv } = await encryptData(JSON.stringify(initialAccounts), key)
    await setEncryptedAccounts({ ciphertext, iv })
    localStorage.removeItem(STORAGE_KEY)
    setLegacyAccounts(null)
    setAccounts(initialAccounts)
    setStatus('unlocked')
  }, [])

  // ── Unlock ─────────────────────────────────────────────────────────────────
  const unlock = useCallback(async (password: string): Promise<boolean> => {
    try {
      const meta = await getVaultMeta()
      if (!meta) return false
      const key = await verifyAndDeriveKey(password, meta.salt, meta.verificationHash)
      if (!key) return false
      const enc = await getEncryptedAccounts()
      if (!enc) {
        masterKeyRef.current = key
        setAccounts([])
        setStatus('unlocked')
        return true
      }
      const plaintext = await decryptData(enc.ciphertext, enc.iv, key)
      masterKeyRef.current = key
      setAccounts(JSON.parse(plaintext) as Account[])
      setStatus('unlocked')
      return true
    } catch {
      return false
    }
  }, [])

  // ── Reset (wipe vault — for forgotten passwords) ───────────────────────────
  const resetVault = useCallback(async () => {
    await clearVault()
    localStorage.removeItem(STORAGE_KEY)
    masterKeyRef.current = null
    setAccounts([])
    setLegacyAccounts(null)
    setStatus('setup')
  }, [])

  // ── Account CRUD (fire-and-forget; matches useAccounts public API) ─────────
  const addAccount = useCallback((name: string, issuer: string, secret: string) => {
    const newAccount: Account = {
      id: crypto.randomUUID(),
      name,
      issuer,
      secret: secret.replace(/\s/g, '').toUpperCase(),
      color: COLORS[accounts.length % COLORS.length],
      createdAt: Date.now(),
    }
    persistAccounts([...accounts, newAccount]).catch(console.error)
  }, [accounts, persistAccounts])

  const removeAccount = useCallback((id: string) => {
    persistAccounts(accounts.filter(a => a.id !== id)).catch(console.error)
  }, [accounts, persistAccounts])

  const updateAccount = useCallback((id: string, changes: { name?: string; issuer?: string }) => {
    persistAccounts(accounts.map(a => a.id === id ? { ...a, ...changes } : a)).catch(console.error)
  }, [accounts, persistAccounts])

  const reorderAccounts = useCallback((newOrder: Account[]) => {
    persistAccounts(newOrder).catch(console.error)
  }, [persistAccounts])

  return {
    status, accounts, legacyAccounts,
    createVault, unlock, lock, resetVault,
    addAccount, removeAccount, updateAccount, reorderAccounts,
  }
}
