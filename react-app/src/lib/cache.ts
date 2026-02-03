import type { MemberDict } from './types';

const DB_NAME = 'alykoira';
const DB_VERSION = 1;
const STORE_MEMBERS = 'members';
const STORE_META = 'meta';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_MEMBERS)) {
        db.createObjectStore(STORE_MEMBERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedMembers(): Promise<MemberDict | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_MEMBERS, 'readonly');
      const store = tx.objectStore(STORE_MEMBERS);
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = req.result;
        if (!rows || rows.length === 0) {
          resolve(null);
          return;
        }
        const dict: MemberDict = {};
        for (const row of rows) {
          dict[row.id] = row;
        }
        resolve(dict);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedMembers(members: MemberDict): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_MEMBERS, STORE_META], 'readwrite');
    const store = tx.objectStore(STORE_MEMBERS);
    const metaStore = tx.objectStore(STORE_META);

    // Clear existing and write all
    store.clear();
    for (const member of Object.values(members)) {
      store.put(member);
    }

    // Store sync timestamp
    metaStore.put({ key: 'lastSync', value: Date.now() });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently fail — cache is a bonus
  }
}

export async function getLastSyncTime(): Promise<number | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_META, 'readonly');
      const store = tx.objectStore(STORE_META);
      const req = store.get('lastSync');
      req.onsuccess = () => resolve(req.result?.value ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
