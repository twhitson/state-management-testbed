import { createStore } from "@tanstack/react-store";
import { produce } from "immer";

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

export type Workspace = {
  id: string;
  name: string;
};

type TanStackState = {
  documents: Record<string, Document>;
  workspaces: Record<string, Workspace>;
};

async function createDocumentDirectory(id: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return `C:/Users/trey/${id}`;
}

async function createPageDirectory(path: string, id: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return `${path}/${id}`;
}

async function writePageContents(path: string, content: string): Promise<void> {
  console.log("Writing page contents", { path, content });
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const initialState: TanStackState = {
  documents: {},
  workspaces: {},
};

export const tanStackStateStore = createStore(
  initialState,
  ({ setState }) => ({
    addDocument: (document: Document) => {
      setState(
        produce((state: TanStackState) => {
          state.documents[document.id] = document;
        }),
      );
    },
    addPage: (documentId: string, page: Page) => {
      setState(
        produce((state: TanStackState) => {
          const document = state.documents[documentId];

          if (!document) {
            return;
          }

          document.pages.push(page);
        }),
      );
    },
    addDocumentToWorkspace: (documentId: string, workspaceId: string) => {
      setState(
        produce((state: TanStackState) => {
          const document = state.documents[documentId];

          if (!document || document.workspaceIds.includes(workspaceId)) {
            return;
          }

          document.workspaceIds.push(workspaceId);
        }),
      );
    },
    createDocument: async () => {
      const documentId = crypto.randomUUID();
      const path = await createDocumentDirectory(documentId);
      const pageId = crypto.randomUUID();
      const page: Page = {
        id: pageId,
        title: "New Page",
        content: "",
      };

      const document: Document = {
        id: documentId,
        path,
        title: "Untitled Document",
        pages: [page],
        workspaceIds: [],
      };

      setState(
        produce((state: TanStackState) => {
          state.documents[document.id] = document;
        }),
      );

      const pagePath = await createPageDirectory(path, pageId);
      await writePageContents(pagePath, page.content);
    },
    fetchWorkspaces: async () => {
      console.log("Fetching workspaces from database");
      await new Promise((resolve) => setTimeout(resolve, 500));

      const workspaces: Array<Workspace & { documents: Document[] }> = [
        {
          id: "workspace-1",
          name: "Personal Projects",
          documents: [
            {
              id: "tanstack-doc-workspace-1-1",
              path: "C:/Users/trey/workspace-1/doc-1",
              title: "Personal Website",
              pages: [],
              workspaceIds: ["workspace-1"],
            },
            {
              id: "tanstack-doc-workspace-1-2",
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
              id: "tanstack-doc-workspace-2-1",
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
              id: "tanstack-doc-workspace-3-1",
              path: "C:/Users/trey/workspace-3/doc-1",
              title: "State Management Comparison",
              pages: [],
              workspaceIds: ["workspace-3"],
            },
            {
              id: "tanstack-doc-workspace-3-2",
              path: "C:/Users/trey/workspace-3/doc-2",
              title: "React Patterns",
              pages: [],
              workspaceIds: ["workspace-3"],
            },
          ],
        },
      ];

      const nextWorkspaces: Record<string, Workspace> = {};

      workspaces.forEach((workspace) => {
        nextWorkspaces[workspace.id] = {
          id: workspace.id,
          name: workspace.name,
        };
      });

      setState(
        produce((state: TanStackState) => {
          state.workspaces = nextWorkspaces;

          workspaces.forEach((workspace) => {
            workspace.documents.forEach((document) => {
              state.documents[document.id] = document;
            });
          });
        }),
      );
    },
  }),
);
