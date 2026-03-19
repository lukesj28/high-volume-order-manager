import { openDB } from 'idb'

const DB_NAME = 'pos-offline'
const DB_VERSION = 1
const STORE = 'pendingOrders'

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' })
        }
      }
    })
  }
  return dbPromise
}

export async function queueOrder(order) {
  const db = await getDB()
  await db.put(STORE, { ...order, _queuedAt: Date.now() })
}

export async function getPendingOrders() {
  const db = await getDB()
  return db.getAll(STORE)
}

export async function removeOrder(id) {
  const db = await getDB()
  await db.delete(STORE, id)
}

export async function clearQueue() {
  const db = await getDB()
  await db.clear(STORE)
}

export async function queueCount() {
  const db = await getDB()
  return db.count(STORE)
}
