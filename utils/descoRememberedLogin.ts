export interface RememberedLogin { username: string; password: string }

const STORAGE_KEY = 'desco_remembered_login_v1';
const DB_NAME = 'descowise-login-key';
const KEY_STORE = 'keys';
const KEY_ID = 'desco-login';
const aad = new TextEncoder().encode(STORAGE_KEY);

const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const decode = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0));

export async function encryptRememberedLogin(key: CryptoKey, credentials: RememberedLogin): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(credentials));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, key, plain);
  return JSON.stringify({ v: 1, iv: encode(iv), data: encode(new Uint8Array(data)) });
}

export async function decryptRememberedLogin(key: CryptoKey, payload: string): Promise<RememberedLogin> {
  const record = JSON.parse(payload);
  if (record.v !== 1 || typeof record.iv !== 'string' || typeof record.data !== 'string') throw new Error('Invalid saved login');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(record.iv), additionalData: aad }, key, decode(record.data));
  const credentials = JSON.parse(new TextDecoder().decode(plain));
  if (typeof credentials.username !== 'string' || typeof credentials.password !== 'string' || !credentials.username || !credentials.password) throw new Error('Invalid saved login');
  return credentials;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(KEY_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Secure storage is busy'));
  });
}

async function readKey(): Promise<CryptoKey | null> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(KEY_STORE, 'readonly').objectStore(KEY_STORE).get(KEY_ID);
      request.onsuccess = () => resolve((request.result as CryptoKey | undefined) || null);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

async function addKey(key: CryptoKey): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(KEY_STORE, 'readwrite');
      transaction.objectStore(KEY_STORE).add(key, KEY_ID);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

async function getOrCreateKey(): Promise<CryptoKey> {
  const existing = await readKey();
  if (existing) return existing;
  const generated = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  try { await addKey(generated); return generated; }
  catch (error) {
    const concurrent = await readKey();
    if (concurrent) return concurrent;
    throw error;
  }
}

async function deleteKey(): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(KEY_STORE, 'readwrite');
      transaction.objectStore(KEY_STORE).delete(KEY_ID);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

export function hasRememberedLogin(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) !== null; }
  catch { return false; }
}

export async function saveRememberedLogin(credentials: RememberedLogin): Promise<void> {
  const key = await getOrCreateKey();
  localStorage.setItem(STORAGE_KEY, await encryptRememberedLogin(key, credentials));
}

export async function loadRememberedLogin(): Promise<RememberedLogin | null> {
  const payload = localStorage.getItem(STORAGE_KEY);
  if (!payload) return null;
  try {
    const key = await readKey();
    if (!key) throw new Error('Missing encryption key');
    return await decryptRememberedLogin(key, payload);
  } catch {
    await clearRememberedLogin().catch(() => {});
    return null;
  }
}

export async function clearRememberedLogin(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  await deleteKey();
}
