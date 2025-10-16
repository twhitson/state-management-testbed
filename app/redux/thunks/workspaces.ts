/**
 * @fileoverview Redux Toolkit Workspaces Thunk Example
 *
 * This file demonstrates fetching workspaces from a database and managing
 * workspace state with Redux Toolkit thunks.
 *
 * Key concepts demonstrated:
 * - Fetching data from a simulated database
 * - Cross-slice updates (adding documents from workspace response)
 * - Documents maintain the relationship via workspaceIds array
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { addDocument, type Document } from "./documents";

export type Workspace = {
  id: string;
  name: string;
  documents?: Document[];
};

export type WorkspaceSliceState = Record<string, Workspace>;

const initialState: WorkspaceSliceState = {};

/**
 * Fetches workspaces from the database.
 *
 * @remarks
 * Simulates a database query that returns a list of workspaces with their documents.
 * In a real application, this would make an API call to fetch workspaces.
 * Documents from the response are automatically added to the documents slice via
 * cross-slice dispatch calls.
 *
 * @param _ - No parameters required
 * @param thunkAPI - Redux Toolkit thunk API
 * @param thunkAPI.dispatch - Redux dispatch function
 * @returns Array of workspaces from the database
 *
 * @example
 * ```ts
 * dispatch(fetchWorkspaces());
 * ```
 */
export const fetchWorkspaces = createAsyncThunk(
  "workspaces/fetchWorkspaces",
  async (_, { dispatch }) => {
    console.log("Fetching workspaces from database");

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulated database response - workspaces with their documents
    const workspaces: Workspace[] = [
      {
        id: "workspace-1",
        name: "Personal Projects",
        documents: [
          {
            id: "doc-workspace-1-1",
            path: "C:/Users/trey/workspace-1/doc-1",
            title: "Personal Website",
            pages: [],
            workspaceIds: ["workspace-1"],
          },
          {
            id: "doc-workspace-1-2",
            path: "C:/Users/trey/workspace-1/doc-2",
            title: "Side Project Ideas",
            pages: [],
            workspaceIds: ["workspace-1"],
          },
        ],
      },
      {
        id: "workspace-2",
        name: "Work Documents",
        documents: [
          {
            id: "doc-workspace-2-1",
            path: "C:/Users/trey/workspace-2/doc-1",
            title: "Q4 Planning",
            pages: [],
            workspaceIds: ["workspace-2"],
          },
        ],
      },
      {
        id: "workspace-3",
        name: "Research",
        documents: [
          {
            id: "doc-workspace-3-1",
            path: "C:/Users/trey/workspace-3/doc-1",
            title: "State Management Comparison",
            pages: [],
            workspaceIds: ["workspace-3"],
          },
          {
            id: "doc-workspace-3-2",
            path: "C:/Users/trey/workspace-3/doc-2",
            title: "React Patterns",
            pages: [],
            workspaceIds: ["workspace-3"],
          },
        ],
      },
    ];

    // Add all documents from workspaces to the documents slice
    workspaces.forEach((workspace) => {
      if (workspace.documents) {
        workspace.documents.forEach((document) => {
          dispatch(addDocument(document));
        });
      }
    });

    return workspaces;
  },
);

/**
 * Redux slice for managing workspaces state.
 *
 * @remarks
 * Workspaces are simple entities with just id and name.
 * The relationship to documents is maintained on the Document type
 * via the workspaceIds array.
 *
 * Documents from workspace fetch responses are added to the documents slice,
 * not stored in workspace state.
 */
const workspacesSlice = createSlice({
  name: "workspaces",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchWorkspaces.fulfilled, (state, action) => {
      // Convert array to Record<string, Workspace> for easy lookup
      // Documents are already added to documents slice, so we only store id and name
      action.payload.forEach((workspace) => {
        state[workspace.id] = {
          id: workspace.id,
          name: workspace.name,
        };
      });
    });
  },
});

export const workspacesReducer = workspacesSlice.reducer;
