import { call, put, takeEvery } from "redux-saga/effects";
import {
  createDocumentRequest,
  addDocument,
  addPage,
  type Document,
  type Page,
} from "./documents.slice";

// API/Service functions (simulating async operations)
function* createDocumentDirectory(id: string): Generator<any, string, any> {
  // Simulate waiting for a response
  yield call(() => new Promise((resolve) => setTimeout(resolve, 100)));
  return `C:/Users/trey/${id}`;
}

function* createPageDirectory(
  path: string,
  id: string,
): Generator<any, string, any> {
  // Simulate waiting for a response
  yield call(() => new Promise((resolve) => setTimeout(resolve, 100)));
  return `${path}/${id}`;
}

function* writePageContents(
  path: string,
  content: string,
): Generator<any, void, any> {
  // Simulate an error
  throw new Error("LOL");
  // Simulate waiting for a response
  yield call(() => new Promise((resolve) => setTimeout(resolve, 100)));
}

// Worker saga: handles creating a page
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

    // Optimistically add the page
    yield put(addPage({ documentId, page }));

    // Create page directory
    const pagePath: string = yield call(createPageDirectory, path, pageId);

    // Write page contents
    yield call(writePageContents, pagePath, "");

    console.log("Created page", page);
  } catch (error) {
    console.error("Failed to create page:", error);
    throw error;
  }
}

// Worker saga: handles creating a document
function* createDocumentSaga(): Generator<any, void, any> {
  try {
    console.log("Creating document");

    const id = crypto.randomUUID();
    const document: Document = {
      id,
      path: `C:/Users/trey/${id}`,
      title: "New Document",
      pages: [],
    };

    // Optimistically update the UI
    yield put(addDocument(document));

    // Create document directory
    const path: string = yield call(createDocumentDirectory, id);

    // Create a page for the document
    yield call(createPageSaga, id, path);

    console.log("Created document", document);
  } catch (error) {
    console.error("Failed to create document:", error);
    // Note: In the thunk version, errors are thrown and not caught here.
    // For sagas, you might want to dispatch a failure action or remove the optimistically added document
    // For now, we'll keep the same behavior as the thunk version
  }
}

// Watcher saga: watches for createDocumentRequest actions
export function* watchCreateDocument() {
  yield takeEvery(createDocumentRequest.type, createDocumentSaga);
}

// Root saga for documents
export function* documentsSaga() {
  yield call(watchCreateDocument);
}
