import type { AppAction } from "./actions";
import { addDocument, addPage, removeDocument, setWorkspaces } from "./actions";
import type { RootState } from "./reducers";
import type { Document, Page, Workspace } from "./types";

type ThunkDispatch = (action: AppAction | AppThunk) => unknown;

export type AppThunk<ReturnType = void> = (
  dispatch: ThunkDispatch,
  getState: () => RootState,
) => Promise<ReturnType> | ReturnType;

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const createDocumentDirectory = async (id: string) => {
  await delay(100);
  return `C:/Users/trey/${id}`;
};

const createPageDirectory = async (path: string, id: string) => {
  await delay(100);
  return `${path}/${id}`;
};

const writePageContents = async (_path: string, _content: string) => {
  throw new Error("LOL");
};

const fetchWorkspacesData = async (): Promise<Workspace[]> => {
  await delay(500);
  return [
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
};

export const createDocument = (): AppThunk => async (dispatch) => {
  const documentId = crypto.randomUUID();
  const document: Document = {
    id: documentId,
    path: `C:/Users/trey/${documentId}`,
    title: "New Document",
    pages: [],
    workspaceIds: [],
  };

  dispatch(addDocument(document));

  const pageId = crypto.randomUUID();
  const page: Page = {
    id: pageId,
    title: "New Page",
    content: "",
  };

  dispatch(addPage(documentId, page));

  try {
    const path = await createDocumentDirectory(documentId);
    try {
      const pagePath = await createPageDirectory(path, pageId);
      await writePageContents(pagePath, "");
    } catch (error) {
      console.error("Failed to create page", error);
    }
  } catch (error) {
    console.error("Failed to create document directory", error);
    dispatch(removeDocument(documentId));
  }
};

export const fetchWorkspaces = (): AppThunk => async (dispatch) => {
  try {
    const workspaces = await fetchWorkspacesData();
    workspaces.forEach((workspace) => {
      (workspace.documents ?? []).forEach((document) => {
        dispatch(addDocument(document));
      });
    });

    dispatch(
      setWorkspaces(workspaces.map(({ documents, ...workspace }) => workspace)),
    );
  } catch (error) {
    console.error("Failed to fetch workspaces", error);
  }
};
