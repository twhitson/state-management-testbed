/**
 * @fileoverview Workspaces Slice for Redux-Saga
 *
 * This slice defines the shape of the workspaces state and the reducers for the saga-based
 * implementation. The slice includes a "request" action that triggers the saga to fetch
 * workspaces from the database.
 *
 * Pattern:
 * 1. UI dispatches fetchWorkspacesRequest action
 * 2. Watcher saga sees the action
 * 3. Worker saga performs database fetch (includes documents)
 * 4. Worker saga dispatches addDocument actions for each document
 * 5. Worker saga dispatches setWorkspaces action
 * 6. Reducer updates the state
 */

import { createSlice } from "@reduxjs/toolkit";
import type { Document } from "./documents.slice";

export type Workspace = {
  id: string;
  name: string;
  documents?: Document[];
};

export type WorkspaceSliceState = Record<string, Workspace>;

const initialState: WorkspaceSliceState = {};

/**
 * Redux slice for managing workspaces state with sagas.
 */
const workspacesSlice = createSlice({
  name: "workspaces",
  initialState,
  reducers: {
    /**
     * Triggers the workspace fetching saga workflow.
     *
     * @remarks
     * This is a plain Redux action that doesn't modify the state. It exists
     * solely to trigger the watcher saga (watchFetchWorkspaces).
     *
     * @param state - Current state (not modified)
     *
     * @example
     * ```ts
     * // In a React component:
     * const dispatch = useDispatch();
     * dispatch(fetchWorkspacesRequest());
     * ```
     */
    fetchWorkspacesRequest: (state) => {
      // No state changes here - saga will handle the workflow
    },

    /**
     * Sets the workspaces in state.
     *
     * @remarks
     * Called by the fetchWorkspacesSaga after successfully fetching workspaces
     * from the database. Documents are already added to documents slice by the saga,
     * so we only store id and name.
     *
     * @param state - Current state
     * @param action - Redux action
     * @param action.payload - Array of workspaces to set
     *
     * @example
     * ```ts
     * // From within a saga:
     * yield put(setWorkspaces([
     *   { id: 'ws-1', name: 'Personal' },
     *   { id: 'ws-2', name: 'Work' }
     * ]));
     * ```
     */
    setWorkspaces: (state, action) => {
      // Convert array to Record<string, Workspace> for easy lookup
      // Documents are already added to documents slice, so we only store id and name
      action.payload.forEach((workspace: Workspace) => {
        state[workspace.id] = {
          id: workspace.id,
          name: workspace.name,
        };
      });
    },
  },
});

export const workspacesReducer = workspacesSlice.reducer;
export const { fetchWorkspacesRequest, setWorkspaces } = workspacesSlice.actions;
