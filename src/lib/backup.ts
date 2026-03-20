// Encrypted vault backup — export and import utilities.
//
// Export format (v2): a single JSON file containing the already-encrypted
// vault data pulled directly from IndexedDB. The file is safe to store or
// transfer because it is encrypted with the user's master password via
// AES-GCM-256. The recipient must know the original master password to
// unlock the imported vault.
//
// Schema:
// {
//   version: 2,
//   format: "heiyo-encrypted-backup",
//   exportedAt: ISO-8601 string,
//   vault: { salt, verificationHash, ciphertext, iv }  ← all base64
// }

import { getVaultMeta, setVaultMeta, getEncryptedAccounts, setEncryptedAccounts } from './db'

export interface VaultBackup {
  version: number
  format: 'heiyo-encrypted-backup'
  exportedAt: string
  vault: {
    salt: string
    verificationHash: string
    ciphertext: string
    iv: string
  }
}

/** Read the encrypted vault from IndexedDB and trigger a .json download. */
export async function exportVault(): Promise<void> {
  const meta = await getVaultMeta()
  const enc = await getEncryptedAccounts()

  if (!meta || !enc) {
    throw new Error('Nothing to export — vault is empty or not yet set up.')
  }

  const backup: VaultBackup = {
    version: 2,
    format: 'heiyo-encrypted-backup',
    exportedAt: new Date().toISOString(),
    vault: {
      salt: meta.salt,
      verificationHash: meta.verificationHash,
      ciphertext: enc.ciphertext,
      iv: enc.iv,
    },
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `heiyo-vault-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Narrow type guard — verifies the parsed JSON has the required v2 shape. */
export function isValidBackup(json: unknown): json is VaultBackup {
  if (!json || typeof json !== 'object') return false
  const b = json as Record<string, unknown>
  if (b.format !== 'heiyo-encrypted-backup') return false
  if (!b.vault || typeof b.vault !== 'object') return false
  const v = b.vault as Record<string, unknown>
  return (
    typeof v.salt === 'string' && v.salt.length > 0 &&
    typeof v.verificationHash === 'string' && v.verificationHash.length > 0 &&
    typeof v.ciphertext === 'string' && v.ciphertext.length > 0 &&
    typeof v.iv === 'string' && v.iv.length > 0
  )
}

/**
 * Overwrite the local IndexedDB vault with the contents of a backup object.
 * Throws if the backup fails validation.
 * The caller must call `lock()` after this to force re-authentication.
 */
export async function importVault(backup: VaultBackup): Promise<void> {
  if (!isValidBackup(backup)) {
    throw new Error('Invalid or incompatible backup file.')
  }
  await setVaultMeta({
    salt: backup.vault.salt,
    verificationHash: backup.vault.verificationHash,
  })
  await setEncryptedAccounts({
    ciphertext: backup.vault.ciphertext,
    iv: backup.vault.iv,
  })
}
