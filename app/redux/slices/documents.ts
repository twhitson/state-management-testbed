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

const createDocumentDirectory = createAsyncThunk(
  "documents/createDirectory",
  async (input: { id: string }) => {
    // Simulate waiting a second for a response
    await new Promise((resolve) => setTimeout(resolve, 100));

    return `C:/Users/trey/${input.id}`;
  },
);

const createDocument = createAsyncThunk(
  "documents/createDocument",
  async (_, { dispatch }) => {
    console.log("Creating document");

    const id = crypto.randomUUID();
    const document: Document = {
      id,
      path: `C:/Users/trey/${id}`,
      title: "New Document",
      pages: [],
    };

    // Optimistically update the UI
    dispatch(addDocument(document));

    const createDocumentDirectoryResult = await dispatch(
      createDocumentDirectory({ id }),
    );

    // If creating the directory failed
    if (createDocumentDirectory.rejected.match(createDocumentDirectoryResult)) {
      throw new Error("Failed to create document directory");
    }

    const path = createDocumentDirectoryResult.payload;

    const createPageResult = await dispatch(
      createPage({ documentId: id, path }),
    );

    if (createPage.rejected.match(createPageResult)) {
      throw new Error("Failed to create page");
    }

    console.log("Created document", document);

    return document;
  },
);

const createPageDirectory = createAsyncThunk(
  "documents/createPageDirectory",
  async (input: { path: string; id: string }) => {
    // Simulate waiting a second for a response
    await new Promise((resolve) => setTimeout(resolve, 100));

    return `${input.path}/${input.id}`;
  },
);

const writePageContents = createAsyncThunk(
  "documents/writePageContents",
  async (input: { path: string; content: string }) => {
    throw new Error("LOL");
    // Simulate waiting a second for a response
    await new Promise((resolve) => setTimeout(resolve, 100));
  },
);

const createPage = createAsyncThunk(
  "documents/createPage",
  async (input: { documentId: string; path: string }, { dispatch }) => {
    const id = crypto.randomUUID();

    const page = {
      id: crypto.randomUUID(),
      title: "New Page",
      content: "",
    };

    dispatch(addPage({ documentId: input.documentId, page }));

    const createPageDirectoryResult = await dispatch(
      createPageDirectory({ path: input.path, id }),
    );

    // If creating the directory failed
    if (createPageDirectory.rejected.match(createPageDirectoryResult)) {
      throw new Error("Failed to create page directory");
    }

    const path = createPageDirectoryResult.payload;

    const writePageContentsResult = await dispatch(
      writePageContents({ path, content: "" }),
    );

    // If creating the contents failed
    if (writePageContents.rejected.match(writePageContentsResult)) {
      throw new Error("Failed to create page contents");
    }

    return {
      documentId: input.documentId,
      page,
    };
  },
);

const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    addDocument: (state, action) => {
      state[action.payload.id] = action.payload;
    },
    addPage: (state, action) => {
      state[action.payload.documentId].pages.push(action.payload.page);
    },
  },
  extraReducers: (builder) => {},
});

export const documentsReducer = documentsSlice.reducer;
export const { addDocument, addPage } = documentsSlice.actions;

export { createDocument };
