import type { Route } from "./+types/effector";
import { Link } from "react-router";
import { useUnit } from "effector-react";
import {
  $documents,
  createDocumentRequested,
  documentAddedToWorkspace,
} from "../effector/documents.store";
import {
  $workspaces,
  fetchWorkspacesRequested,
} from "../effector/workspaces.store";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Effector - State Management Testbed" },
    { name: "description", content: "Effector event-driven state management" },
  ];
}

export default function EffectorRoute() {
  // useUnit() is the primary hook for subscribing to Effector stores
  // It can subscribe to multiple stores/events at once and is optimized for performance
  const documents = useUnit($documents);
  const workspaces = useUnit($workspaces);

  const handleCreateDocument = () => {
    // Events are called directly - no dispatch() needed!
    // This is one of Effector's key advantages: simple, direct API
    createDocumentRequested();
  };

  const handleLoadWorkspaces = () => {
    fetchWorkspacesRequested();
  };

  const handleAddToWorkspace = (documentId: string, workspaceId: string) => {
    documentAddedToWorkspace({ documentId, workspaceId });
  };

  return (
    <div className="p-8">
      <Link
        to="/"
        className="inline-block mb-4 text-purple-600 hover:text-purple-800"
      >
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mb-2">Effector Example</h1>
      <p className="text-gray-600 mb-6">
        Using Effector for event-driven state management
      </p>

      <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded">
        <h3 className="font-semibold text-purple-900 mb-2">
          Implementation Details
        </h3>
        <p className="text-sm text-purple-800 mb-2">
          Using <code className="bg-purple-100 px-1 rounded">Events</code>,{" "}
          <code className="bg-purple-100 px-1 rounded">Effects</code>, and{" "}
          <code className="bg-purple-100 px-1 rounded">Stores</code> from
          Effector. Events are called directly without dispatch(). Effects
          handle async operations with built-in loading states. Stores react
          automatically to events.
        </p>
        <p className="text-sm text-purple-700">
          <strong>Key features:</strong> Explicit event flow, first-class async
          support, excellent TypeScript inference, reactive programming model,
          and minimal boilerplate.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={handleCreateDocument}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Create Document
        </button>
        <button
          onClick={handleLoadWorkspaces}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 ml-4"
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
                doc.workspaceIds.includes(workspace.id)
              );
              return (
                <div
                  key={workspace.id}
                  className="p-4 border border-purple-200 rounded bg-purple-50"
                >
                  <div className="font-semibold text-lg text-purple-900">
                    {workspace.name}
                  </div>
                  <div className="text-sm text-purple-700 mt-1">
                    {workspaceDocs.length} document(s)
                  </div>
                  {workspaceDocs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {workspaceDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="text-sm text-purple-800 pl-4"
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
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddToWorkspace(doc.id, e.target.value);
                        e.target.value = "";
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
                <pre className="text-xs mt-2 text-gray-600 bg-gray-50 p-2 rounded overflow-auto">
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
