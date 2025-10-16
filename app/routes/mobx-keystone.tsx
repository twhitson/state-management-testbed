import type { Route } from "./+types/mobx-keystone";
import { Link } from "react-router";
import { observer } from "mobx-react-lite";
import {
  createRootStore,
  RootStoreProvider,
  useRootStore,
} from "~/mobx-keystone/store";
import { useMemo } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MobX-Keystone - State Management Testbed" },
    { name: "description", content: "MobX-Keystone state management example" },
  ];
}

/**
 * The main component wrapped with the store provider.
 *
 * @remarks
 * We create the root store at this level and provide it to the component tree.
 */
export default function MobXKeystoneRoute() {
  // Create the root store once using useMemo
  const rootStore = useMemo(() => createRootStore(), []);

  return (
    <RootStoreProvider value={rootStore}>
      <MobXKeystoneContent />
    </RootStoreProvider>
  );
}

/**
 * The content component that uses the store.
 *
 * @remarks
 * This component is wrapped with observer() to make it reactive to MobX changes.
 * When any observed data changes, this component will automatically re-render.
 */
const MobXKeystoneContent = observer(function MobXKeystoneContent() {
  const rootStore = useRootStore();
  const documentsStore = rootStore.documents;
  const workspacesStore = rootStore.workspaces;

  const documents = documentsStore.getAllDocuments();
  const workspaces = workspacesStore.getAllWorkspaces();

  const handleCreateDocument = () => {
    documentsStore.createDocument();
  };

  const handleLoadWorkspaces = () => {
    workspacesStore.fetchWorkspaces();
  };

  const handleAddToWorkspace = (documentId: string, workspaceId: string) => {
    const document = documentsStore.getDocument(documentId);
    if (document) {
      document.addToWorkspace(workspaceId);
    }
  };

  return (
    <div className="p-8">
      <Link
        to="/"
        className="inline-block mb-4 text-orange-600 hover:text-orange-800"
      >
        ← Home
      </Link>
      <h1 className="text-3xl font-bold mb-2">MobX-Keystone Example</h1>
      <p className="text-gray-600 mb-6">
        Using MobX-Keystone for observable models with type safety and runtime
        validation
      </p>

      <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded">
        <h3 className="font-semibold text-orange-900 mb-2">
          Implementation Details
        </h3>
        <p className="text-sm text-orange-800">
          Using{" "}
          <code className="bg-orange-100 px-1 rounded">mobx-keystone</code> with
          observable models. Actions are class methods decorated with
          @modelAction, async operations use @modelFlow with generators (like
          sagas but simpler). MobX automatically tracks dependencies and
          re-renders components when observed data changes. Models provide
          runtime type validation and a structured approach to state management.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={handleCreateDocument}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Create Document
        </button>
        <button
          onClick={handleLoadWorkspaces}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 ml-4"
        >
          Load Workspaces
        </button>
      </div>

      {workspaces.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Workspaces ({workspaces.length})
          </h2>
          <div className="space-y-4">
            {workspaces.map((workspace) => {
              const workspaceDocs = documents.filter((doc) =>
                doc.workspaceIds.includes(workspace.id),
              );
              return (
                <div
                  key={workspace.id}
                  className="p-4 border border-orange-200 rounded bg-orange-50"
                >
                  <div className="font-semibold text-lg text-orange-900">
                    {workspace.name}
                  </div>
                  <div className="text-sm text-orange-700 mt-1">
                    {workspaceDocs.length} document(s)
                  </div>
                  {workspaceDocs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {workspaceDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="text-sm text-orange-800 pl-4"
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
          Documents ({documents.length})
        </h2>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="p-4 border rounded">
              <div className="font-medium">{doc.title}</div>
              <div className="text-sm text-gray-500">{doc.id}</div>
              <div className="text-sm mt-2">Pages: {doc.pages.length}</div>
              {doc.workspaceIds.length > 0 && (
                <div className="text-sm mt-2">
                  <span className="font-medium">Workspaces: </span>
                  {doc.workspaceIds
                    .map(
                      (wsId) =>
                        workspacesStore.getWorkspace(wsId)?.name || wsId,
                    )
                    .join(", ")}
                </div>
              )}
              {workspaces.length > 0 && (
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
                    {workspaces
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
});
