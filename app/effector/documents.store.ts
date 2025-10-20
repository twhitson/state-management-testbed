/**
 * @fileoverview Effector Documents Store
 *
 * This file demonstrates using Effector for managing complex async workflows
 * with explicit event-driven architecture and functional reactive programming.
 *
 * Key concepts demonstrated:
 * - Events for triggering actions (createDocumentRequested)
 * - Effects for async operations (createDocumentDirectoryFx, createPageDirectoryFx)
 * - Stores for state management ($documents)
 * - Event handlers with sample() for connecting events to effects
 * - Optimistic updates (updating state before async operations complete)
 * - Error handling with effect.fail events
 * - Chaining effects together with sample() and attach()
 *
 * Comparison with Redux and Zustand:
 * - More explicit than Redux - events, effects, and stores are separate units
 * - More structured than Zustand - clear separation of concerns
 * - Better TypeScript inference than both
 * - Reactive programming model - changes flow through the system automatically
 * - No dispatch() needed - just call events directly
 * - Effects are first-class citizens for async operations
 */

import { createEffect, createEvent, createStore, sample } from "effector";

export type Document = {
  id: string;
  path: string;
  title: string;
  pages: Page[];
  workspaceIds: string[];
};

export type Page = {
  id: string;
  title: string;
  content: string;
};

export type DocumentsState = Record<string, Document>;

/**
 * Events - trigger actions in the system
 *
 * Events are the primary way to trigger state changes in Effector.
 * Unlike Redux actions, they're just function calls - no dispatch() needed.
 */

/**
 * Event: Request to create a new document
 *
 * @remarks
 * This is the entry point for document creation. When called, it triggers
 * the entire document creation workflow.
 *
 * @example
 * ```ts
 * createDocumentRequested();
 * ```
 */
export const createDocumentRequested = createEvent("createDocumentRequested");

/**
 * Event: Add a document to state (used for optimistic updates)
 *
 * @example
 * ```ts
 * documentAdded({ id: 'doc-123', path: '...', title: 'New Doc', pages: [], workspaceIds: [] });
 * ```
 */
export const documentAdded = createEvent<Document>("documentAdded");

/**
 * Event: Add a page to a document (used for optimistic updates)
 *
 * @example
 * ```ts
 * pageAdded({ documentId: 'doc-123', page: { id: 'page-456', title: 'New Page', content: '' } });
 * ```
 */
export const pageAdded = createEvent<{
  documentId: string;
  page: Page;
}>("pageAdded");

/**
 * Event: Add a document to a workspace
 *
 * @example
 * ```ts
 * documentAddedToWorkspace({ documentId: 'doc-123', workspaceId: 'workspace-1' });
 * ```
 */
export const documentAddedToWorkspace = createEvent<{
  documentId: string;
  workspaceId: string;
}>("documentAddedToWorkspace");

/**
 * Effects - async operations
 *
 * Effects in Effector represent side effects (async operations, API calls, etc.).
 * They have three events: .done, .fail, and .finally for handling different outcomes.
 */

/**
 * Effect: Creates a directory for a document on the file system.
 *
 * @remarks
 * Simulates a file system operation to create a directory for the document.
 * In a real application, this would make an API call to a backend service.
 *
 * @param id - The document ID to create a directory for
 * @returns The path to the created directory
 *
 * @example
 * ```ts
 * const path = await createDocumentDirectoryFx('doc-123');
 * // path === 'C:/Users/trey/doc-123'
 * ```
 */
export const createDocumentDirectoryFx = createEffect<string, string>(
  async (id: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return `C:/Users/trey/${id}`;
  }
);

/**
 * Effect: Creates a directory for a page within a document's directory structure.
 *
 * @param input.path - The parent document's directory path
 * @param input.id - The page ID to create a directory for
 * @returns The path to the created page directory
 *
 * @example
 * ```ts
 * const pagePath = await createPageDirectoryFx({ path: 'C:/Users/trey/doc-123', id: 'page-456' });
 * // pagePath === 'C:/Users/trey/doc-123/page-456'
 * ```
 */
export const createPageDirectoryFx = createEffect<
  { path: string; id: string },
  string
>(async ({ path, id }) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return `${path}/${id}`;
});

/**
 * Effect: Writes the initial content to a page file.
 *
 * @remarks
 * ⚠️ NOTE: This intentionally throws an error to demonstrate error handling!
 *
 * @param input.path - The page directory path
 * @param input.content - The content to write to the page
 * @returns Promise that resolves when write is complete
 * @throws Always throws "LOL" error for demonstration purposes
 *
 * @example
 * ```ts
 * try {
 *   await writePageContentsFx({ path: '/path/to/page', content: '' });
 * } catch (error) {
 *   console.error('Expected error:', error); // "LOL"
 * }
 * ```
 */
export const writePageContentsFx = createEffect<
  { path: string; content: string },
  void
>(async ({ path, content }) => {
  throw new Error("LOL");
  // Simulate network delay (unreachable due to error above)
  await new Promise((resolve) => setTimeout(resolve, 100));
});

/**
 * Effect: Creates a page within a document.
 *
 * @remarks
 * This effect orchestrates multiple operations:
 * 1. ⚡ OPTIMISTIC UPDATE: Adds the page to state immediately
 * 2. Creates the page directory on the file system
 * 3. Writes the page contents to disk
 *
 * @param input.documentId - The ID of the document to add the page to
 * @param input.path - The parent document's directory path
 * @returns The created page info
 * @throws If page directory creation fails
 * @throws If writing page contents fails
 */
export const createPageFx = createEffect<
  { documentId: string; path: string },
  { documentId: string; page: Page }
>(async ({ documentId, path }) => {
  try {
    const pageId = crypto.randomUUID();

    const page: Page = {
      id: pageId,
      title: "New Page",
      content: "",
    };

    // ⚡ OPTIMISTIC UPDATE #2: Add page to document immediately
    // The page appears in the UI right away, improving perceived performance
    pageAdded({ documentId, page });

    // Step 1: Create the page's directory
    const pagePath = await createPageDirectoryFx({ path, id: pageId });

    // Step 2: Write the page contents to disk
    // This will throw an error, demonstrating error handling
    await writePageContentsFx({ path: pagePath, content: "" });

    console.log("Created page", page);

    return { documentId, page };
  } catch (error) {
    console.error("Failed to create page:", error);
    // In a production app, you might:
    // - Remove the optimistically added page
    // - Show a notification to the user
    throw error; // Re-throw to propagate to effect.fail
  }
});

/**
 * Effect: Creates a new document with a default page.
 *
 * @remarks
 * This is the main effect that orchestrates the entire document creation workflow.
 * It demonstrates:
 * 1. ⚡ OPTIMISTIC UPDATE: Adding the document to state immediately
 * 2. Chaining multiple async operations sequentially
 * 3. Error handling at each step
 *
 * The workflow:
 * 1. Generate document data with a unique ID
 * 2. Optimistically add the document to state (UI updates immediately)
 * 3. Create the document's directory on the file system
 * 4. Create a default page for the document
 *
 * @returns The created document
 * @throws If document directory creation fails
 * @throws If page creation fails
 */
export const createDocumentFx = createEffect<void, Document>(async () => {
  try {
    console.log("Creating document");

    // Generate document data
    const id = crypto.randomUUID();
    const document: Document = {
      id,
      path: `C:/Users/trey/${id}`,
      title: "New Document",
      pages: [],
      workspaceIds: [],
    };

    // ⚡ OPTIMISTIC UPDATE #1: Add document to state immediately
    // This makes the UI feel responsive by showing the document right away,
    // even before any async operations complete
    documentAdded(document);

    // Step 1: Create the document's directory on the file system
    const path = await createDocumentDirectoryFx(id);

    // Step 2: Create a default page for the document
    await createPageFx({ documentId: id, path });

    console.log("Created document", document);

    return document;
  } catch (error) {
    console.error("Failed to create document:", error);
    // Error handling: In a production app, you might:
    // - Remove the optimistically added document
    // - Show a notification to the user
    // For now, we just log the error to match the other examples
    throw error;
  }
});

/**
 * Store - the state container
 *
 * Stores in Effector are reactive state containers. They automatically
 * update when events occur and notify subscribers.
 *
 * The $ prefix is a convention to distinguish stores from other values.
 */

/**
 * Store: Documents state
 *
 * @remarks
 * This store holds all documents in a Record<string, Document> format
 * for easy lookup by ID.
 *
 * @example
 * ```ts
 * // In a component:
 * const documents = useStore($documents);
 * ```
 */
export const $documents = createStore<DocumentsState>({})
  .on(documentAdded, (state, document) => ({
    ...state,
    [document.id]: document,
  }))
  .on(pageAdded, (state, { documentId, page }) => ({
    ...state,
    [documentId]: {
      ...state[documentId],
      pages: [...state[documentId].pages, page],
    },
  }))
  .on(documentAddedToWorkspace, (state, { documentId, workspaceId }) => {
    const document = state[documentId];
    if (document && !document.workspaceIds.includes(workspaceId)) {
      return {
        ...state,
        [documentId]: {
          ...document,
          workspaceIds: [...document.workspaceIds, workspaceId],
        },
      };
    }
    return state;
  });

/**
 * Connecting events to effects with sample()
 *
 * sample() is Effector's way of connecting events together.
 * When createDocumentRequested is called, it triggers createDocumentFx.
 *
 * This is similar to Redux middleware or saga watchers, but more explicit
 * and type-safe.
 */
sample({
  clock: createDocumentRequested,
  target: createDocumentFx,
});

/**
 * Error handling
 *
 * Effects have built-in .fail events for error handling.
 * You can listen to these events to show notifications, rollback optimistic updates, etc.
 */
createDocumentFx.fail.watch(({ error }) => {
  console.error("Document creation failed:", error);
  // In a production app, you might dispatch an event to show a notification
});

createPageFx.fail.watch(({ error }) => {
  console.error("Page creation failed:", error);
  // In a production app, you might dispatch an event to show a notification
});
