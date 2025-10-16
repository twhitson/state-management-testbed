import type { AnyAction } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";
import { createEpicMiddleware } from "redux-observable";

import {
  documentsReducer,
  type DocumentSliceState,
} from "../sagas/documents.slice";
import {
  workspacesReducer,
  type WorkspaceSliceState,
} from "../sagas/workspaces.slice";
import { rootEpic } from "./epics";

type RootState = {
  documents: DocumentSliceState;
  workspaces: WorkspaceSliceState;
};

const epicMiddleware = createEpicMiddleware<AnyAction, AnyAction, RootState>();

export const observablesStore = configureStore({
  reducer: {
    documents: documentsReducer,
    workspaces: workspacesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false,
      serializableCheck: false,
    }).concat(epicMiddleware),
});

export type ObservablesRootState = ReturnType<typeof observablesStore.getState>;
export type ObservablesAppDispatch = typeof observablesStore.dispatch;

epicMiddleware.run(rootEpic);
