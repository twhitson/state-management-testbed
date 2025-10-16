/**
 * @fileoverview Zustand Documents Store
 *
 * This file demonstrates using Zustand for managing complex async workflows
 * with a simple, direct API without the need for middleware or additional libraries.
 *
 * Key concepts demonstrated:
 * - Simple store creation with create()
 * - Direct state mutations (no reducers needed)
 * - Async actions as regular async functions
 * - Optimistic updates (updating UI before async operations complete)
 * - Error handling with try/catch in async actions
 * - Multiple independent stores (workspaces are in a separate store)
 *
 * Comparison with Redux Thunks and Sagas:
 * - Much simpler API - no dispatch(), no actions, just direct function calls
 * - No middleware or configuration needed
 * - State updates are direct mutations within set()
 * - Async operations are just regular async/await (like thunks)
 * - Less boilerplate than both thunks and sagas
 * - Multiple stores instead of single store with slices
 */

import { create } from "zustand";

type Document = {
  id: string;
  path: string;
  title: string;
  pages: Page[];
  workspaceIds: string[];
};

type Page = {
  id: string;
  title: string;
  content: string;
};

type DocumentsState = Record<string, Document>;

type DocumentsStore = {
  documents: DocumentsState;
  addDocument: (document: Document) => void;
  addPage: (documentId: string, page: Page) => void;
  createDocument: () => Promise<void>;
  addDocumentToWorkspace: (documentId: string, workspaceId: string) => void;
};

/**
 * Creates a directory for a document on the file system.
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
 * const path = await createDocumentDirectory('doc-123');
 * // path === 'C:/Users/trey/doc-123'
 * ```
 */
async function createDocumentDirectory(id: string): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return `C:/Users/trey/${id}`;
}

/**
 * Creates a directory for a page within a document's directory structure.
 *
 * @param path - The parent document's directory path
 * @param id - The page ID to create a directory for
 * @returns The path to the created page directory
 *
 * @example
 * ```ts
 * const pagePath = await createPageDirectory('C:/Users/trey/doc-123', 'page-456');
 * // pagePath === 'C:/Users/trey/doc-123/page-456'
 * ```
 */
async function createPageDirectory(path: string, id: string): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return `${path}/${id}`;
}

/**
 * Writes the initial content to a page file.
 *
 * @remarks
 * ⚠️ NOTE: This intentionally throws an error to demonstrate error handling!
 *
 * @param path - The page directory path
 * @param content - The content to write to the page
 * @returns Promise that resolves when write is complete
 * @throws Always throws "LOL" error for demonstration purposes
 *
 * @example
 * ```ts
 * try {
 *   await writePageContents('/path/to/page', '');
 * } catch (error) {
 *   console.error('Expected error:', error); // "LOL"
 * }
 * ```
 */
async function writePageContents(path: string, content: string): Promise<void> {
  throw new Error("LOL");
  // Simulate network delay (unreachable due to error above)
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Creates a page within a document.
 *
 * @remarks
 * This function orchestrates multiple operations:
 * 1. ⚡ OPTIMISTIC UPDATE: Adds the page to state immediately
 * 2. Creates the page directory on the file system
 * 3. Writes the page contents to disk
 *
 * @param documentId - The ID of the document to add the page to
 * @param path - The parent document's directory path
 * @param addPage - Store action to add the page
 * @returns Promise that resolves when page creation is complete
 * @throws If page directory creation fails
 * @throws If writing page contents fails
 *
 * @example
 * ```ts
 * await createPageAction('doc-123', 'C:/Users/trey/doc-123', store.addPage);
 * ```
 */
async function createPageAction(
  documentId: string,
  path: string,
  addPage: (documentId: string, page: Page) => void,
): Promise<void> {
  try {
    const pageId = crypto.randomUUID();

    const page: Page = {
      id: pageId,
      title: "New Page",
      content: "",
    };

    // ⚡ OPTIMISTIC UPDATE #2: Add page to document immediately
    // The page appears in the UI right away, improving perceived performance
    addPage(documentId, page);

    // Step 1: Create the page's directory
    const pagePath = await createPageDirectory(path, pageId);

    // Step 2: Write the page contents to disk
    // This will throw an error, demonstrating error handling
    await writePageContents(pagePath, "");

    console.log("Created page", page);
  } catch (error) {
    console.error("Failed to create page:", error);
    // In a production app, you might:
    // - Remove the optimistically added page
    // - Show a notification to the user
    throw error; // Re-throw to propagate to parent
  }
}

/**
 * Zustand store for managing documents.
 *
 * This store demonstrates Zustand's simple API for state management.
 * Unlike Redux, you don't need reducers, actions, or dispatch - you just
 * call store methods directly from your components.
 *
 * @remarks
 * - State updates happen within set() callback
 * - You can directly mutate state inside set() with immer-like syntax
 * - Async operations are just regular async functions
 * - Components subscribe to state changes automatically
 *
 * @example
 * ```ts
 * // In a component:
 * const createDocument = useDocumentsStore((state) => state.createDocument);
 * const documents = useDocumentsStore((state) => state.documents);
 * ```
 */
export const useDocumentsStore = create<DocumentsStore>((set, get) => ({
  documents: {},

  /**
   * Adds a document to the state.
   *
   * @remarks
   * Called optimistically from createDocument before any async
   * operations complete. This makes the UI feel more responsive.
   *
   * @param document - The document to add
   *
   * @example
   * ```ts
   * const addDocument = useDocumentsStore((state) => state.addDocument);
   * addDocument({ id: 'doc-123', path: '...', title: 'New Doc', pages: [] });
   * ```
   */
  addDocument: (document: Document) => {
    set((state) => ({
      documents: {
        ...state.documents,
        [document.id]: document,
      },
    }));
  },

  /**
   * Adds a page to an existing document.
   *
   * @remarks
   * Called optimistically from createDocument before any async
   * operations complete.
   *
   * @param documentId - The document ID to add the page to
   * @param page - The page to add
   *
   * @example
   * ```ts
   * const addPage = useDocumentsStore((state) => state.addPage);
   * addPage('doc-123', { id: 'page-456', title: 'New Page', content: '' });
   * ```
   */
  addPage: (documentId: string, page: Page) => {
    set((state) => ({
      documents: {
        ...state.documents,
        [documentId]: {
          ...state.documents[documentId],
          pages: [...state.documents[documentId].pages, page],
        },
      },
    }));
  },

  /**
   * Creates a new document with a default page.
   *
   * @remarks
   * This is the main async action that orchestrates the entire document creation workflow.
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
   * @returns Promise that resolves when document creation is complete
   *
   * @example
   * ```ts
   * const createDocument = useDocumentsStore((state) => state.createDocument);
   * await createDocument();
   * ```
   */
  createDocument: async () => {
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
      get().addDocument(document);

      // Step 1: Create the document's directory on the file system
      const path = await createDocumentDirectory(id);

      // Step 2: Create a default page for the document
      await createPageAction(id, path, get().addPage);

      console.log("Created document", document);
    } catch (error) {
      console.error("Failed to create document:", error);
      // Error handling: In a production app, you might:
      // - Remove the optimistically added document
      // - Show a notification to the user
      // For now, we just log the error to match the thunk/saga behavior
    }
  },

  /**
   * Adds a document to a workspace by adding the workspaceId to the document's workspaceIds array.
   *
   * @param documentId - The document ID
   * @param workspaceId - The workspace ID to add
   *
   * @example
   * ```ts
   * const addDocumentToWorkspace = useDocumentsStore((state) => state.addDocumentToWorkspace);
   * addDocumentToWorkspace('doc-123', 'workspace-1');
   * ```
   */
  addDocumentToWorkspace: (documentId: string, workspaceId: string) => {
    set((state) => {
      const document = state.documents[documentId];
      if (document && !document.workspaceIds.includes(workspaceId)) {
        return {
          documents: {
            ...state.documents,
            [documentId]: {
              ...document,
              workspaceIds: [...document.workspaceIds, workspaceId],
            },
          },
        };
      }
      return state;
    });
  },
}));
