/**
 * @fileoverview Jotai Persistence Manager
 *
 * This file manages the lifecycle of persistence effects for all documents.
 * It watches for new documents and mounts their persistence effects automatically.
 */

import { atom, getDefaultStore } from "jotai";
import { atomEffect } from "jotai-effect";
import { documentIdsAtom } from "./documents.atoms";
import {
  documentPersistenceEffectFamily,
  documentDebounceTriggerEffectFamily,
} from "./persistence.atoms";

/**
 * Get the default Jotai store
 */
const getStore = () => getDefaultStore();

/**
 * Persistence Manager Atom
 *
 * This atom uses atomEffect to:
 * 1. Watch documentIdsAtom for changes (new documents, removed documents)
 * 2. Mount persistence effects for new documents
 * 3. Track subscriptions for cleanup
 */
export const persistenceManagerAtom = atomEffect((get, set) => {
  const documentIds = get(documentIdsAtom);
  const store = getStore();

  // Track mounted effects
  const mounted = new Set<string>();
  const subscriptions = new Map<string, Array<() => void>>();

  console.log(
    `[PersistenceManager] Initializing for ${documentIds.length} documents`
  );

  // Mount effects for all current documents
  documentIds.forEach((id) => {
    if (!mounted.has(id)) {
      console.log(
        `[PersistenceManager] Mounting persistence for document ${id}`
      );

      const persistenceEffect = documentPersistenceEffectFamily(id);
      const debounceTriggerEffect = documentDebounceTriggerEffectFamily(id);

      // Subscribe to both effects to activate them
      const unsubscribe1 = store.sub(persistenceEffect, () => {});
      const unsubscribe2 = store.sub(debounceTriggerEffect, () => {});

      subscriptions.set(id, [unsubscribe1, unsubscribe2]);
      mounted.add(id);
    }
  });

  // Cleanup function
  return () => {
    console.log(`[PersistenceManager] Cleaning up persistence effects`);

    // Unsubscribe from all effects
    subscriptions.forEach((unsubs, id) => {
      console.log(
        `[PersistenceManager] Unmounting persistence for document ${id}`
      );
      unsubs.forEach((unsub) => unsub());
    });

    subscriptions.clear();
    mounted.clear();
  };
});
persistenceManagerAtom.debugLabel = "persistenceManager";
