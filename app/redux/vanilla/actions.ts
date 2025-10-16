import type { Document, Page, Workspace } from "./types";

export const DOCUMENT_ADDED = "vanilla/documents/added" as const;
export const DOCUMENT_PAGE_ADDED = "vanilla/documents/pageAdded" as const;
export const DOCUMENT_REMOVED = "vanilla/documents/removed" as const;
export const DOCUMENT_ADDED_TO_WORKSPACE =
  "vanilla/documents/addedToWorkspace" as const;
export const WORKSPACES_SET = "vanilla/workspaces/set" as const;

export const addDocument = (document: Document) => ({
  type: DOCUMENT_ADDED,
  payload: document,
});

export const addPage = (documentId: string, page: Page) => ({
  type: DOCUMENT_PAGE_ADDED,
  payload: { documentId, page },
});

export const removeDocument = (documentId: string) => ({
  type: DOCUMENT_REMOVED,
  payload: { documentId },
});

export const addDocumentToWorkspace = (
  documentId: string,
  workspaceId: string,
) => ({
  type: DOCUMENT_ADDED_TO_WORKSPACE,
  payload: { documentId, workspaceId },
});

export const setWorkspaces = (workspaces: Workspace[]) => ({
  type: WORKSPACES_SET,
  payload: workspaces,
});

export type AppAction =
  | ReturnType<typeof addDocument>
  | ReturnType<typeof addPage>
  | ReturnType<typeof removeDocument>
  | ReturnType<typeof addDocumentToWorkspace>
  | ReturnType<typeof setWorkspaces>;
