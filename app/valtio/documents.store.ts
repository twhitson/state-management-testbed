/**
 * @fileoverview Valtio Documents Store
 *
 * This file demonstrates using Valtio for managing complex async workflows
 * with proxy-based reactive state and proxyMap for efficient collection management.
 *
 * Key concepts demonstrated:
 * - proxyMap() for document collection (efficient Map-based storage with reactivity)
 * - proxy() for nested objects (pages, workspace references)
 * - Direct mutation syntax (no set() or reducers needed)
 * - Async operations as regular async functions
 * - Optimistic updates (updating state before async operations complete)
 * - Cross-store communication (with workspaces)
 */

import { proxyMap } from "valtio/utils";
import { workspacesState, type Workspace } from "./workspaces.store";

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

/**
 * Documents State: Using proxyMap for efficient document management
 *
 * @remarks
 * proxyMap is Valtio's reactive Map implementation that provides:
 * - O(1) lookups, insertions, and deletions
 * - Natural iteration with .forEach(), .keys(), .values(), .entries()
 * - Full reactivity - components re-render when documents change
 * - Automatic structural sharing for performance
 *
 * This is more efficient than using a proxy with Record/object for large collections.
 *
 * @example
 * ```tsx
 * // In a component:
 * const documentsSnap = useSnapshot(documentsState);
 * const docIds = Array.from(documentsSnap.keys());
 * const doc = documentsSnap.get(id);
 * ```
 */
export const documentsState = proxyMap<string, Document>();

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
 * Action: Create a new document
 *
 * @remarks
 * This is the main async action that handles the entire document creation workflow.
 * When called, it:
 * 1. Generates document data with a unique ID
 * 2. Optimistically adds the document to state (UI updates immediately)
 * 3. Creates the document's directory on the file system
 * 4. Creates a default page for the document
 * 5. Updates the document with the page
 *
 * Note: With Valtio, we mutate the proxyMap directly - no set() calls needed!
 *
 * @example
 * ```tsx
 * // In a component:
 * <button onClick={createDocument}>Create Document</button>
 * ```
 */
export async function createDocument() {
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
    // With Valtio, we just call .set() on the proxyMap
    // This makes the UI feel responsive by showing the document right away,
    // even before any async operations complete
    documentsState.set(id, document);

    // Step 1: Create the document's directory on the file system
    const path = await createDocumentDirectory(id);

    // Step 2: Create a default page for the document
    const { page } = await createPage(id, path);

    // ⚡ OPTIMISTIC UPDATE #2: Add page to document
    // We can directly mutate the document's pages array
    const doc = documentsState.get(id);
    if (doc) {
      doc.pages.push(page);
    }

    console.log("Created document", document);

    return document;
  } catch (error) {
    console.error("Failed to create document:", error);
    // Error handling: In a production app, you might:
    // - Remove the optimistically added document
    // - Show a notification to the user
    throw error;
  }
}

/**
 * Action: Rename a document
 *
 * @remarks
 * This action updates the title of a document.
 * With Valtio, we can directly mutate the document object.
 *
 * @param documentId - The document ID to rename
 * @param newTitle - The new title for the document
 *
 * @example
 * ```tsx
 * <button onClick={() => renameDocument(id, 'New Title')}>Rename</button>
 * ```
 */
export function renameDocument(documentId: string, newTitle: string) {
  const document = documentsState.get(documentId);

  if (document) {
    // Direct mutation - Valtio handles reactivity automatically
    document.title = newTitle;
  }
}

/**
 * Action: Add a document to a workspace
 *
 * @remarks
 * This action adds a workspace reference to a document.
 * It requires the workspaces state to be available.
 *
 * @param documentId - The document ID to add to a workspace
 * @param workspaceId - The workspace ID to add the document to
 *
 * @example
 * ```tsx
 * <button onClick={() => addDocumentToWorkspace(docId, wsId)}>
 *   Add to Workspace
 * </button>
 * ```
 */
export function addDocumentToWorkspace(
  documentId: string,
  workspaceId: string
) {
  const document = documentsState.get(documentId);
  const workspace = workspacesState.get(workspaceId);

  if (!workspace) {
    console.warn(`Workspace ${workspaceId} not found`);
    return;
  }

  if (document && !document.workspaces.some((ws) => ws.id === workspace.id)) {
    // Direct mutation - just push to the array
    document.workspaces.push(workspace);
  }
}
