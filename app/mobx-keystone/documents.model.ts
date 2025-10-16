/**
 * @fileoverview MobX-Keystone Documents Model
 *
 * This file demonstrates using mobx-keystone for managing complex async workflows
 * with observable models and actions.
 *
 * Key concepts demonstrated:
 * - Model definitions with runtime type validation
 * - Observable state with MobX
 * - Actions and flows for async operations
 * - Optimistic updates (updating UI before async operations complete)
 * - Error handling with try/catch in flows
 * - Type-safe models with TypeScript
 *
 * Comparison with other libraries:
 * - More structured than Zustand (models vs plain objects)
 * - Less boilerplate than Redux (no reducers, actions are methods)
 * - Runtime type validation unlike plain MobX
 * - Flows (async actions) similar to Redux Thunks but with generators
 * - Automatic observability like MobX
 */

import { model, Model, prop, modelAction, modelFlow, _async, _await } from "mobx-keystone";

/**
 * Page model representing a single page within a document.
 *
 * @remarks
 * Models in mobx-keystone are classes decorated with @model that define
 * the shape of your data with runtime type validation.
 */
@model("state-management-testbed/Page")
export class Page extends Model({
  id: prop<string>(),
  title: prop<string>(),
  content: prop<string>(),
}) {}

/**
 * Document model representing a document with pages.
 *
 * @remarks
 * Documents can contain multiple pages and can belong to multiple workspaces.
 * The workspaceIds array maintains the many-to-many relationship.
 */
@model("state-management-testbed/Document")
export class Document extends Model({
  id: prop<string>(),
  path: prop<string>(),
  title: prop<string>(),
  pages: prop<Page[]>(() => []),
  workspaceIds: prop<string[]>(() => []),
}) {
  /**
   * Adds a page to this document.
   *
   * @remarks
   * Model actions are methods that can modify the model's state.
   * They are automatically wrapped in MobX actions for proper reactivity.
   *
   * @param page - The page to add
   *
   * @example
   * ```ts
   * const page = new Page({ id: 'p1', title: 'New Page', content: '' });
   * document.addPage(page);
   * ```
   */
  @modelAction
  addPage(page: Page) {
    this.pages.push(page);
  }

  /**
   * Adds this document to a workspace.
   *
   * @remarks
   * This updates the workspaceIds array if the workspace isn't already included.
   *
   * @param workspaceId - The workspace ID to add
   *
   * @example
   * ```ts
   * document.addToWorkspace('workspace-1');
   * ```
   */
  @modelAction
  addToWorkspace(workspaceId: string) {
    if (!this.workspaceIds.includes(workspaceId)) {
      this.workspaceIds.push(workspaceId);
    }
  }
}

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
 * @param document - The document to add the page to
 * @param path - The parent document's directory path
 * @returns Promise that resolves when page creation is complete
 * @throws If page directory creation fails
 * @throws If writing page contents fails
 *
 * @example
 * ```ts
 * await createPageAction(document, 'C:/Users/trey/doc-123');
 * ```
 */
async function createPageAction(document: Document, path: string): Promise<void> {
  try {
    const pageId = crypto.randomUUID();

    const page = new Page({
      id: pageId,
      title: "New Page",
      content: "",
    });

    // ⚡ OPTIMISTIC UPDATE #2: Add page to document immediately
    // The page appears in the UI right away, improving perceived performance
    document.addPage(page);

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
 * Documents store model for managing all documents.
 *
 * @remarks
 * This is the root model for the documents domain. It uses a Record (plain object)
 * to store documents by their ID for efficient lookups. MobX will automatically track
 * changes to this object and trigger re-renders in React components.
 */
@model("state-management-testbed/DocumentsStore")
export class DocumentsStore extends Model({
  documents: prop<Record<string, Document>>(() => ({})),
}) {
  /**
   * Adds a document to the store.
   *
   * @remarks
   * Called optimistically from createDocument before any async
   * operations complete. This makes the UI feel more responsive.
   *
   * @param document - The document to add
   *
   * @example
   * ```ts
   * const doc = new Document({ id: 'doc-123', path: '...', title: 'New Doc' });
   * documentsStore.addDocument(doc);
   * ```
   */
  @modelAction
  addDocument(document: Document) {
    this.documents[document.id] = document;
  }

  /**
   * Creates a new document with a default page.
   *
   * @remarks
   * This is a model flow - mobx-keystone's way of handling async operations.
   * Flows use generator functions (like sagas) but are simpler to write.
   * They automatically handle MobX transactions and allow you to yield promises.
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
   * await documentsStore.createDocument();
   * ```
   */
  @modelFlow
  createDocument = _async(function* (this: DocumentsStore) {
    try {
      console.log("Creating document");

      // Generate document data
      const id = crypto.randomUUID();
      const document = new Document({
        id,
        path: `C:/Users/trey/${id}`,
        title: "New Document",
      });

      // ⚡ OPTIMISTIC UPDATE #1: Add document to state immediately
      // This makes the UI feel responsive by showing the document right away,
      // even before any async operations complete
      this.addDocument(document);

      // Step 1: Create the document's directory on the file system
      // _await is mobx-keystone's way to await promises in a flow
      const path: string = yield* _await(createDocumentDirectory(id));

      // Step 2: Create a default page for the document
      yield* _await(createPageAction(document, path));

      console.log("Created document", document);
    } catch (error) {
      console.error("Failed to create document:", error);
      // Error handling: In a production app, you might:
      // - Remove the optimistically added document
      // - Show a notification to the user
      // For now, we just log the error to match the other implementations
    }
  });

  /**
   * Gets a document by ID.
   *
   * @param id - The document ID
   * @returns The document or undefined if not found
   *
   * @example
   * ```ts
   * const doc = documentsStore.getDocument('doc-123');
   * ```
   */
  getDocument(id: string): Document | undefined {
    return this.documents[id];
  }

  /**
   * Gets all documents as an array.
   *
   * @remarks
   * This is a computed-like getter that converts the object to an array.
   * MobX will automatically track access to this.documents.
   *
   * @returns Array of all documents
   *
   * @example
   * ```ts
   * const allDocs = documentsStore.getAllDocuments();
   * ```
   */
  getAllDocuments(): Document[] {
    return Object.values(this.documents);
  }
}
