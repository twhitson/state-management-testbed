/**
 * @fileoverview Documents Slice for Redux-Saga
 *
 * This slice defines the shape of the state and the reducers for the saga-based
 * implementation. Unlike the thunk version, this slice includes a "request" action
 * that triggers the saga instead of exporting the async thunk directly.
 *
 * Key differences from the thunk version:
 * - createDocumentRequest: A plain action that triggers the saga (no async logic)
 * - Sagas watch for this action and perform the async operations
 * - The slice only handles synchronous state updates
 *
 * Pattern:
 * 1. UI dispatches createDocumentRequest action
 * 2. Watcher saga (watchCreateDocument) sees the action
 * 3. Worker saga (createDocumentSaga) performs async operations
 * 4. Worker saga dispatches addDocument/addPage actions
 * 5. These reducers update the state
 */

import { createSlice } from "@reduxjs/toolkit";

export type Document = {
  id: string;
  path: string;
  title: string;
  pages: Page[];
};

export type Page = {
  id: string;
  title: string;
  content: string;
};

export type DocumentSliceState = Record<string, Document>;

const initialState: DocumentSliceState = {};

/**
 * Redux slice for managing documents state with sagas.
 */
const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    /**
     * Triggers the document creation saga workflow.
     *
     * This is a plain Redux action that doesn't modify the state. It exists
     * solely to trigger the watcher saga (watchCreateDocument).
     *
     * In the saga pattern:
     * 1. UI dispatches this action: dispatch(createDocumentRequest())
     * 2. Watcher saga sees the action and starts the worker saga
     * 3. Worker saga performs async operations and dispatches other actions
     *
     * This is different from thunks, where you dispatch the thunk directly
     * and it handles all the async logic internally.
     *
     * @param {DocumentSliceState} state - Current state (not modified)
     *
     * @example
     * // In a React component:
     * const dispatch = useDispatch();
     * dispatch(createDocumentRequest());
     *
     * @see {@link createDocumentSaga} - The worker saga that handles this action
     */
    createDocumentRequest: (state) => {
      // No state changes here - saga will handle the workflow
    },

    /**
     * Adds a document to the state.
     *
     * ⚡ OPTIMISTIC UPDATE: Called by sagas before async operations complete.
     * This makes the UI feel more responsive by showing the document immediately.
     *
     * This action is dispatched by the saga using:
     * `yield put(addDocument(document))`
     *
     * @param {DocumentSliceState} state - Current state
     * @param {Object} action - Redux action
     * @param {Document} action.payload - The document to add
     *
     * @example
     * // From within a saga:
     * yield put(addDocument({
     *   id: 'doc-123',
     *   path: 'C:/Users/trey/doc-123',
     *   title: 'New Document',
     *   pages: []
     * }));
     */
    addDocument: (state, action) => {
      state[action.payload.id] = action.payload;
    },

    /**
     * Adds a page to an existing document.
     *
     * ⚡ OPTIMISTIC UPDATE: Called by sagas before async operations complete.
     *
     * This action is dispatched by the saga using:
     * `yield put(addPage({ documentId, page }))`
     *
     * @param {DocumentSliceState} state - Current state
     * @param {Object} action - Redux action
     * @param {string} action.payload.documentId - The document ID to add the page to
     * @param {Page} action.payload.page - The page to add
     *
     * @example
     * // From within a saga:
     * yield put(addPage({
     *   documentId: 'doc-123',
     *   page: {
     *     id: 'page-456',
     *     title: 'New Page',
     *     content: ''
     *   }
     * }));
     */
    addPage: (state, action) => {
      state[action.payload.documentId].pages.push(action.payload.page);
    },

    /**
     * Removes a document from the state.
     *
     * Useful for rolling back optimistic updates when async operations fail.
     * For example, if creating a document fails after it was optimistically
     * added, you can dispatch this action to remove it.
     *
     * @param {DocumentSliceState} state - Current state
     * @param {Object} action - Redux action
     * @param {string} action.payload - The ID of the document to remove
     *
     * @example
     * // From within a saga error handler:
     * try {
     *   // ... async operations
     * } catch (error) {
     *   yield put(removeDocument(documentId));
     * }
     */
    removeDocument: (state, action) => {
      delete state[action.payload];
    },
  },
});

export const documentsReducer = documentsSlice.reducer;
export const { createDocumentRequest, addDocument, addPage, removeDocument } =
  documentsSlice.actions;
