import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { documentsReducer } from "./documents.slice";
import { rootSaga } from "./rootSaga";

const sagaMiddleware = createSagaMiddleware();

export const sagasStore = configureStore({
  reducer: {
    documents: documentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

// Run the root saga
sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof sagasStore.getState>;
export type AppDispatch = typeof sagasStore.dispatch;
