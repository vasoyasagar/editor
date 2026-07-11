import { get, set, del, keys } from 'idb-keyval'

const DOC_PREFIX = 'doc:'
const INDEX_KEY = 'docs:index'
const CURRENT_KEY = 'currentDocId'
const PREFS_KEY = 'prefs'

export function genId() {
  return 'd_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

// ---- Document index (list of {id, title, pinned, updatedAt}) ----

export async function loadDocIndex() {
  return (await get(INDEX_KEY)) || []
}

export async function saveDocIndex(index) {
  await set(INDEX_KEY, index)
}

// ---- Individual documents ----

export async function loadDoc(id) {
  return await get(DOC_PREFIX + id)
}

export async function saveDoc(doc) {
  await set(DOC_PREFIX + doc.id, doc)
}

export async function deleteDoc(id) {
  await del(DOC_PREFIX + id)
}

// ---- Current doc ----

export async function loadCurrentDocId() {
  return await get(CURRENT_KEY)
}

export async function saveCurrentDocId(id) {
  await set(CURRENT_KEY, id)
}

// ---- Preferences ----

export async function loadPrefs() {
  return (await get(PREFS_KEY)) || {}
}

export async function savePrefs(prefs) {
  await set(PREFS_KEY, prefs)
}

// ---- Storage stats ----

export async function getStorageStats() {
  let totalBytes = 0
  const allKeys = await keys()
  for (const key of allKeys) {
    const value = await get(key)
    const k = String(key)
    const v = typeof value === 'string' ? value : JSON.stringify(value)
    totalBytes += (k.length + (v ? v.length : 0)) * 2
  }
  return { totalBytes, docCount: allKeys.filter((k) => String(k).startsWith(DOC_PREFIX)).length }
}

export async function getDocSize(id) {
  const doc = await get(DOC_PREFIX + id)
  if (!doc) return 0
  return JSON.stringify(doc).length * 2
}

// ---- Wipe all ----

export async function wipeAllData() {
  const allKeys = await keys()
  for (const key of allKeys) {
    await del(key)
  }
}
