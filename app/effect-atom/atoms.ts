import { Atom, Result } from "@effect-atom/atom-react";
import { DevTools } from "@effect/experimental";
import { Effect } from "effect";

import {
  DocumentRepository,
  DocumentRepositoryLive,
} from "./document-repository.service";
import type { DocumentsState, WorkspacesState } from "./types";

if (typeof window !== "undefined") {
  const devtoolsUrl = import.meta.env?.VITE_EFFECT_DEVTOOLS_URL;

  console.log("Enabling Effect devtools at", devtoolsUrl);

  Atom.runtime.addGlobalLayer(
    DevTools.layer(
      devtoolsUrl && devtoolsUrl.length > 0 ? devtoolsUrl : undefined,
    ),
  );
}

const runtime = Atom.runtime(DocumentRepositoryLive);

const documentsSourceAtom = runtime.subscriptionRef(
  Effect.map(DocumentRepository, (repository) => repository.documents),
);

const workspacesSourceAtom = runtime.subscriptionRef(
  Effect.map(DocumentRepository, (repository) => repository.workspaces),
);

export const documentsAtom = Atom.keepAlive(
  Atom.map(documentsSourceAtom, (result) =>
    Result.getOrElse(result, () => ({}) as DocumentsState),
  ),
);

export const workspacesAtom = Atom.keepAlive(
  Atom.map(workspacesSourceAtom, (result) =>
    Result.getOrElse(result, () => ({}) as WorkspacesState),
  ),
);

export const createDocumentAtom = runtime.fn(() =>
  Effect.flatMap(DocumentRepository, (repository) => repository.createDocument),
);

export const fetchWorkspacesAtom = runtime.fn(() =>
  Effect.flatMap(
    DocumentRepository,
    (repository) => repository.fetchWorkspaces,
  ),
);

export const addDocumentToWorkspaceAtom = runtime.fn(
  (input: { documentId: string; workspaceId: string }) =>
    Effect.flatMap(DocumentRepository, (repository) =>
      repository.addDocumentToWorkspace(input.documentId, input.workspaceId),
    ),
);
