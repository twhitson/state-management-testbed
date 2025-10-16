/**
 * @fileoverview Redux Toolkit Thunks Example
 *
 * This file demonstrates using Redux Toolkit's createAsyncThunk for managing
 * complex async workflows with multiple sequential operations.
 *
 * Key concepts demonstrated:
 * - Chaining multiple async thunks together
 * - Optimistic updates (updating UI before async operations complete)
 * - Error handling with thunk.rejected matchers
 * - Dispatching thunks from within other thunks
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

type Document = {
  id: string;
  path: string;
  title: string;
  pages: Page[];
};

type Page = {
  id: string;
  title: string;
  content: string;
};

export type DocumentSliceState = Record<string, Document>;

const initialState: DocumentSliceState = {};

/**
 * Creates a directory for a document on the file system.
 *
 * Simulates a file system operation to create a directory for the document.
 * In a real application, this would make an API call to a backend service.
 *
 * @async
 * @param {Object} input - The input parameters
 * @param {string} input.id - The document ID to create a directory for
 * @returns {Promise<string>} The path to the created directory
 *
 * @example
 * const result = await dispatch(createDocumentDirectory({ id: 'doc-123' }));
 * // result.payload === 'C:/Users/trey/doc-123'
 */
const createDocumentDirectory = createAsyncThunk(
  "documents/createDirectory",
  async (input: { id: string }) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return `C:/Users/trey/${input.id}`;
  },
);

/**
 * Creates a new document with a default page.
 *
 * This is the main thunk that orchestrates the entire document creation workflow.
 * It demonstrates:
 * 1. ⚡ OPTIMISTIC UPDATE: Adding the document to state immediately
 * 2. Chaining multiple async operations sequentially
 * 3. Error handling at each step
 *
 * The workflow:
 * 1. Generate document data with a unique ID
 * 2. Optimistically add the document to state (UI updates immediately)
 * 3. Create the document's directory on the file system
 * 4. Create a default page for the document (chains to createPage thunk)
 *
 * @async
 * @param {void} _ - No parameters required
 * @param {Object} thunkAPI - Redux Toolkit thunk API
 * @param {Function} thunkAPI.dispatch - Redux dispatch function
 * @returns {Promise<Document>} The created document
 * @throws {Error} If document directory creation fails
 * @throws {Error} If page creation fails
 *
 * @example
 * dispatch(createDocument());
 */
const createDocument = createAsyncThunk(
  "documents/createDocument",
  async (_, { dispatch }) => {
    console.log("Creating document");

    // Generate document data
    const id = crypto.randomUUID();
    const document: Document = {
      id,
      path: `C:/Users/trey/${id}`,
      title: "New Document",
      pages: [],
    };

    // ⚡ OPTIMISTIC UPDATE #1: Add document to state immediately
    // This makes the UI feel responsive by showing the document right away,
    // even before any async operations complete
    dispatch(addDocument(document));

    // Step 1: Create the document's directory on the file system
    const createDocumentDirectoryResult = await dispatch(
      createDocumentDirectory({ id }),
    );

    // Error handling: Check if the directory creation failed
    if (createDocumentDirectory.rejected.match(createDocumentDirectoryResult)) {
      throw new Error("Failed to create document directory");
    }

    const path = createDocumentDirectoryResult.payload;

    // Step 2: Create a default page for the document (this will chain more operations)
    const createPageResult = await dispatch(
      createPage({ documentId: id, path }),
    );

    // Error handling: Check if page creation failed
    if (createPage.rejected.match(createPageResult)) {
      throw new Error("Failed to create page");
    }

    console.log("Created document", document);

    return document;
  },
);

/**
 * Creates a directory for a page within a document's directory structure.
 *
 * @async
 * @param {Object} input - The input parameters
 * @param {string} input.path - The parent document's directory path
 * @param {string} input.id - The page ID to create a directory for
 * @returns {Promise<string>} The path to the created page directory
 *
 * @example
 * const result = await dispatch(createPageDirectory({
 *   path: 'C:/Users/trey/doc-123',
 *   id: 'page-456'
 * }));
 * // result.payload === 'C:/Users/trey/doc-123/page-456'
 */
const createPageDirectory = createAsyncThunk(
  "documents/createPageDirectory",
  async (input: { path: string; id: string }) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return `${input.path}/${input.id}`;
  },
);

/**
 * Writes the initial content to a page file.
 *
 * ⚠️ NOTE: This intentionally throws an error to demonstrate error handling!
 *
 * @async
 * @param {Object} input - The input parameters
 * @param {string} input.path - The page directory path
 * @param {string} input.content - The content to write to the page
 * @returns {Promise<void>}
 * @throws {Error} Always throws "LOL" error for demonstration purposes
 *
 * @example
 * try {
 *   await dispatch(writePageContents({ path: '/path/to/page', content: '' }));
 * } catch (error) {
 *   console.error('Expected error:', error); // "LOL"
 * }
 */
const writePageContents = createAsyncThunk(
  "documents/writePageContents",
  async (input: { path: string; content: string }) => {
    throw new Error("LOL");
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  },
);

/**
 * Creates a new page within a document.
 *
 * This thunk chains multiple operations:
 * 1. ⚡ OPTIMISTIC UPDATE: Adds the page to the document immediately
 * 2. Creates the page directory on the file system
 * 3. Writes the page contents to disk
 *
 * @async
 * @param {Object} input - The input parameters
 * @param {string} input.documentId - The ID of the document to add the page to
 * @param {string} input.path - The parent document's directory path
 * @param {Object} thunkAPI - Redux Toolkit thunk API
 * @param {Function} thunkAPI.dispatch - Redux dispatch function
 * @returns {Promise<{documentId: string, page: Page}>} The created page info
 * @throws {Error} If page directory creation fails
 * @throws {Error} If writing page contents fails
 *
 * @example
 * const result = await dispatch(createPage({
 *   documentId: 'doc-123',
 *   path: 'C:/Users/trey/doc-123'
 * }));
 */
const createPage = createAsyncThunk(
  "documents/createPage",
  async (input: { documentId: string; path: string }, { dispatch }) => {
    const id = crypto.randomUUID();

    const page = {
      id: crypto.randomUUID(),
      title: "New Page",
      content: "",
    };

    // ⚡ OPTIMISTIC UPDATE #2: Add page to document immediately
    // The page appears in the UI right away, improving perceived performance
    dispatch(addPage({ documentId: input.documentId, page }));

    // Step 1: Create the page's directory
    const createPageDirectoryResult = await dispatch(
      createPageDirectory({ path: input.path, id }),
    );

    // Error handling: Check if directory creation failed
    if (createPageDirectory.rejected.match(createPageDirectoryResult)) {
      throw new Error("Failed to create page directory");
    }

    const path = createPageDirectoryResult.payload;

    // Step 2: Write the page contents to disk
    const writePageContentsResult = await dispatch(
      writePageContents({ path, content: "" }),
    );

    // Error handling: Check if writing contents failed
    if (writePageContents.rejected.match(writePageContentsResult)) {
      throw new Error("Failed to create page contents");
    }

    return {
      documentId: input.documentId,
      page,
    };
  },
);

/**
 * Redux slice for managing documents state.
 *
 * Defines the shape of the state and the reducers for synchronous actions.
 * The optimistic updates are handled by these reducers, which are called
 * from within the thunks above.
 *
 * @remarks
 * This slice could add extraReducers to handle thunk lifecycle
 * (pending/fulfilled/rejected), but for this example we're doing
 * optimistic updates instead.
 */
const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    /**
     * Adds a document to the state.
     *
     * Called optimistically from createDocument thunk before any async
     * operations complete. This makes the UI feel more responsive.
     *
     * @param {DocumentSliceState} state - Current state
     * @param {Object} action - Redux action
     * @param {Document} action.payload - The document to add
     */
    addDocument: (state, action) => {
      state[action.payload.id] = action.payload;
    },
    /**
     * Adds a page to an existing document.
     *
     * Called optimistically from createPage thunk before any async
     * operations complete.
     *
     * @param {DocumentSliceState} state - Current state
     * @param {Object} action - Redux action
     * @param {string} action.payload.documentId - The document ID to add the page to
     * @param {Page} action.payload.page - The page to add
     */
    addPage: (state, action) => {
      state[action.payload.documentId].pages.push(action.payload.page);
    },
  },
  extraReducers: (builder) => {},
});

export const documentsReducer = documentsSlice.reducer;
export const { addDocument, addPage } = documentsSlice.actions;

export { createDocument };
