import { applyMiddleware, legacy_createStore as createStore } from "redux";

import type { AppAction } from "./actions";
import { rootReducer, type RootState } from "./reducers";
import type { AppThunk } from "./thunks";

const asyncMiddleware =
  ({ dispatch, getState }: any) =>
  (next: any) =>
  (action: AppAction | AppThunk) => {
    if (typeof action === "function") {
      return (action as AppThunk)(dispatch, getState);
    }
    return next(action);
  };

export const vanillaStore = createStore(
  rootReducer,
  {},
  applyMiddleware(asyncMiddleware as any),
);

export type VanillaRootState = RootState;
export type AppDispatch = typeof vanillaStore.dispatch;
