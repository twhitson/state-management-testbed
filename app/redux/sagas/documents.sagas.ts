/**
 * @fileoverview Redux-Saga Example
 *
 * This file demonstrates using redux-saga for managing complex async workflows
 * with multiple sequential operations using generator functions.
 *
 * Key concepts demonstrated:
 * - Generator functions with yield for sequential async operations
 * - Saga effects: call(), put(), takeEvery()
 * - Optimistic updates (updating UI before async operations complete)
 * - Error handling with try/catch in sagas
 * - Calling sagas from other sagas with yield call()
 *
 * Comparison with Thunks:
 * - Sagas use generator functions (*) instead of async/await
 * - Sagas use "effects" (call, put) instead of direct dispatch/await
 * - Sagas are easier to test because effects are plain objects
 * - Sagas can be more powerful for complex workflows (racing, debouncing, etc.)
 */

import { call, put, takeEvery } from "redux-saga/effects";
import {
  createDocumentRequest,
  addDocument,
  addPage,
  type Document,
  type Page,
} from "./documents.slice";

/**
 * Creates a directory for a document on the file system.
 *
 * @remarks
 * Simulates a file system operation to create a directory for the document.
 * In a real application, this would make an API call to a backend service.
 *
 * NOTE: This is a generator function that yields a call effect.
 *
 * @param id - The document ID to create a directory for
 * @yields A call effect to execute the async operation
 * @returns The path to the created directory
 *
 * @example
 * ```ts
 * const path = yield call(createDocumentDirectory, 'doc-123');
 * // path === 'C:/Users/trey/doc-123'
 * ```
 */
function* createDocumentDirectory(id: string): Generator<any, string, any> {
  // yield call() executes the async operation and waits for it to complete
  // This is similar to 'await' in async/await, but returns an effect object
  yield call(() => new Promise((resolve) => setTimeout(resolve, 100)));
  return `C:/Users/trey/${id}`;
}

/**
 * Creates a directory for a page within a document's directory structure.
 *
 * @param path - The parent document's directory path
 * @param id - The page ID to create a directory for
 * @yields A call effect to execute the async operation
 * @returns The path to the created page directory
 *
 * @example
 * ```ts
 * const pagePath = yield call(createPageDirectory, 'C:/Users/trey/doc-123', 'page-456');
 * // pagePath === 'C:/Users/trey/doc-123/page-456'
 * ```
 */
function* createPageDirectory(
  path: string,
  id: string,
): Generator<any, string, any> {
  // Simulate network delay
  yield call(() => new Promise((resolve) => setTimeout(resolve, 100)));
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
 * @yields A call effect to execute the async operation
 * @returns void
 * @throws Always throws "LOL" error for demonstration purposes
 *
 * @example
 * ```ts
 * try {
 *   yield call(writePageContents, '/path/to/page', '');
 * } catch (error) {
 *   console.error('Expected error:', error); // "LOL"
 * }
 * ```
 */
function* writePageContents(
  path: string,
  content: string,
): Generator<any, void, any> {
  // Intentional error to demonstrate error handling in sagas
  throw new Error("LOL");
  // Simulate network delay (unreachable due to error above)
  yield call(() => new Promise((resolve) => setTimeout(resolve, 100)));
}

/**
 * Worker saga that creates a page within a document.
 *
 * @remarks
 * This saga orchestrates multiple operations:
 * 1. ⚡ OPTIMISTIC UPDATE: Adds the page to state immediately
 * 2. Creates the page directory on the file system
 * 3. Writes the page contents to disk
 *
 * This is a "worker saga" - it performs the actual work when triggered.
 *
 * @param documentId - The ID of the document to add the page to
 * @param path - The parent document's directory path
 * @yields A put effect to dispatch actions to Redux and call effects to execute async operations
 * @returns void
 * @throws If page directory creation fails
 * @throws If writing page contents fails
 *
 * @example
 * ```ts
 * yield call(createPageSaga, 'doc-123', 'C:/Users/trey/doc-123');
 * ```
 */
function* createPageSaga(
  documentId: string,
  path: string,
): Generator<any, void, any> {
  try {
    const pageId = crypto.randomUUID();

    const page: Page = {
      id: pageId,
      title: "New Page",
      content: "",
    };

    // ⚡ OPTIMISTIC UPDATE #2: Add page to document immediately
    // yield put() dispatches an action to the Redux store
    // This is similar to dispatch() in thunks, but returns an effect object
    yield put(addPage({ documentId, page }));

    // Step 1: Create the page's directory
    // yield call() invokes another saga and waits for it to complete
    const pagePath: string = yield call(createPageDirectory, path, pageId);

    // Step 2: Write the page contents to disk
    // This will throw an error, demonstrating error handling
    yield call(writePageContents, pagePath, "");

    console.log("Created page", page);
  } catch (error) {
    console.error("Failed to create page:", error);
    // In a production app, you might:
    // - Dispatch a failure action: yield put(createPageFailed(error))
    // - Remove the optimistically added page: yield put(removePage({documentId, pageId}))
    // - Show a notification to the user
    throw error; // Re-throw to propagate to parent saga
  }
}

/**
 * Worker saga that creates a new document with a default page.
 *
 * @remarks
 * This is the main saga that orchestrates the entire document creation workflow.
 * It demonstrates:
 * 1. ⚡ OPTIMISTIC UPDATE: Adding the document to state immediately
 * 2. Calling multiple async operations sequentially
 * 3. Calling other sagas with yield call()
 * 4. Error handling with try/catch
 *
 * This saga is triggered by the createDocumentRequest action.
 *
 * The workflow:
 * 1. Generate document data with a unique ID
 * 2. Optimistically add the document to state (UI updates immediately)
 * 3. Create the document's directory on the file system
 * 4. Create a default page for the document (calls createPageSaga)
 *
 * @yields Put effects to dispatch actions to Redux and call effects to execute async operations and other sagas
 * @returns void
 *
 * @example
 * ```ts
 * // Triggered automatically when createDocumentRequest action is dispatched
 * dispatch(createDocumentRequest());
 * ```
 */
function* createDocumentSaga(): Generator<any, void, any> {
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
    // yield put() dispatches the addDocument action to update the state
    // This makes the UI feel responsive by showing the document right away
    yield put(addDocument(document));

    // Step 1: Create the document's directory on the file system
    // yield call() invokes the createDocumentDirectory saga
    const path: string = yield call(createDocumentDirectory, id);

    // Step 2: Create a default page for the document
    // yield call() invokes another worker saga (createPageSaga)
    // This demonstrates how sagas can call other sagas to compose workflows
    yield call(createPageSaga, id, path);

    console.log("Created document", document);
  } catch (error) {
    console.error("Failed to create document:", error);
    // Error handling: In a production app, you might:
    // - Dispatch a failure action: yield put(createDocumentFailed(error))
    // - Remove the optimistically added document: yield put(removeDocument(id))
    // - Show a notification to the user
    // For now, we just log the error to match the thunk behavior
  }
}

/**
 * Watcher saga that listens for document creation requests.
 *
 * @remarks
 * This is a "watcher saga" - it listens for specific actions and triggers
 * worker sagas in response.
 *
 * takeEvery() means: every time a createDocumentRequest action is dispatched,
 * run createDocumentSaga. If multiple actions come in, run multiple sagas
 * concurrently.
 *
 * Alternative saga effects you might use:
 * - takeLatest(): Cancel previous saga if a new action comes in
 * - takeLeading(): Ignore new actions while a saga is running
 * - debounce(): Wait before running the saga (useful for search inputs)
 * - throttle(): Limit how often the saga runs
 *
 * @yields A takeEvery effect that watches for actions
 * @returns void
 *
 * @example
 * ```ts
 * // This watcher is started by the root saga
 * yield call(watchCreateDocument);
 * ```
 */
export function* watchCreateDocument() {
  yield takeEvery(createDocumentRequest.type, createDocumentSaga);
}

/**
 * Root saga for the documents feature.
 *
 * @remarks
 * This saga starts all watcher sagas for the documents feature.
 * In a larger app, you might have multiple watcher sagas here.
 *
 * Note: yield call() ensures this saga blocks until watchers are set up.
 * This is important for ensuring the watchers are ready before any actions
 * are dispatched.
 *
 * @yields Call effects to start watcher sagas
 * @returns void
 *
 * @example
 * ```ts
 * // Started by the root saga in rootSaga.ts
 * yield all([call(documentsSaga)]);
 * ```
 */
export function* documentsSaga() {
  yield call(watchCreateDocument);
}
