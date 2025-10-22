import type { Route } from "./+types/jotai";
import { Link } from "react-router";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { DevTools } from "jotai-devtools";
import "jotai-devtools/styles.css";
import {
  documentsAtom,
  documentIdsAtom,
  documentAtomFamily,
  createDocumentAtom,
  addDocumentToWorkspaceAtom,
  renameDocumentAtom,
  type Document,
} from "../jotai/documents.atoms";
import { workspacesAtom, fetchWorkspacesAtom } from "../jotai/workspaces.atoms";
import { persistenceManagerAtom } from "../jotai/persistence.manager";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Jotai - State Management Testbed" },
    { name: "description", content: "Jotai atomic state management" },
  ];
}

/**
 * Custom Hook: useDocument
 *
 * @remarks
 * A convenience hook that returns a specific document by ID.
 * Uses the documentAtomFamily to create a derived atom for the document.
 * This ensures fine-grained reactivity - only this component re-renders
 * when THIS specific document changes.
 */
function useDocument(id: string): Document | undefined {
  return useAtomValue(documentAtomFamily(id));
}

/**
 * DocumentItem Component
 *
 * @remarks
 * This component renders a single document.
 * It uses the useDocument hook to subscribe to only this specific document.
 * When this document changes, ONLY this component re-renders - not the entire list!
 *
 * This demonstrates Jotai's fine-grained reactivity pattern.
 */
function DocumentItem({ id }: { id: string }) {
  const document = useDocument(id);
  const workspaces = useAtomValue(workspacesAtom);
  const renameDocument = useSetAtom(renameDocumentAtom);
  const addDocumentToWorkspace = useSetAtom(addDocumentToWorkspaceAtom);

  if (!document) {
    return null;
  }

  const handleRenameDocument = () => {
    const newTitle = prompt("Enter new document title:");
    if (newTitle && newTitle.trim()) {
      renameDocument({ documentId: id, newTitle: newTitle.trim() });
    }
  };

  const handleAddToWorkspace = (workspaceId: string) => {
    addDocumentToWorkspace({ documentId: id, workspaceId });
  };

  return (
    <div className="p-4 border rounded">
      <div className="flex items-center justify-between">
        <div className="font-medium">{document.title}</div>
        <button
          onClick={handleRenameDocument}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
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
      {Object.keys(workspaces).length > 0 && (
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
            {Object.values(workspaces)
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

export default function JotaiRoute() {
  // Mount the persistence manager to activate automatic persistence
  useAtom(persistenceManagerAtom);

  // useAtomValue() reads atom values
  // useSetAtom() provides setters for write-only atoms
  const documents = useAtomValue(documentsAtom); // Still used for workspace filtering
  const documentIds = useAtomValue(documentIdsAtom); // Used for rendering individual documents
  const workspaces = useAtomValue(workspacesAtom);

  const createDocument = useSetAtom(createDocumentAtom);
  const fetchWorkspaces = useSetAtom(fetchWorkspacesAtom);

  const handleCreateDocument = () => {
    // Call the atom setter - it handles the async workflow
    createDocument();
  };

  const handleLoadWorkspaces = () => {
    fetchWorkspaces();
  };

  return (
    <>
      <DevTools />
      <div className="p-8">
        <Link
          to="/"
          className="inline-block mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Home
        </Link>
        <h1 className="text-3xl font-bold mb-2">Jotai Example</h1>
        <p className="text-gray-600 mb-6">
          Using Jotai for atomic state management
        </p>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-900 mb-2">
            Implementation Details
          </h3>
          <p className="text-sm text-blue-800 mb-2">
            Using <code className="bg-blue-100 px-1 rounded">atoms</code> from
            Jotai. Atoms are primitive units of state that can be composed
            together. Read atoms with{" "}
            <code className="bg-blue-100 px-1 rounded">useAtomValue()</code> and
            update them with{" "}
            <code className="bg-blue-100 px-1 rounded">useSetAtom()</code>.
            Async operations are handled within atom setters. Documents store
            direct references to workspace objects.
          </p>
          <p className="text-sm text-blue-800 mb-2">
            <strong>Fine-Grained Reactivity:</strong> Each document uses an
            individual{" "}
            <code className="bg-blue-100 px-1 rounded">useDocument(id)</code>{" "}
            hook with a derived atom. This means when you rename a document,
            ONLY that specific DocumentItem component re-renders - not the
            entire list. This is a key performance optimization in Jotai.
          </p>
          <p className="text-sm text-blue-800 mb-2">
            <strong>Automatic Persistence:</strong> Each document has an
            automatic persistence loop using jotai-effect. When a document
            changes, after 1.5 seconds of inactivity, it triggers parallel
            writes to both sessionStorage (3s delay) and localStorage (5s
            delay). Check the browser console to see persistence operations and
            DevTools Application tab to see stored data.
          </p>
          <p className="text-sm text-blue-800 mb-2">
            <strong>Jotai DevTools:</strong> The floating DevTools panel in the
            bottom-right corner lets you inspect all atoms, their values, and
            dependencies in real-time. You can track state changes, time-travel
            through history, and debug atom relationships.
          </p>
          <p className="text-sm text-blue-700">
            <strong>Key features:</strong> Minimal boilerplate, atomic state
            updates, excellent React integration, TypeScript support, and
            flexible composition. Jotai is more lightweight than Effector but
            still powerful.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={handleCreateDocument}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Document
          </button>
          <button
            onClick={handleLoadWorkspaces}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-4"
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
                  doc.workspaces.some((ws) => ws.id === workspace.id)
                );
                return (
                  <div
                    key={workspace.id}
                    className="p-4 border border-blue-200 rounded bg-blue-50"
                  >
                    <div className="font-semibold text-lg text-blue-900">
                      {workspace.name}
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      {workspaceDocs.length} document(s)
                    </div>
                    {workspaceDocs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {workspaceDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="text-sm text-blue-800 pl-4"
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
