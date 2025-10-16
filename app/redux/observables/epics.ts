import type { AnyAction } from "@reduxjs/toolkit";
import type { Epic } from "redux-observable";
import { combineEpics } from "redux-observable";
import { EMPTY, concat, defer, from, of } from "rxjs";
import {
  catchError,
  concatMap,
  filter,
  ignoreElements,
  mergeMap,
  switchMap,
  tap,
} from "rxjs/operators";

import {
  addDocument,
  addPage,
  createDocumentRequest,
  type Document,
  type DocumentSliceState,
  type Page,
  removeDocument,
} from "../sagas/documents.slice";
import {
  fetchWorkspacesRequest,
  setWorkspaces,
  type Workspace,
  type WorkspaceSliceState,
} from "../sagas/workspaces.slice";

type RootState = {
  documents: DocumentSliceState;
  workspaces: WorkspaceSliceState;
};

const delay = (ms: number) =>
  new Promise((resolve) => {
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

const writePageContents = async () => {
  throw new Error("LOL");
};

type AppEpic = Epic<AnyAction, AnyAction, RootState>;

const createPageEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(createDocumentRequest.match),
    concatMap(() => {
      const documentId = crypto.randomUUID();
      const document: Document = {
        id: documentId,
        path: `C:/Users/trey/${documentId}`,
        title: "New Document",
        pages: [],
        workspaceIds: [],
      };

      const pageId = crypto.randomUUID();
      const page: Page = {
        id: pageId,
        title: "New Page",
        content: "",
      };

      const workflow$ = from(createDocumentDirectory(documentId)).pipe(
        mergeMap((path) =>
          from(createPageDirectory(path, pageId)).pipe(
            mergeMap((pagePath) =>
              from(writePageContents()).pipe(
                tap({
                  next: () => {
                    console.log("Created page contents", {
                      documentId,
                      pageId,
                      pagePath,
                    });
                  },
                }),
                ignoreElements(),
              ),
            ),
            catchError((error) => {
              console.error("Failed to create page directory", {
                documentId,
                pageId,
                error,
              });
              return EMPTY;
            }),
          ),
        ),
        catchError((error) => {
          console.error("Failed to create document directory", {
            documentId,
            error,
          });
          return of(removeDocument(documentId));
        }),
      );

      return concat(
        of(addDocument(document)),
        of(addPage({ documentId, page })),
        workflow$,
      );
    }),
  );

const fetchWorkspaces = async (): Promise<Workspace[]> => {
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

const fetchWorkspacesEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(fetchWorkspacesRequest.match),
    switchMap(() =>
      defer(fetchWorkspaces).pipe(
        mergeMap((workspaces) => {
          const documentActions = workspaces.flatMap((workspace) =>
            (workspace.documents ?? []).map((document) =>
              addDocument(document),
            ),
          );

          return concat(
            from(documentActions),
            of(
              setWorkspaces(
                workspaces.map(({ documents, ...workspace }) => workspace),
              ),
            ),
          );
        }),
        catchError((error) => {
          console.error("Failed to fetch workspaces", error);
          return EMPTY;
        }),
      ),
    ),
  );

export const rootEpic = combineEpics(createPageEpic, fetchWorkspacesEpic);
