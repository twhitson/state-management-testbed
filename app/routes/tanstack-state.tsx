import type { Route } from "./+types/tanstack-state";
import { Link } from "react-router";
import { useSelector } from "@tanstack/react-store";
import { tanStackStateStore } from "~/tanstack-state/store";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TanStack State - State Management Testbed" },
    { name: "description", content: "TanStack Store state example" },
  ];
}

export default function TanStackStateRoute() {
  const documents = useSelector(
    tanStackStateStore,
    (state) => state.documents,
  );
  const workspaces = useSelector(
    tanStackStateStore,
    (state) => state.workspaces,
  );

  const handleCreateDocument = () => {
    tanStackStateStore.actions.createDocument();
  };

  const handleLoadWorkspaces = () => {
    tanStackStateStore.actions.fetchWorkspaces();
  };

  const handleAddToWorkspace = (documentId: string, workspaceId: string) => {
    tanStackStateStore.actions.addDocumentToWorkspace(documentId, workspaceId);
  };

  return (
    <div className="p-8">
      <Link
        to="/"
        className="inline-block mb-4 text-emerald-600 hover:text-emerald-800"
      >
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mb-2">TanStack State Example</h1>
      <p className="text-gray-600 mb-6">
        Using TanStack Store for framework-friendly state management
      </p>

      <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded">
        <h3 className="font-semibold text-emerald-900 mb-2">
          Implementation Details
        </h3>
        <p className="text-sm text-emerald-800 mb-2">
          Using{" "}
          <code className="bg-emerald-100 px-1 rounded">
            createStore()
          </code>{" "}
          from TanStack Store through the React adapter. Components read slices
          with{" "}
          <code className="bg-emerald-100 px-1 rounded">useSelector()</code>,
          and updates are grouped behind typed{" "}
          <code className="bg-emerald-100 px-1 rounded">store.actions</code>.
        </p>
        <p className="text-sm text-emerald-800 mb-2">
          The store keeps documents and workspaces together, which makes the
          async workspace load update both domains in a single state transition.
          Creating a document still demonstrates the same optimistic document
          and page workflow used by the other examples.
        </p>
        <p className="text-sm text-emerald-700">
          <strong>Key features:</strong> small API surface, framework-agnostic
          store core, selector-based React subscriptions, colocated actions, and
          regular async functions for side effects.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={handleCreateDocument}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Create Document
        </button>
        <button
          onClick={handleLoadWorkspaces}
          className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 ml-4"
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
                  className="p-4 border border-emerald-200 rounded bg-emerald-50"
                >
                  <div className="font-semibold text-lg text-emerald-900">
                    {workspace.name}
                  </div>
                  <div className="text-sm text-emerald-700 mt-1">
                    {workspaceDocs.length} document(s)
                  </div>
                  {workspaceDocs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {workspaceDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="text-sm text-emerald-800 pl-4"
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
                    .map((wsId) => workspaces[wsId]?.name || wsId)
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
                      .filter((ws) => !doc.workspaceIds.includes(ws.id))
                      .map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name}
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
