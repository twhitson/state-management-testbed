import { Context, Duration, Effect, Layer, SubscriptionRef } from "effect";
import { DevTools } from "@effect/experimental";

import type {
  Document,
  DocumentsState,
  Page,
  Workspace,
  WorkspacesState,
} from "./types";

export interface DocumentRepositoryService {
  readonly documents: SubscriptionRef.SubscriptionRef<DocumentsState>;
  readonly workspaces: SubscriptionRef.SubscriptionRef<WorkspacesState>;
  readonly createDocument: Effect.Effect<Document, never>;
  readonly addDocumentToWorkspace: (
    documentId: string,
    workspaceId: string,
  ) => Effect.Effect<void, never>;
  readonly fetchWorkspaces: Effect.Effect<WorkspacesState, never>;
}

export const DocumentRepository = Context.GenericTag<DocumentRepositoryService>(
  "app/effect-atom/DocumentRepository",
);

const createDocumentDirectory = (id: string) =>
  Effect.gen(function* () {
    yield* Effect.sleep(Duration.millis(100));
    return `C:/Users/trey/${id}`;
  });

const createPageDirectory = (path: string, id: string) =>
  Effect.gen(function* () {
    yield* Effect.sleep(Duration.millis(100));
    return `${path}/${id}`;
  });

// const writePageContents = (path: string, content: string) =>
//   Effect.gen(function* () {
//     yield* Effect.sleep(Duration.millis(100));
//   });

const writePageContents = (_path: string, _content: string) =>
  Effect.fail(new Error("LOL"));

export const DocumentRepositoryLive = Layer.effect(
  DocumentRepository,
  Effect.gen(function* () {
    const documentsRef = yield* SubscriptionRef.make<DocumentsState>({});
    const workspacesRef = yield* SubscriptionRef.make<WorkspacesState>({});

    const createPage = (documentId: string, path: string) =>
      Effect.gen(function* () {
        const pageId = crypto.randomUUID();

        yield* Effect.log(`Creating page ${pageId} for document ${documentId}`);

        const page: Page = {
          id: pageId,
          title: "New Page",
          content: "",
        };

        yield* SubscriptionRef.update(documentsRef, (documents) => {
          const document = documents[documentId];
          if (!document) {
            return documents;
          }
          return {
            ...documents,
            [documentId]: {
              ...document,
              pages: [...document.pages, page],
            },
          };
        });

        const pagePath = yield* createPageDirectory(path, pageId);

        yield* Effect.log(`Writing new page to ${pagePath}`);
        yield* writePageContents(pagePath, "");

        yield* Effect.log(`Created page ${pageId} for document ${documentId}`);
      }).pipe(
        Effect.withSpan("DocumentRepository.createPage", {
          attributes: { documentId },
        }),
      );

    const createDocument = Effect.gen(function* () {
      yield* Effect.log("Creating document");

      const documentId = crypto.randomUUID();
      const document: Document = {
        id: documentId,
        path: `C:/Users/trey/${documentId}`,
        title: "New Document",
        pages: [],
        workspaceIds: [],
      };

      yield* SubscriptionRef.update(documentsRef, (documents) => ({
        ...documents,
        [documentId]: document,
      }));

      const documentPath = yield* createDocumentDirectory(documentId);

      yield* Effect.catchAll(createPage(documentId, documentPath), (error) =>
        Effect.logError(
          `Failed to create page for document ${documentId}: ${String(error)}`,
        ),
      );

      yield* Effect.log(`Created document ${documentId}`);

      return document;
    }).pipe(Effect.withSpan("DocumentRepository.createDocument"));

    const addDocumentToWorkspace = (documentId: string, workspaceId: string) =>
      Effect.gen(function* () {
        yield* Effect.log(
          `Adding document ${documentId} to workspace ${workspaceId}`,
        );
        yield* SubscriptionRef.update(documentsRef, (documents) => {
          const document = documents[documentId];
          if (!document || document.workspaceIds.includes(workspaceId)) {
            return documents;
          }

          return {
            ...documents,
            [documentId]: {
              ...document,
              workspaceIds: [...document.workspaceIds, workspaceId],
            },
          };
        });
        yield* Effect.log(
          `Added document ${documentId} to workspace ${workspaceId}`,
        );
      }).pipe(
        Effect.withSpan("DocumentRepository.addDocumentToWorkspace", {
          attributes: { documentId, workspaceId },
        }),
      );

    const fetchWorkspaces = Effect.gen(function* () {
      yield* Effect.log("Fetching workspaces from DocumentRepositoryService");

      yield* Effect.sleep(Duration.millis(500));

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

      yield* SubscriptionRef.update(documentsRef, (documents) => {
        const next: DocumentsState = { ...documents };
        workspaces.forEach((workspace) => {
          workspace.documents?.forEach((document) => {
            next[document.id] = document;
          });
        });
        return next;
      });

      const workspacesRecord: WorkspacesState = {};
      workspaces.forEach((workspace) => {
        workspacesRecord[workspace.id] = {
          id: workspace.id,
          name: workspace.name,
        };
      });

      yield* SubscriptionRef.set(workspacesRef, workspacesRecord);

      yield* Effect.log(
        `Fetched workspaces: ${Object.keys(workspacesRecord).join(", ")}`,
      );

      return workspacesRecord;
    }).pipe(Effect.withSpan("DocumentRepository.fetchWorkspaces"));

    return {
      documents: documentsRef,
      workspaces: workspacesRef,
      createDocument,
      addDocumentToWorkspace,
      fetchWorkspaces,
    } satisfies DocumentRepositoryService;
  }),
);
