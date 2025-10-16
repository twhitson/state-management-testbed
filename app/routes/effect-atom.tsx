import { useAtomSet, useAtomValue } from "@effect-atom/atom-react";
import type { Route } from "./+types/effect-atom";
import { Link } from "react-router";

import {
  addDocumentToWorkspaceAtom,
  createDocumentAtom,
  documentsAtom,
  fetchWorkspacesAtom,
  workspacesAtom,
} from "~/effect-atom/atoms";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Effect-Atom - State Management Testbed" },
    { name: "description", content: "Effect-Atom state management example" },
  ];
}

export default function EffectAtomRoute() {
  const documents = useAtomValue(documentsAtom);
  const workspaces = useAtomValue(workspacesAtom);

  const createDocument = useAtomSet(createDocumentAtom, { mode: "promise" });
  const fetchWorkspaces = useAtomSet(fetchWorkspacesAtom, { mode: "promise" });
  const addDocumentToWorkspace = useAtomSet(addDocumentToWorkspaceAtom, {
    mode: "promise",
  });

  const handleCreateDocument = () => {
    void createDocument().catch((error) => {
      console.error("Failed to create document:", error);
    });
  };

  const handleLoadWorkspaces = () => {
    void fetchWorkspaces().catch((error) => {
      console.error("Failed to fetch workspaces:", error);
    });
  };

  const handleAddToWorkspace = (documentId: string, workspaceId: string) => {
    void addDocumentToWorkspace({ documentId, workspaceId }).catch((error) => {
      console.error("Failed to add document to workspace:", error);
    });
  };

  return (
    <div className="p-8">
      <Link
        to="/"
        className="inline-block mb-4 text-amber-600 hover:text-amber-800"
      >
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mb-2">Effect-Atom Example</h1>
      <p className="text-gray-600 mb-6">
        Using Effect services with <code className="bg-amber-100 px-1 rounded">
          @effect-atom/atom
        </code>{" "}
        for reactive state
      </p>

      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded">
        <h3 className="font-semibold text-amber-900 mb-2">
          Implementation Details
        </h3>
        <p className="text-sm text-amber-800">
          A{" "}
          <code className="bg-amber-100 px-1 rounded">
            DocumentRepositoryService
          </code>{" "}
          holds the authoritative state in Effect{" "}
          <code className="bg-amber-100 px-1 rounded">SubscriptionRef</code>{" "}
          instances. Atoms just subscribe to those refs and invoke Effect
          workflows for document creation, optimistic page writes, and workspace
          loading, giving us Redux-style structure with Effect&apos;s resource
          safety.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={handleCreateDocument}
          className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
        >
          Create Document
        </button>
        <button
          onClick={handleLoadWorkspaces}
          className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 ml-4"
        >
          Load Workspaces
        </button>
      </div>

      {Object.keys(workspaces).length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Workspaces ({Object.keys(workspaces).length})
          </h2>
          <div className="space-y-4">
            {Object.values(workspaces).map((workspace) => {
              const workspaceDocs = Object.values(documents).filter((doc) =>
                doc.workspaceIds.includes(workspace.id),
              );
              return (
                <div
                  key={workspace.id}
                  className="p-4 border border-amber-200 rounded bg-amber-50"
                >
                  <div className="font-semibold text-lg text-amber-900">
                    {workspace.name}
                  </div>
                  <div className="text-sm text-amber-700 mt-1">
                    {workspaceDocs.length} document(s)
                  </div>
                  {workspaceDocs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {workspaceDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="text-sm text-amber-800 pl-4"
                        >
                          • {doc.title} ({doc.id})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Documents ({Object.keys(documents).length})
        </h2>
        <div className="space-y-2">
          {Object.values(documents).map((doc) => (
            <div key={doc.id} className="p-4 border rounded">
              <div className="font-medium">{doc.title}</div>
              <div className="text-sm text-gray-500">{doc.id}</div>
              <div className="text-sm mt-2">Pages: {doc.pages.length}</div>
              {doc.workspaceIds.length > 0 && (
                <div className="text-sm mt-2">
                  <span className="font-medium">Workspaces: </span>
                  {doc.workspaceIds
                    .map((workspaceId) => workspaces[workspaceId]?.name || workspaceId)
                    .join(", ")}
                </div>
              )}
              {Object.keys(workspaces).length > 0 && (
                <div className="mt-3">
                  <label className="text-sm font-medium mr-2">
                    Add to workspace:
                  </label>
                  <select
                    className="text-sm border rounded px-2 py-1"
                    onChange={(event) => {
                      if (event.target.value) {
                        handleAddToWorkspace(doc.id, event.target.value);
                        event.target.value = "";
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Select workspace...</option>
                    {Object.values(workspaces)
                      .filter((workspace) => !doc.workspaceIds.includes(workspace.id))
                      .map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              {doc.pages.length > 0 && (
                <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(doc.pages, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
