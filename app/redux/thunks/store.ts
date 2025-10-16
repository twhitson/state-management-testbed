import { configureStore } from "@reduxjs/toolkit";
import { documentsReducer } from "./documents";
import { workspacesReducer } from "./workspaces";

export const thunksStore = configureStore({
  reducer: {
    documents: documentsReducer,
    workspaces: workspacesReducer,
  },
});

export type RootState = ReturnType<typeof thunksStore.getState>;
export type AppDispatch = typeof thunksStore.dispatch;
