import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const DB_NAME = 'DTRS_PRO_OFFLINE';
const STORE_NAME = 'pending_sync';

/**
 * Initialize IndexedDB for offline storage
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

/**
 * Save data to IndexedDB for offline sync
 * @param {string} collection - Firestore collection name
 * @param {object} data - Data to save
 * @returns {Promise<string>} - Local ID
 */
export const saveOffline = async (collection, data) => {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const item = {
    collection,
    data,
    timestamp: new Date().toISOString(),
    synced: false,
  };

  return new Promise((resolve, reject) => {
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get all pending sync items
 * @returns {Promise<Array>} - Array of pending items
 */
export const getPendingSync = async () => {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result.filter((item) => !item.synced);
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Mark item as synced
 * @param {number} id - Local ID
 */
export const markSynced = async (id) => {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        item.synced = true;
        const updateRequest = store.put(item);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

/**
 * Sync pending items to Firestore
 * @returns {Promise<number>} - Number of items synced
 */
export const syncPending = async () => {
  if (!navigator.onLine) {
    return 0;
  }

  const pending = await getPendingSync();
  let syncedCount = 0;

  for (const item of pending) {
    try {
      const { collection: collectionName, data, id } = item;

      // Add to Firestore
      await addDoc(collection(db, collectionName), {
        ...data,
        syncedAt: new Date().toISOString(),
        offlineCreated: true,
      });

      // Mark as synced
      await markSynced(id);
      syncedCount++;
    } catch (error) {
      console.error('Error syncing item:', error);
      // Continue with other items
    }
  }

  return syncedCount;
};

/**
 * Check online status and sync if online
 */
export const checkAndSync = async () => {
  if (navigator.onLine) {
    const count = await syncPending();
    if (count > 0) {
      console.log(`Synced ${count} offline items`);
    }
  }
};

// Auto-sync when coming online
if (typeof window !== 'undefined') {
  window.addEventListener('online', checkAndSync);
}

