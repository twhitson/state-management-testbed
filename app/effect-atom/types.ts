export type Page = {
  id: string;
  title: string;
  content: string;
};

export type Document = {
  id: string;
  path: string;
  title: string;
  pages: Page[];
  workspaceIds: string[];
};

export type DocumentsState = Record<string, Document>;

export type Workspace = {
  id: string;
  name: string;
  documents?: Document[];
};

export type WorkspacesState = Record<string, Workspace>;
