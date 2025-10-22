/**
 * @fileoverview Valtio Persistence
 *
 * This file implements per-document persistence using Valtio's subscribe() function.
 * Each document gets automatic debounced persistence to both sessionStorage and localStorage.
 *
 * Architecture:
 * 1. Subscribe to changes in the documentsState proxyMap
 * 2. When a document changes, update its debounce timer
 * 3. When debounce completes (1.5s), trigger parallel writes to both storage layers
 * 4. Track persistence promises for workflow coordination
 */

import { subscribe } from "valtio";
import { documentsState, type Document } from "./documents.store";

/**
 * Persistence Result Type
 */
export type PersistenceResult = {
  sessionSuccess: boolean;
  localSuccess: boolean;
  errors: Array<{ type: "session" | "local"; error: any }>;
};

/**
 * Track debounce timers per document
 */
const documentDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Track persistence promises per document
 */
const documentPersistencePromises = new Map<
  string,
  {
    session: Promise<void> | null;
    local: Promise<void> | null;
  }
>();

/**
 * Helper: Persist document to sessionStorage (3 second delay)
 */
async function persistToSessionStorage(document: Document): Promise<void> {
  console.log(
    `[Persistence] [${document.id}] Starting sessionStorage persist (${document.title})...`
  );

  // Simulate 3-second network delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Persist to sessionStorage
  sessionStorage.setItem(`document:${document.id}`, JSON.stringify(document));

  console.log(
    `[Persistence] [${document.id}] ✓ SessionStorage persist complete (${document.title})`
  );
}

/**
 * Helper: Persist document to localStorage (5 second delay)
 */
async function persistToLocalStorage(document: Document): Promise<void> {
  console.log(
    `[Persistence] [${document.id}] Starting localStorage persist (${document.title})...`
  );

  // Simulate 5-second disk delay
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Persist to localStorage
  localStorage.setItem(`document:${document.id}`, JSON.stringify(document));

  console.log(
    `[Persistence] [${document.id}] ✓ LocalStorage persist complete (${document.title})`
  );
}

/**
 * Trigger persistence for a document
 *
 * @param document - The document to persist
 */
function triggerPersistence(document: Document) {
  console.log(
    `[Persistence] [${document.id}] Debounce complete, triggering persistence for: ${document.title}`
  );

  // Create persistence promises
  const sessionPromise = persistToSessionStorage(document).catch((error) => {
    console.error(
      `[Persistence] [${document.id}] SessionStorage persist failed:`,
      error
    );
    throw error;
  });

  const localPromise = persistToLocalStorage(document).catch((error) => {
    console.error(
      `[Persistence] [${document.id}] LocalStorage persist failed:`,
      error
    );
    throw error;
  });

  // Store promises for tracking
  documentPersistencePromises.set(document.id, {
    session: sessionPromise,
    local: localPromise,
  });

  // Clean up promises when complete
  Promise.allSettled([sessionPromise, localPromise]).then(() => {
    const promises = documentPersistencePromises.get(document.id);
    if (promises) {
      promises.session = null;
      promises.local = null;
    }
  });
}

/**
 * Initialize persistence system
 *
 * @remarks
 * This function sets up a subscription to the documentsState proxyMap.
 * Whenever a document changes, it:
 * 1. Clears any existing debounce timer for that document
 * 2. Sets a new 1.5-second debounce timer
 * 3. When the timer fires, triggers parallel persistence to both storage layers
 *
 * This is similar to Jotai's atomEffect but simpler - just one subscribe() call.
 */
export function initializePersistence() {
  console.log("[Persistence] Initializing Valtio persistence system");

  // Subscribe to the entire documentsState proxyMap
  const unsubscribe = subscribe(documentsState, () => {
    // Iterate through all documents and set up debounced persistence
    documentsState.forEach((document, documentId) => {
      console.log(
        `[Persistence] [${documentId}] Change detected: ${document.title}`
      );

      // Clear existing timer if any
      const existingTimer = documentDebounceTimers.get(documentId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new debounce timer (1.5 seconds)
      const timer = setTimeout(() => {
        triggerPersistence(document);
        documentDebounceTimers.delete(documentId);
      }, 1500);

      documentDebounceTimers.set(documentId, timer);
    });
  });

  return unsubscribe;
}

/**
 * Wait for document persistence to complete
 *
 * @param documentId - The document ID to wait for
 * @returns Promise with persistence result
 */
export async function waitForDocumentPersistence(
  documentId: string
): Promise<PersistenceResult> {
  const promises = documentPersistencePromises.get(documentId);

  // If no persistence operations are in progress, return success
  if (!promises || (!promises.session && !promises.local)) {
    return {
      sessionSuccess: true,
      localSuccess: true,
      errors: [],
    };
  }

  console.log(
    `[Persistence] [${documentId}] Waiting for persistence operations...`,
    {
      session: promises.session !== null,
      local: promises.local !== null,
    }
  );

  // Wait for all persistence operations
  const results = await Promise.allSettled([
    promises.session || Promise.resolve(),
    promises.local || Promise.resolve(),
  ]);

  const errors: PersistenceResult["errors"] = [];

  if (results[0].status === "rejected") {
    errors.push({ type: "session", error: results[0].reason });
  }
  if (results[1].status === "rejected") {
    errors.push({ type: "local", error: results[1].reason });
  }

  const result: PersistenceResult = {
    sessionSuccess: results[0].status === "fulfilled",
    localSuccess: results[1].status === "fulfilled",
    errors,
  };

  console.log(`[Persistence] [${documentId}] Persistence complete:`, result);

  return result;
}
