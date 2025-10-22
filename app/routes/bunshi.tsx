import type { Route } from "./+types/bunshi";
import { Link } from "react-router";
import { useStore } from "@nanostores/react";
import { useMolecule, ScopeProvider } from "bunshi/react";
import { memo } from "react";
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
import { useMutation } from "../hooks";

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
 *
 * Memoized to prevent unnecessary re-renders when parent state changes.
 */
const PageItem = memo(function PageItem({
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
});

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

  const page = useStore(pageMol.page);

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
 *
 * Memoized to prevent unnecessary re-renders when parent state changes.
 */
const DocumentItem = memo(function DocumentItem({
  documentId,
}: {
  documentId: string;
}) {
  return (
    <ScopeProvider scope={DocumentScope} value={{ documentId }}>
      <DocumentContent />
    </ScopeProvider>
  );
});

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
  const document = useStore(documentMol.document);
  const metadata = useStore(documentMol.metadata);
  const isMetadataLoading = useStore(documentMol.isMetadataLoading);
  const isMetadataPersisting = useStore(documentMol.isMetadataPersisting);
  const pageIds = useStore(pagesRegistryMol.registryStore);
  const pagesCount = useStore(pagesRegistryMol.countStore);
  const workspaces = useStore(workspacesMol.workspaces);

  // Set up mutation for renaming
  const renameMutation = useMutation(documentMol.rename);

  // Event handlers call actions directly on molecules
  const handleRenameDocument = () => {
    const newTitle = prompt("Enter new document title:");
    if (newTitle && newTitle.trim()) {
      renameMutation.mutate(newTitle.trim());
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

  const handleUpdateDescription = () => {
    const description = prompt(
      "Enter document description:",
      metadata.description
    );
    if (description !== null) {
      documentMol.updateDescription(description);
    }
  };

  const handleAddTag = () => {
    const tag = prompt("Enter a tag:");
    if (tag && tag.trim()) {
      documentMol.addTag(tag.trim());
    }
  };

  const handleRemoveTag = (tag: string) => {
    documentMol.removeTag(tag);
  };

  const workspacesArray = Object.values(workspaces) as Workspace[];

  return (
    <div className="p-4 border rounded bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-lg">{document.title}</div>
        <div className="flex gap-2">
          <button
            onClick={handleRenameDocument}
            disabled={renameMutation.isLoading}
            className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {renameMutation.isLoading ? "Renaming..." : "Rename"}
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

      {/* Document Metadata Section (Disk-Persisted) */}
      <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-purple-900">
            📁 Document Metadata (Disk)
            {isMetadataLoading && (
              <span className="ml-2 text-xs text-purple-600">(Loading...)</span>
            )}
            {isMetadataPersisting && (
              <span className="ml-2 text-xs text-purple-600 animate-pulse">
                (Saving to disk...)
              </span>
            )}
          </div>
        </div>

        <div className="text-xs space-y-1 mb-2">
          <div>
            <span className="font-medium text-purple-800">Author:</span>{" "}
            <span className="text-purple-700">{metadata.author}</span>
          </div>
          <div>
            <span className="font-medium text-purple-800">Description:</span>{" "}
            <span className="text-purple-700">
              {metadata.description || "(No description)"}
            </span>
          </div>
          {metadata.tags.length > 0 && (
            <div>
              <span className="font-medium text-purple-800">Tags:</span>{" "}
              <div className="inline-flex gap-1 flex-wrap mt-1">
                {metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full text-xs"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-purple-900"
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-1">
          <button
            onClick={handleUpdateDescription}
            className="px-2 py-1 text-xs bg-purple-200 text-purple-800 rounded hover:bg-purple-300"
          >
            Edit Description
          </button>
          <button
            onClick={handleAddTag}
            className="px-2 py-1 text-xs bg-purple-200 text-purple-800 rounded hover:bg-purple-300"
          >
            Add Tag
          </button>
        </div>
      </div>

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
  const allDocuments = useStore(registryMol.registryStore);

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
            {workspacesArray.map((workspace) => {
              // Get documents that belong to this workspace
              const workspaceDocuments = Object.values(allDocuments).filter(
                (doc) => doc.workspaceIds.includes(workspace.id)
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
                    {workspace.id}
                  </div>
                  {workspaceDocuments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-emerald-300">
                      <div className="text-sm font-medium text-emerald-900 mb-2">
                        Documents ({workspaceDocuments.length}):
                      </div>
                      <ul className="space-y-1">
                        {workspaceDocuments.map((doc) => (
                          <li
                            key={doc.id}
                            className="text-sm text-emerald-800 pl-2"
                          >
                            • {doc.title}
                          </li>
                        ))}
                      </ul>
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
