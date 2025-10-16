import { applyMiddleware, createStore } from "redux";

import type { AppAction } from "./actions";
import { rootReducer, type RootState } from "./reducers";
import type { AppThunk } from "./thunks";

const asyncMiddleware: any =
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
  undefined,
  applyMiddleware(asyncMiddleware),
);

export type VanillaRootState = RootState;
export type AppDispatch = (
  action: AppAction | AppThunk | { type: string },
) => unknown;
