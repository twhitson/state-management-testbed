import { configureStore } from "@reduxjs/toolkit";
import { documentsReducer } from "./documents";

export const thunksStore = configureStore({
  reducer: {
    documents: documentsReducer,
  },
});

export type RootState = ReturnType<typeof thunksStore.getState>;
export type AppDispatch = typeof thunksStore.dispatch;
