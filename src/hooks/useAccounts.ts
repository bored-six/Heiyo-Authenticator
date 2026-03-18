import { useState, useEffect } from 'react'
import type { Account } from '../types'

const STORAGE_KEY = 'auth_accounts'

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
]

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
  }, [accounts])

  const addAccount = (name: string, issuer: string, secret: string) => {
    const newAccount: Account = {
      id: crypto.randomUUID(),
      name,
      issuer,
      secret: secret.replace(/\s/g, '').toUpperCase(),
      color: COLORS[accounts.length % COLORS.length],
      createdAt: Date.now(),
    }
    setAccounts(prev => [...prev, newAccount])
    return newAccount
  }

  const removeAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  return { accounts, addAccount, removeAccount }
}
