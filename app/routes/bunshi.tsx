import type { Route } from "./+types/bunshi";
import { Link } from "react-router";
import { useStore } from "@nanostores/react";
import { useMolecule, ScopeProvider } from "bunshi/react";
import {
  DocumentScope,
  PageScope,
  DocumentMolecule,
  PageMolecule,
  PagesRegistryMolecule,
  WorkspacesMolecule,
  DocumentsRegistryMolecule,
  type Workspace,
  type Page,
} from "../bunshi/molecules";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Bunshi - State Management Testbed" },
    {
      name: "description",
      content: "Bunshi dependency injection with Nanostores",
    },
  ];
}

/**
 * PageItem Component
 *
 * @remarks
 * This component wraps a page in its own Bunshi scope (nested within DocumentScope).
 * Each page gets its own PageMolecule instance with isolated state.
 */
function PageItem({
  documentId,
  pageId,
}: {
  documentId: string;
  pageId: string;
}) {
  return (
    <ScopeProvider scope={PageScope} value={{ documentId, pageId }}>
      <PageContent />
    </ScopeProvider>
  );
}

/**
 * PageContent Component
 *
 * @remarks
 * Rendered within a PageScope (which is within DocumentScope).
 * Uses useMolecule to access the scoped PageMolecule for this specific page.
 */
function PageContent() {
  const pageMol = useMolecule(PageMolecule);
  const pagesRegistryMol = useMolecule(PagesRegistryMolecule);

  const page = useStore(pageMol.store);

  const handleUpdateTitle = () => {
    const newTitle = prompt("Enter new page title:", page.title);
    if (newTitle && newTitle.trim()) {
      pageMol.updateTitle(newTitle.trim());
    }
  };

  const handleDeletePage = () => {
    if (confirm(`Delete page "${page.title}"?`)) {
      pagesRegistryMol.delete(page.id);
    }
  };

  return (
    <div className="text-xs bg-gray-50 p-2 rounded flex items-center justify-between">
      <div>
        <div className="font-medium">{page.title}</div>
        <div className="text-gray-500">{page.id}</div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={handleUpdateTitle}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Rename
        </button>
        <button
          onClick={handleDeletePage}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/**
 * DocumentItem Component
 *
 * @remarks
 * This component wraps a document in its own Bunshi scope.
 * The ScopeProvider creates an isolated context where DocumentMolecule
 * and PagesRegistryMolecule get their own instances for this specific document.
 */
function DocumentItem({ documentId }: { documentId: string }) {
  return (
    <ScopeProvider scope={DocumentScope} value={{ documentId }}>
      <DocumentContent />
    </ScopeProvider>
  );
}

/**
 * DocumentContent Component
 *
 * @remarks
 * Rendered within a DocumentScope. Uses useMolecule to access the scoped
 * molecule instances. Each molecule provides both state (stores) and
 * behavior (actions).
 */
function DocumentContent() {
  // Access scoped molecules (each document gets its own instance)
  const documentMol = useMolecule(DocumentMolecule);
  const pagesRegistryMol = useMolecule(PagesRegistryMolecule);

  // Access global molecules (shared across all documents)
  const workspacesMol = useMolecule(WorkspacesMolecule);
  const registryMol = useMolecule(DocumentsRegistryMolecule);

  // Subscribe to stores within molecules
  const document = useStore(documentMol.store);
  const pageIds = useStore(pagesRegistryMol.registryStore);
  const pagesCount = useStore(pagesRegistryMol.countStore);
  const workspaces = useStore(workspacesMol.workspaces);

  // Event handlers call actions directly on molecules
  const handleRenameDocument = () => {
    const newTitle = prompt("Enter new document title:");
    if (newTitle && newTitle.trim()) {
      documentMol.rename(newTitle.trim());
    }
  };

  const handleCreatePage = async () => {
    await pagesRegistryMol.create(document.path);
  };

  const handleDeleteDocument = () => {
    if (confirm(`Delete document "${document.title}"?`)) {
      registryMol.delete(document.id);
    }
  };

  const handleAddToWorkspace = (workspaceId: string) => {
    documentMol.addToWorkspace(workspaceId);
  };

  const workspacesArray = Object.values(workspaces) as Workspace[];

  return (
    <div className="p-4 border rounded bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-lg">{document.title}</div>
        <div className="flex gap-2">
          <button
            onClick={handleRenameDocument}
            className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
          >
            Rename
          </button>
          <button
            onClick={handleCreatePage}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Add Page
          </button>
          <button
            onClick={handleDeleteDocument}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-2">ID: {document.id}</div>

      <div className="text-sm mb-2">
        <span className="font-medium">Pages:</span> {pagesCount}
      </div>

      {document.workspaceIds.length > 0 && (
        <div className="text-sm mb-2">
          <span className="font-medium">Workspaces: </span>
          {document.workspaceIds
            .map((id) => workspaces[id]?.name || id)
            .join(", ")}
        </div>
      )}

      {workspacesArray.length > 0 && (
        <div className="mb-2">
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
              .filter((ws) => !document.workspaceIds.includes(ws.id))
              .map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
          </select>
        </div>
      )}

      {pageIds.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <div className="text-sm font-medium mb-2">Pages:</div>
          <div className="space-y-1">
            {pageIds.map((pageId) => (
              <PageItem key={pageId} documentId={document.id} pageId={pageId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BunshiRoute() {
  // Access global molecules
  const registryMol = useMolecule(DocumentsRegistryMolecule);
  const workspacesMol = useMolecule(WorkspacesMolecule);

  // Subscribe to stores within molecules
  const documentIds = useStore(registryMol.documentIdsStore);
  const documentsCount = useStore(registryMol.countStore);
  const workspacesArray = useStore(workspacesMol.workspaceArray);

  // Event handlers call actions directly on molecules
  const handleCreateDocument = async () => {
    await registryMol.create();
  };

  const handleLoadWorkspaces = async () => {
    await workspacesMol.fetch();
    // Load sample documents if none exist
    if (documentIds.length === 0) {
      registryMol.loadSamples();
    }
  };

  return (
    <div className="p-8">
      <Link
        to="/"
        className="inline-block mb-4 text-emerald-600 hover:text-emerald-800"
      >
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mb-2">Bunshi Example</h1>
      <p className="text-gray-600 mb-6">
        Using Bunshi for dependency injection with Nanostores
      </p>

      <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded">
        <h3 className="font-semibold text-emerald-900 mb-2">
          Implementation Details
        </h3>
        <p className="text-sm text-emerald-800 mb-2">
          <strong>Encapsulated Molecules:</strong> Each Bunshi molecule contains
          both nanostores (state) and actions (behavior) in a single unit. This
          provides perfect encapsulation and object-oriented design.
        </p>
        <p className="text-sm text-emerald-800 mb-2">
          <strong>Nested Scopes Hierarchy:</strong> Three-level scoping
          architecture:
        </p>
        <ul className="text-sm text-emerald-800 mb-2 ml-6 list-disc space-y-1">
          <li>
            <strong>Global:</strong>{" "}
            <code className="bg-emerald-100 px-1 rounded">
              DocumentsRegistryMolecule
            </code>
            ,{" "}
            <code className="bg-emerald-100 px-1 rounded">
              WorkspacesMolecule
            </code>
          </li>
          <li>
            <strong>DocumentScope:</strong>{" "}
            <code className="bg-emerald-100 px-1 rounded">
              DocumentMolecule
            </code>
            ,{" "}
            <code className="bg-emerald-100 px-1 rounded">
              PagesRegistryMolecule
            </code>
          </li>
          <li>
            <strong>PageScope (nested in DocumentScope):</strong>{" "}
            <code className="bg-emerald-100 px-1 rounded">PageMolecule</code>
          </li>
          <li>Each page is its own molecule with complete isolation!</li>
        </ul>
        <p className="text-sm text-emerald-800 mb-2">
          <strong>Usage Pattern:</strong>
        </p>
        <pre className="text-xs bg-emerald-100 p-2 rounded mb-2 overflow-x-auto">
          {`// Wrap in scope
<ScopeProvider scope={PageScope} value={{ pageId }}>
  <PageContent />
</ScopeProvider>

// Access molecule
const pageMol = useMolecule(PageMolecule);

// Subscribe to its state
const page = useStore(pageMol.store);

// Call its actions
pageMol.updateTitle("New Title");`}
        </pre>
        <p className="text-sm text-emerald-700">
          <strong>Benefits:</strong> Perfect encapsulation, nested scopes, each
          page/document is its own molecule, no shared state, automatic cleanup,
          and consistent scoping pattern throughout.
        </p>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <div className="text-sm text-blue-800">
          <strong>Documents Count:</strong> {documentsCount}
        </div>
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

      {workspacesArray.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Workspaces ({workspacesArray.length})
          </h2>
          <div className="space-y-4">
            {workspacesArray.map((workspace) => (
              <div
                key={workspace.id}
                className="p-4 border border-emerald-200 rounded bg-emerald-50"
              >
                <div className="font-semibold text-lg text-emerald-900">
                  {workspace.name}
                </div>
                <div className="text-sm text-emerald-700 mt-1">
                  {workspace.id}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Documents ({documentIds.length})
        </h2>
        {documentIds.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No documents yet. Create one to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {documentIds.map((id) => (
              <DocumentItem key={id} documentId={id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
