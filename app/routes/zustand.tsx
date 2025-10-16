import type { Route } from "./+types/zustand";
import { useDocumentsStore } from "~/zustand/documents.store";
import { useWorkspacesStore } from "~/zustand/workspaces.store";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Zustand - State Management Testbed" },
    { name: "description", content: "Zustand state management example" },
  ];
}

export default function ZustandRoute() {
  const documents = useDocumentsStore((state) => state.documents);
  const createDocument = useDocumentsStore((state) => state.createDocument);
  const addDocumentToWorkspace = useDocumentsStore(
    (state) => state.addDocumentToWorkspace,
  );

  const workspaces = useWorkspacesStore((state) => state.workspaces);
  const fetchWorkspaces = useWorkspacesStore((state) => state.fetchWorkspaces);

  const handleCreateDocument = () => {
    createDocument();
  };

  const handleLoadWorkspaces = () => {
    fetchWorkspaces();
  };

  const handleAddToWorkspace = (documentId: string, workspaceId: string) => {
    addDocumentToWorkspace(documentId, workspaceId);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Zustand Example</h1>
      <p className="text-gray-600 mb-6">
        Using Zustand for simple, direct state management
      </p>

      <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded">
        <h3 className="font-semibold text-purple-900 mb-2">
          Implementation Details
        </h3>
        <p className="text-sm text-purple-800">
          Using <code className="bg-purple-100 px-1 rounded">zustand</code> with
          simple hooks. No reducers, no dispatch, no middleware - just direct
          function calls to create documents and pages in a coordinated
          workflow. Documents and workspaces are separate stores, demonstrating
          Zustand's support for multiple independent stores.
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
                doc.workspaceIds.includes(workspace.id),
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
