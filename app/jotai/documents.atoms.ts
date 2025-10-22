/**
 * @fileoverview Jotai Documents Atoms
 *
 * This file demonstrates using Jotai for managing complex async workflows
 * with atoms and derived atoms.
 *
 * Key concepts demonstrated:
 * - Primitive atoms for state management (documentsAtom)
 * - Atom actions for triggering updates
 * - Async operations within atom setters
 * - Optimistic updates (updating state before async operations complete)
 * - Cross-atom communication (with workspaces)
 */

import { atom } from "jotai";
import { workspacesAtom, type Workspace } from "./workspaces.atoms";

export type Document = {
  id: string;
  path: string;
  title: string;
  pages: Page[];
  workspaces: Workspace[];
};

export type Page = {
  id: string;
  title: string;
  content: string;
};

export type DocumentsState = Record<string, Document>;

/**
 * Primitive Atom: Documents state
 *
 * @remarks
 * This is the primary atom that holds all documents in a Record<string, Document> format
 * for easy lookup by ID.
 *
 * @example
 * ```tsx
 * // In a component:
 * const documents = useAtomValue(documentsAtom);
 * ```
 */
export const documentsAtom = atom<DocumentsState>({});
documentsAtom.debugLabel = "documents";

/**
 * Derived Atom: Get document IDs
 *
 * @remarks
 * This atom returns an array of document IDs.
 * Components can map over this to render individual document components.
 *
 * @example
 * ```tsx
 * const documentIds = useAtomValue(documentIdsAtom);
 * return documentIds.map(id => <DocumentItem key={id} id={id} />);
 * ```
 */
export const documentIdsAtom = atom((get) => {
  const documents = get(documentsAtom);
  return Object.keys(documents);
});
documentIdsAtom.debugLabel = "documentIds";

/**
 * Derived Atom Factory: Get a specific document by ID
 *
 * @remarks
 * This is an atom factory that creates a derived atom for a specific document.
 * Each created atom only updates when that specific document changes.
 * This enables fine-grained reactivity - only the component for the changed
 * document will re-render.
 *
 * @param id - The document ID
 * @returns An atom that contains the document or undefined
 *
 * @example
 * ```tsx
 * // In a component:
 * function DocumentItem({ id }: { id: string }) {
 *   const document = useAtomValue(documentAtomFamily(id));
 *   // This component only re-renders when THIS document changes
 * }
 * ```
 */
export const documentAtomFamily = (id: string) => {
  const documentAtom = atom((get) => {
    const documents = get(documentsAtom);
    return documents[id];
  });
  documentAtom.debugLabel = `document:${id}`;
  return documentAtom;
};

/**
 * Helper function: Creates a directory for a document on the file system
 *
 * @param id - The document ID to create a directory for
 * @returns The path to the created directory
 */
async function createDocumentDirectory(id: string): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return `C:/Users/trey/${id}`;
}

/**
 * Helper function: Creates a directory for a page within a document's directory structure
 *
 * @param path - The parent document's directory path
 * @param id - The page ID to create a directory for
 * @returns The path to the created page directory
 */
async function createPageDirectory(path: string, id: string): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return `${path}/${id}`;
}

/**
 * Helper function: Writes the initial content to a page file
 *
 * @param path - The page directory path
 * @param content - The content to write to the page
 */
async function writePageContents(path: string, content: string): Promise<void> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Helper function: Creates a page within a document
 *
 * @remarks
 * This function orchestrates multiple operations:
 * 1. Creates the page directory on the file system
 * 2. Writes the page contents to disk
 *
 * @param documentId - The ID of the document to add the page to
 * @param path - The parent document's directory path
 * @returns The created page info
 */
async function createPage(
  documentId: string,
  path: string
): Promise<{ documentId: string; page: Page }> {
  try {
    const pageId = crypto.randomUUID();

    const page: Page = {
      id: pageId,
      title: "New Page",
      content: "",
    };

    // Step 1: Create the page's directory
    const pagePath = await createPageDirectory(path, pageId);

    // Step 2: Write the page contents to disk
    await writePageContents(pagePath, "");

    console.log("Created page", page);

    return { documentId, page };
  } catch (error) {
    console.error("Failed to create page:", error);
    throw error;
  }
}

/**
 * Write-only Atom: Create a new document
 *
 * @remarks
 * This is a write-only atom that handles the entire document creation workflow.
 * When set, it:
 * 1. Generates document data with a unique ID
 * 2. Optimistically adds the document to state (UI updates immediately)
 * 3. Creates the document's directory on the file system
 * 4. Creates a default page for the document
 * 5. Updates the document with the page
 *
 * @example
 * ```tsx
 * const createDocument = useSetAtom(createDocumentAtom);
 * // Later:
 * createDocument();
 * ```
 */
export const createDocumentAtom = atom(null, async (get, set) => {
  try {
    console.log("Creating document");

    // Generate document data
    const id = crypto.randomUUID();
    const document: Document = {
      id,
      path: `C:/Users/trey/${id}`,
      title: "New Document",
      pages: [],
      workspaces: [],
    };

    // ⚡ OPTIMISTIC UPDATE #1: Add document to state immediately
    // This makes the UI feel responsive by showing the document right away,
    // even before any async operations complete
    set(documentsAtom, (prev) => ({
      ...prev,
      [id]: document,
    }));

    // Step 1: Create the document's directory on the file system
    const path = await createDocumentDirectory(id);

    // Step 2: Create a default page for the document
    const { page } = await createPage(id, path);

    // ⚡ OPTIMISTIC UPDATE #2: Add page to document
    set(documentsAtom, (prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        pages: [page],
      },
    }));

    console.log("Created document", document);

    return document;
  } catch (error) {
    console.error("Failed to create document:", error);
    // Error handling: In a production app, you might:
    // - Remove the optimistically added document
    // - Show a notification to the user
    throw error;
  }
});
createDocumentAtom.debugLabel = "createDocument";

/**
 * Write-only Atom: Rename a document
 *
 * @remarks
 * This atom updates the title of a document.
 *
 * @example
 * ```tsx
 * const renameDocument = useSetAtom(renameDocumentAtom);
 * // Later:
 * renameDocument({ documentId: 'doc-123', newTitle: 'Updated Title' });
 * ```
 */
export const renameDocumentAtom = atom(
  null,
  (
    get,
    set,
    { documentId, newTitle }: { documentId: string; newTitle: string }
  ) => {
    const documents = get(documentsAtom);
    const document = documents[documentId];

    if (document) {
      set(documentsAtom, {
        ...documents,
        [documentId]: {
          ...document,
          title: newTitle,
        },
      });
    }
  }
);
renameDocumentAtom.debugLabel = "renameDocument";

/**
 * Write-only Atom: Add a document to a workspace
 *
 * @remarks
 * This atom adds a workspace reference to a document.
 * It requires the workspaces atom to be available via get().
 *
 * @example
 * ```tsx
 * const addDocumentToWorkspace = useSetAtom(addDocumentToWorkspaceAtom);
 * // Later:
 * addDocumentToWorkspace({ documentId: 'doc-123', workspaceId: 'workspace-1' });
 * ```
 */
export const addDocumentToWorkspaceAtom = atom(
  null,
  async (
    get,
    set,
    { documentId, workspaceId }: { documentId: string; workspaceId: string }
  ) => {
    const documents = get(documentsAtom);
    const workspaces = get(workspacesAtom);

    const document = documents[documentId];
    const workspace = workspaces[workspaceId];

    if (!workspace) {
      console.warn(`Workspace ${workspaceId} not found`);
      return;
    }

    if (document && !document.workspaces.some((ws) => ws.id === workspace.id)) {
      set(documentsAtom, {
        ...documents,
        [documentId]: {
          ...document,
          workspaces: [...document.workspaces, workspace],
        },
      });
    }
  }
);
addDocumentToWorkspaceAtom.debugLabel = "addDocumentToWorkspace";

/**
 * Import persistence atoms for internal use and re-export for workflows
 */
import {
  sessionStoragePersistenceAtomFamily,
  localStoragePersistenceAtomFamily,
  type PersistenceResult,
} from "./persistence.atoms";

export {
  sessionStoragePersistenceAtomFamily,
  localStoragePersistenceAtomFamily,
  type PersistenceResult,
};

/**
 * Write-only Atom: Wait for document persistence
 *
 * @remarks
 * This atom waits for both sessionStorage and localStorage persistence
 * operations to complete for a specific document.
 *
 * @example
 * ```tsx
 * const waitForPersistence = useSetAtom(waitForDocumentPersistenceAtom);
 * const result = await waitForPersistence('doc-123');
 * if (result.errors.length > 0) {
 *   // Handle errors
 * }
 * ```
 */
export const waitForDocumentPersistenceAtom = atom(
  null,
  async (get, set, documentId: string): Promise<PersistenceResult> => {
    const sessionPromise = get(sessionStoragePersistenceAtomFamily(documentId));
    const localPromise = get(localStoragePersistenceAtomFamily(documentId));

    // If no persistence operations are in progress, return success
    if (!sessionPromise && !localPromise) {
      return {
        sessionSuccess: true,
        localSuccess: true,
        errors: [],
      };
    }

    console.log(
      `[Documents] [${documentId}] Waiting for persistence operations...`,
      {
        session: sessionPromise !== null,
        local: localPromise !== null,
      }
    );

    // Wait for all persistence operations
    const results = await Promise.allSettled([
      sessionPromise || Promise.resolve(),
      localPromise || Promise.resolve(),
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

    console.log(`[Documents] [${documentId}] Persistence complete:`, result);

    return result;
  }
);
waitForDocumentPersistenceAtom.debugLabel = "waitForDocumentPersistence";
