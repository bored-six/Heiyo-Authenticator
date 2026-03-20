// IndexedDB wrapper for the encrypted vault
// Two records in the 'vault' store:
//   { id: 'meta', salt: string, verificationHash: string }
//   { id: 'accounts', ciphertext: string, iv: string }

const DB_NAME = 'heiyo-vault'
const DB_VERSION = 1
const STORE = 'vault'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function dbGet<T>(db: IDBDatabase, key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = () => resolve((req.result as T) ?? null)
    req.onerror = () => reject(req.error)
  })
}

function dbPut(db: IDBDatabase, value: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function dbClear(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export interface VaultMeta {
  salt: string
  verificationHash: string
}

export async function getVaultMeta(): Promise<VaultMeta | null> {
  const db = await openDB()
  const row = await dbGet<{ id: string } & VaultMeta>(db, 'meta')
  db.close()
  return row ? { salt: row.salt, verificationHash: row.verificationHash } : null
}

export async function setVaultMeta(meta: VaultMeta): Promise<void> {
  const db = await openDB()
  await dbPut(db, { id: 'meta', ...meta })
  db.close()
}

export async function getEncryptedAccounts(): Promise<{ ciphertext: string; iv: string } | null> {
  const db = await openDB()
  const row = await dbGet<{ id: string; ciphertext: string; iv: string }>(db, 'accounts')
  db.close()
  return row ? { ciphertext: row.ciphertext, iv: row.iv } : null
}

export async function setEncryptedAccounts(data: { ciphertext: string; iv: string }): Promise<void> {
  const db = await openDB()
  await dbPut(db, { id: 'accounts', ...data })
  db.close()
}

export async function clearVault(): Promise<void> {
  const db = await openDB()
  await dbClear(db)
  db.close()
}
