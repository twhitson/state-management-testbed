import type { Route } from "./+types/valtio";
import { Link } from "react-router";
import { useEffect } from "react";
import { useSnapshot } from "valtio";
import {
  documentsState,
  createDocument,
  renameDocument,
  addDocumentToWorkspace,
  type Document,
} from "../valtio/documents.store";
import { workspacesState, fetchWorkspaces } from "../valtio/workspaces.store";
import { initializePersistence } from "../valtio/persistence";
import { ValtioDevtools } from "../valtio/devtools-integration";
import { initializeStateMonitor } from "../valtio/devtools-monitor";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Valtio - State Management Testbed" },
    { name: "description", content: "Valtio proxy-based state management" },
  ];
}

/**
 * DocumentItem Component
 *
 * @remarks
 * This component renders a single document.
 * It uses useSnapshot to create a reactive snapshot of the document.
 * When this document changes, ONLY this component re-renders!
 *
 * This demonstrates Valtio's automatic fine-grained reactivity.
 */
function DocumentItem({ id }: { id: string }) {
  const documentsSnap = useSnapshot(documentsState);
  const workspacesSnap = useSnapshot(workspacesState);

  const document = documentsSnap.get(id);

  if (!document) {
    return null;
  }

  const handleRenameDocument = () => {
    const newTitle = prompt("Enter new document title:");
    if (newTitle && newTitle.trim()) {
      renameDocument(id, newTitle.trim());
    }
  };

  const handleAddToWorkspace = (workspaceId: string) => {
    addDocumentToWorkspace(id, workspaceId);
  };

  // Convert workspaces Map to array for iteration
  const workspacesArray = Array.from(workspacesSnap.values());

  return (
    <div className="p-4 border rounded">
      <div className="flex items-center justify-between">
        <div className="font-medium">{document.title}</div>
        <button
          onClick={handleRenameDocument}
          className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded hover:bg-teal-200"
        >
          Rename
        </button>
      </div>
      <div className="text-sm text-gray-500">{document.id}</div>
      <div className="text-sm mt-2">Pages: {document.pages.length}</div>
      {document.workspaces.length > 0 && (
        <div className="text-sm mt-2">
          <span className="font-medium">Workspaces: </span>
          {document.workspaces.map((ws) => ws.name).join(", ")}
        </div>
      )}
      {workspacesArray.length > 0 && (
        <div className="mt-3">
          <label className="text-sm font-medium mr-2">Add to workspace:</label>
          <select
            className="text-sm border rounded px-2 py-1"
            onChange={(e) => {
              if (e.target.value) {
                handleAddToWorkspace(e.target.value);
                e.target.value = "";
              }
            }}
            defaultValue=""
          >
            <option value="">Select workspace...</option>
            {workspacesArray
              .filter(
                (ws) => !document.workspaces.some((docWs) => docWs.id === ws.id)
              )
              .map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
          </select>
        </div>
      )}
      {document.pages.length > 0 && (
        <pre className="text-xs mt-2 text-gray-600 bg-gray-50 p-2 rounded overflow-auto">
          {JSON.stringify(document.pages, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function ValtioRoute() {
  // Initialize persistence system on mount
  useEffect(() => {
    const unsubscribe = initializePersistence();
    return unsubscribe;
  }, []);

  // Initialize state monitor for devtools
  useEffect(() => {
    const unsubscribe = initializeStateMonitor();
    return unsubscribe;
  }, []);

  // useSnapshot() creates a reactive snapshot of the proxy state
  // Components automatically re-render when accessed properties change
  const documentsSnap = useSnapshot(documentsState);
  const workspacesSnap = useSnapshot(workspacesState);

  // Convert proxyMap to array for rendering
  const documentIds = Array.from(documentsSnap.keys());
  const documentsArray = Array.from(documentsSnap.values());
  const workspacesArray = Array.from(workspacesSnap.values());

  const handleCreateDocument = () => {
    // Call the action directly - no hooks or dispatch needed
    createDocument();
  };

  const handleLoadWorkspaces = () => {
    fetchWorkspaces();
  };

  return (
    <>
      <ValtioDevtools />
      <div className="p-8">
        <Link
          to="/"
          className="inline-block mb-4 text-teal-600 hover:text-teal-800"
        >
          ← Home
        </Link>
        <h1 className="text-3xl font-bold mb-2">Valtio Example</h1>
        <p className="text-gray-600 mb-6">
          Using Valtio for proxy-based state management
        </p>

        <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded">
          <h3 className="font-semibold text-teal-900 mb-2">
            Implementation Details
          </h3>
          <p className="text-sm text-teal-800 mb-2">
            Using <code className="bg-teal-100 px-1 rounded">proxyMap()</code>{" "}
            from Valtio for document collection and{" "}
            <code className="bg-teal-100 px-1 rounded">proxy()</code> for nested
            objects. proxyMap provides efficient Map-based storage with O(1)
            lookups and natural iteration. Read state with{" "}
            <code className="bg-teal-100 px-1 rounded">useSnapshot()</code> and
            mutate it directly - no set() or reducers needed!
          </p>
          <p className="text-sm text-teal-800 mb-2">
            <strong>Direct Mutation:</strong> Valtio lets you mutate state
            directly like regular JavaScript objects. Just call{" "}
            <code className="bg-teal-100 px-1 rounded">
              documentsState.set(id, doc)
            </code>{" "}
            or{" "}
            <code className="bg-teal-100 px-1 rounded">
              document.title = "New"
            </code>
            . Valtio tracks changes and updates components automatically via
            structural sharing.
          </p>
          <p className="text-sm text-teal-800 mb-2">
            <strong>TanStack Devtools:</strong> Click the floating devtools
            button in the bottom-right corner to open the TanStack Devtools
            panel. The custom Valtio panel uses vanilla JS{" "}
            <code className="bg-teal-100 px-1 rounded">subscribe()</code> and{" "}
            <code className="bg-teal-100 px-1 rounded">snapshot()</code> from{" "}
            <code className="bg-teal-100 px-1 rounded">valtio/vanilla</code> to
            track state mutations. View current state snapshots, mutation
            history with timestamps, and state statistics in real-time.
          </p>
          <p className="text-sm text-teal-800 mb-2">
            <strong>Automatic Persistence:</strong> Each document has an
            automatic persistence system using{" "}
            <code className="bg-teal-100 px-1 rounded">subscribe()</code>. When
            a document changes, after 1.5 seconds of inactivity, it triggers
            parallel writes to both sessionStorage (3s delay) and localStorage
            (5s delay). Check the browser console to see persistence operations.
          </p>
          <p className="text-sm text-teal-800 mb-2">
            <strong>Fine-Grained Reactivity:</strong> Each DocumentItem
            component uses{" "}
            <code className="bg-teal-100 px-1 rounded">
              documentsSnap.get(id)
            </code>
            . When you rename a document, ONLY that specific component
            re-renders - not the entire list. Valtio automatically tracks which
            properties each component reads and only updates when those change.
          </p>
          <p className="text-sm text-teal-700">
            <strong>Key features:</strong> Zero boilerplate, mutable API,
            automatic fine-grained reactivity, proxyMap for collections,
            subscribe() for side effects, TanStack Devtools integration, and
            excellent TypeScript support. Valtio is simpler than Effector and
            more direct than Jotai.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={handleCreateDocument}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Create Document
          </button>
          <button
            onClick={handleLoadWorkspaces}
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 ml-4"
          >
            Load Workspaces
          </button>
        </div>

        {workspacesArray.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Workspaces ({workspacesArray.length})
            </h2>
            <div className="space-y-4">
              {workspacesArray.map((workspace) => {
                const workspaceDocs = documentsArray.filter((doc) =>
                  doc.workspaces.some((ws) => ws.id === workspace.id)
                );
                return (
                  <div
                    key={workspace.id}
                    className="p-4 border border-teal-200 rounded bg-teal-50"
                  >
                    <div className="font-semibold text-lg text-teal-900">
                      {workspace.name}
                    </div>
                    <div className="text-sm text-teal-700 mt-1">
                      {workspaceDocs.length} document(s)
                    </div>
                    {workspaceDocs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {workspaceDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="text-sm text-teal-800 pl-4"
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
            Documents ({documentIds.length})
          </h2>
          <div className="space-y-2">
            {documentIds.map((id) => (
              <DocumentItem key={id} id={id} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
