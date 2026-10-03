export type DuckTake = {
  id: string;
  name: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  createdAt: number;
};

const DATABASE_NAME = "duck-studio-library";
const STORE_NAME = "takes";

function openDuckDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No fue posible abrir la biblioteca local."));
  });
}

export async function addDuckTake(take: DuckTake) {
  const database = await openDuckDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(take);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("No fue posible guardar la toma."));
  });
  database.close();
}

export async function listDuckTakes() {
  const database = await openDuckDatabase();
  const takes = await new Promise<DuckTake[]>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as DuckTake[]).sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error ?? new Error("No fue posible leer la biblioteca."));
  });
  database.close();
  return takes;
}

export async function deleteDuckTake(id: string) {
  const database = await openDuckDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("No fue posible eliminar la toma local."));
  });
  database.close();
}
