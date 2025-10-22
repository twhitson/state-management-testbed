/**
 * @fileoverview Jotai Persistence Atoms
 *
 * This file implements per-document persistence using jotai-effect and atom families.
 * Each document gets automatic debounced persistence to both sessionStorage and localStorage.
 *
 * Architecture:
 * 1. Document changes are detected by an atomEffect watching documentAtomFamily(id)
 * 2. Changes are written to a debouncer (1.5s delay)
 * 3. When debounce completes, triggers parallel writes to both storage layers
 * 4. Persistence promises are stored in atoms for workflow coordination
 */

import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import atomWithDebounce from "./utils";
import { documentAtomFamily, type Document } from "./documents.atoms";

/**
 * Persistence Result Type
 */
export type PersistenceResult = {
  sessionSuccess: boolean;
  localSuccess: boolean;
  errors: Array<{ type: "session" | "local"; error: any }>;
};

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
 * Atom Family: SessionStorage persistence promise storage
 *
 * Stores the current sessionStorage persistence promise for a document.
 */
export const sessionStoragePersistenceAtomFamily = (id: string) => {
  const promiseAtom = atom<Promise<void> | null>(null);
  promiseAtom.debugLabel = `sessionPersistence:${id}`;
  return promiseAtom;
};

/**
 * Atom Family: LocalStorage persistence promise storage
 *
 * Stores the current localStorage persistence promise for a document.
 */
export const localStoragePersistenceAtomFamily = (id: string) => {
  const promiseAtom = atom<Promise<void> | null>(null);
  promiseAtom.debugLabel = `localPersistence:${id}`;
  return promiseAtom;
};

/**
 * Atom Family: Document debouncer
 *
 * Creates a debouncer for a document's changes (1.5s delay).
 */
export const documentDebouncerFamily = (id: string) => {
  const debouncer = atomWithDebounce<Document | null>(
    null,
    1500, // 1.5 second debounce delay
    false // don't debounce on reset to null
  );
  debouncer.debouncedValueAtom.debugLabel = `documentDebouncer:${id}`;
  return debouncer;
};

/**
 * Atom Family: Persistence effect for a document
 *
 * Watches the document and writes changes to the debouncer.
 */
export const documentPersistenceEffectFamily = (id: string) => {
  const effectAtom = atomEffect((get, set) => {
    const document = get(documentAtomFamily(id));

    if (!document) {
      return;
    }

    console.log(`[Persistence] [${id}] Change detected: ${document.title}`);

    // Write to debouncer - this will trigger the debounce timer
    const debouncer = documentDebouncerFamily(id);
    set(debouncer.debouncedValueAtom, document);

    // Cleanup function to clear debounce on unmount
    return () => {
      set(debouncer.clearTimeoutAtom, null);
    };
  });
  effectAtom.debugLabel = `persistenceEffect:${id}`;
  return effectAtom;
};

/**
 * Atom Family: Debounce trigger effect for a document
 *
 * Watches the debounced value and triggers parallel persistence to both storage layers.
 */
export const documentDebounceTriggerEffectFamily = (id: string) => {
  const effectAtom = atomEffect((get, set) => {
    const debouncer = documentDebouncerFamily(id);
    const document = get(debouncer.debouncedValueAtom);

    if (!document) {
      return;
    }

    console.log(
      `[Persistence] [${id}] Debounce complete, triggering persistence for: ${document.title}`
    );

    // Create persistence promises
    const sessionPromise = persistToSessionStorage(document).catch((error) => {
      console.error(
        `[Persistence] [${id}] SessionStorage persist failed:`,
        error
      );
      throw error;
    });

    const localPromise = persistToLocalStorage(document).catch((error) => {
      console.error(
        `[Persistence] [${id}] LocalStorage persist failed:`,
        error
      );
      throw error;
    });

    // Store promises in atoms
    set(sessionStoragePersistenceAtomFamily(id), sessionPromise);
    set(localStoragePersistenceAtomFamily(id), localPromise);

    // Clean up promises when complete
    Promise.allSettled([sessionPromise, localPromise]).then(() => {
      set(sessionStoragePersistenceAtomFamily(id), null);
      set(localStoragePersistenceAtomFamily(id), null);
    });
  });
  effectAtom.debugLabel = `debounceTrigger:${id}`;
  return effectAtom;
};
