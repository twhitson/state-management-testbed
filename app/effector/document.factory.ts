/**
 * @fileoverview Document Factory
 *
 * This file demonstrates using @withease/factories to create Documents.
 * Each document gets its own isolated actor instance that manages all document-specific
 * behaviors including persistence, validation, synchronization, etc.
 *
 * Currently implemented behaviors:
 * 1. SessionStorage persistence (mimicking network operations - 3 seconds)
 * 2. LocalStorage persistence (mimicking disk operations - 5 seconds)
 *
 * Future behaviors could include:
 * - Conflict resolution
 * - Auto-save debouncing
 * - Version history
 * - Collaborative editing state
 * - Document-specific analytics
 *
 * Key concepts demonstrated:
 * - Using createFactory and invoke from @withease/factories
 * - Creating isolated state and effects per document
 * - Actor pattern for document-specific behaviors
 * - Parallel async operations (network + disk)
 */

import { createFactory, invoke } from "@withease/factories";
import { createEffect, createEvent, sample } from "effector";
import { $documents, type Document } from "./documents.store";

/**
 * Factory: Creates a Document for a single document
 *
 * @remarks
 * This factory creates an isolated actor instance that manages all behaviors
 * for a specific document. Each actor has its own state, effects, and event handlers.
 *
 * The actor pattern allows us to:
 * - Encapsulate document-specific logic
 * - Run multiple behaviors independently per document
 * - Scale to thousands of documents without global state conflicts
 * - Add new document behaviors without modifying global state
 *
 * Current behaviors:
 * - sessionStorage persistence: Simulates network persistence (3 seconds)
 * - localStorage persistence: Simulates disk persistence (5 seconds)
 *
 * @param documentId - The ID of the document to create an actor for
 * @returns Object with actor's effects and events
 */
const createDocumentActor = createFactory((documentId: string) => {
  console.log(`[Document] Creating actor for document ${documentId}`);

  /**
   * Event: Triggered when document data changes
   */
  const documentChanged = createEvent<Document>("documentChanged");

  // ============================================================================
  // PERSISTENCE BEHAVIORS
  // ============================================================================

  /**
   * Effect: Persist document to sessionStorage (mimicking network - 3 seconds)
   */
  const persistToSessionStorageFx = createEffect<Document, void>(
    async (document: Document) => {
      console.log(
        `[Document] [${document.id}] Starting network persist (${document.title})...`
      );

      // Simulate 3-second network delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Persist to sessionStorage
      sessionStorage.setItem(
        `document:${document.id}`,
        JSON.stringify(document)
      );

      console.log(
        `[Document] [${document.id}] ✓ Network persist complete (${document.title})`
      );
    }
  );

  /**
   * Effect: Persist document to localStorage (mimicking disk - 5 seconds)
   */
  const persistToLocalStorageFx = createEffect<Document, void>(
    async (document: Document) => {
      console.log(
        `[Document] [${document.id}] Starting disk persist (${document.title})...`
      );

      // Simulate 5-second disk delay
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Persist to localStorage
      localStorage.setItem(`document:${document.id}`, JSON.stringify(document));

      console.log(
        `[Document] [${document.id}] ✓ Disk persist complete (${document.title})`
      );
    }
  );

  // ============================================================================
  // FUTURE BEHAVIORS CAN BE ADDED HERE
  // ============================================================================
  // Examples:
  // - Auto-save debouncing
  // - Conflict detection and resolution
  // - Document validation
  // - Change tracking for undo/redo
  // - Real-time collaboration sync
  // - Document-specific analytics
  // - Version snapshots
  // - Background processing

  // ============================================================================
  // WIRE UP BEHAVIORS
  // ============================================================================

  /**
   * Wire up the persistence behaviors
   *
   * When documentChanged is triggered:
   * 1. Trigger sessionStorage persistence (3 seconds)
   * 2. Trigger localStorage persistence (5 seconds)
   *
   * These run in parallel to simulate real-world scenarios where
   * network and disk operations happen independently.
   */
  sample({
    clock: documentChanged,
    target: persistToSessionStorageFx,
  });

  sample({
    clock: documentChanged,
    target: persistToLocalStorageFx,
  });

  /**
   * Watch for document updates in the global documents store
   *
   * Whenever the documents store updates, check if this document changed
   * and trigger all the document behaviors.
   */
  $documents.watch((documents) => {
    const document = documents[documentId];
    if (document) {
      documentChanged(document);
    }
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  /**
   * Error handling for persistence failures
   */
  persistToSessionStorageFx.fail.watch(({ error }) => {
    console.error(`[Document] [${documentId}] Network persist failed:`, error);
  });

  persistToLocalStorageFx.fail.watch(({ error }) => {
    console.error(`[Document] [${documentId}] Disk persist failed:`, error);
  });

  // ============================================================================
  // STATUS LOGGING (for demonstration)
  // ============================================================================

  /**
   * Loading state logging (optional - for demonstration)
   */
  persistToSessionStorageFx.pending.watch((pending) => {
    if (pending) {
      console.log(`[Document] [${documentId}] Network persist in progress...`);
    }
  });

  persistToLocalStorageFx.pending.watch((pending) => {
    if (pending) {
      console.log(`[Document] [${documentId}] Disk persist in progress...`);
    }
  });

  // Return the actor's public API
  return {
    documentId,
    documentChanged,
    // Persistence behaviors
    persistToSessionStorageFx,
    persistToLocalStorageFx,
    // Future behaviors would be returned here
  };
});

/**
 * Track all created Document instances
 *
 * This map stores the actor instances for each document ID
 * so we can look them up later if needed.
 */
const documentActors = new Map<
  string,
  ReturnType<typeof createDocumentActor>
>();

/**
 * Initialize a Document
 *
 * @remarks
 * This function should be called whenever a new document is created.
 * It will create a new Document instance for that document
 * if one doesn't already exist.
 *
 * The actor handles all document-specific behaviors including persistence,
 * validation, conflict resolution, and any other document-level logic.
 *
 * @param documentId - The ID of the document to initialize an actor for
 * @returns The Document instance
 */
export function initializeDocumentActor(documentId: string) {
  // Check if we already have an actor for this document
  if (documentActors.has(documentId)) {
    console.log(`[Document] Actor already initialized for ${documentId}`);
    return documentActors.get(documentId)!;
  }

  // Create a new Document instance using invoke
  console.log(`[Document] Initializing actor for ${documentId}`);
  const actor = invoke(createDocumentActor, documentId);

  // Store the instance for later reference
  documentActors.set(documentId, actor);

  return actor;
}

/**
 * Get an existing Document
 *
 * @param documentId - The ID of the document
 * @returns The Document instance or undefined if not initialized
 */
export function getDocumentActor(documentId: string) {
  return documentActors.get(documentId);
}

/**
 * Watch the documents store and initialize actors for new documents
 *
 * @remarks
 * This is the main entry point that automatically sets up Documents
 * for all documents as they are created.
 */
$documents.watch((documents) => {
  Object.keys(documents).forEach((documentId) => {
    initializeDocumentActor(documentId);
  });
});
