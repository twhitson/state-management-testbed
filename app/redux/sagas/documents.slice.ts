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

const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    // Action to trigger document creation saga
    createDocumentRequest: (state) => {
      // Saga will handle this
    },
    // Actions dispatched by sagas
    addDocument: (state, action) => {
      state[action.payload.id] = action.payload;
    },
    addPage: (state, action) => {
      state[action.payload.documentId].pages.push(action.payload.page);
    },
    removeDocument: (state, action) => {
      delete state[action.payload];
    },
  },
});

export const documentsReducer = documentsSlice.reducer;
export const { createDocumentRequest, addDocument, addPage, removeDocument } =
  documentsSlice.actions;
