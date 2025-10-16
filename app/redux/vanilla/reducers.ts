import { combineReducers } from "redux";

import type { AppAction } from "./actions";
import {
  DOCUMENT_ADDED,
  DOCUMENT_ADDED_TO_WORKSPACE,
  DOCUMENT_PAGE_ADDED,
  DOCUMENT_REMOVED,
  WORKSPACES_SET,
} from "./actions";
import type { DocumentsState, WorkspacesState } from "./types";

const initialDocumentsState: DocumentsState = {};

export function documentsReducer(
  state: DocumentsState = initialDocumentsState,
  action: AppAction,
): DocumentsState {
  switch (action.type) {
    case DOCUMENT_ADDED: {
      return {
        ...state,
        [action.payload.id]: action.payload,
      };
    }
    case DOCUMENT_PAGE_ADDED: {
      const existing = state[action.payload.documentId];
      if (!existing) {
        return state;
      }
      return {
        ...state,
        [existing.id]: {
          ...existing,
          pages: [...existing.pages, action.payload.page],
        },
      };
    }
    case DOCUMENT_REMOVED: {
      const next = { ...state };
      delete next[action.payload.documentId];
      return next;
    }
    case DOCUMENT_ADDED_TO_WORKSPACE: {
      const existing = state[action.payload.documentId];
      if (!existing || existing.workspaceIds.includes(action.payload.workspaceId)) {
        return state;
      }
      return {
        ...state,
        [existing.id]: {
          ...existing,
          workspaceIds: [...existing.workspaceIds, action.payload.workspaceId],
        },
      };
    }
    default:
      return state;
  }
}

const initialWorkspacesState: WorkspacesState = {};

export function workspacesReducer(
  state: WorkspacesState = initialWorkspacesState,
  action: AppAction,
): WorkspacesState {
  switch (action.type) {
    case WORKSPACES_SET: {
      const next: WorkspacesState = { ...state };
      action.payload.forEach((workspace) => {
        next[workspace.id] = {
          id: workspace.id,
          name: workspace.name,
        };
      });
      return next;
    }
    default:
      return state;
  }
}

export const rootReducer = combineReducers({
  documents: documentsReducer,
  workspaces: workspacesReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
